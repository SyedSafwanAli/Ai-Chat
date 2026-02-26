'use strict';

/**
 * ─── Webhook Controller ───────────────────────────────────────────────────────
 *
 * Handles:
 *  1. WhatsApp Cloud API webhook verification (GET)
 *  2. Incoming WhatsApp message processing   (POST)
 *
 * Multi-tenant routing:
 *   Incoming payload contains phone_number_id → look up business by
 *   businesses.whatsapp_phone_number_id → process for that business.
 *
 * Message pipeline (POST):
 *   Parse → Resolve Business → Find/Create Conversation → Save Customer Message
 *   → Check Credits → Run Rule Engine → Detect Lead Status
 *   → Save Bot Reply → Update Conversation Snapshot
 *   → Deliver Reply using business's own WhatsApp token
 */

const ConversationModel     = require('../models/conversation.model');
const MessageModel          = require('../models/message.model');
const { processMessage }    = require('../services/ruleEngine.service');
const { detectLeadStatus }  = require('../services/leadDetector.service');
const { pool }              = require('../config/db');
const logger                = require('../utils/logger.util');

// ─── Business resolver ────────────────────────────────────────────────────────

/**
 * Find the business that owns a given WhatsApp phone_number_id.
 * Returns { id, whatsapp_token } or null.
 */
async function resolveBusinessByPhoneNumberId(phoneNumberId) {
  const [[biz]] = await pool.query(
    `SELECT id, whatsapp_token
       FROM businesses
      WHERE whatsapp_phone_number_id = ?
        AND status = 'active'
      LIMIT 1`,
    [phoneNumberId]
  );
  return biz || null;
}

// ─── Credit helpers ───────────────────────────────────────────────────────────

async function hasCredits(businessId) {
  try {
    const [[biz]] = await pool.query(
      'SELECT credit_balance FROM businesses WHERE id = ? LIMIT 1',
      [businessId]
    );
    if (!biz) return false;
    return parseFloat(biz.credit_balance) > 0;
  } catch {
    return true;
  }
}

async function deductCredit(businessId) {
  try {
    await pool.query(
      `UPDATE businesses
         SET credit_balance = GREATEST(credit_balance - 1, 0),
             credits_used   = credits_used + 1
        WHERE id = ?`,
      [businessId]
    );
  } catch (err) {
    logger.error('[Webhook] Credit deduction failed:', err.message);
  }
}

// ─── WhatsApp Cloud API verification handshake ────────────────────────────────

function verifyWebhook(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('[Webhook] WhatsApp verification successful');
    return res.status(200).send(challenge);
  }

  logger.warn('[Webhook] Verification failed — token mismatch');
  return res.status(403).json({ error: 'Verification failed' });
}

// ─── Parse helpers ────────────────────────────────────────────────────────────

/**
 * Normalise an incoming payload to { phoneNumberId, from, name, text }.
 *
 * Supports:
 *   a) WhatsApp Cloud API format (entry[].changes[].value.messages[])
 *   b) Simple test format: { from, name, message, business_id }
 */
function parsePayload(body) {
  // WhatsApp Cloud API format
  if (body.object === 'whatsapp_business_account') {
    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const msg     = value?.messages?.[0];

    if (!msg || msg.type !== 'text') return null;

    const contact = value?.contacts?.[0];
    return {
      phoneNumberId: value?.metadata?.phone_number_id || null,
      from:          msg.from,
      name:          contact?.profile?.name || 'Customer',
      text:          msg.text?.body || '',
      testBusinessId: null,
    };
  }

  // Simple test / direct format: { from, message, name?, business_id? }
  if (body.from && body.message) {
    return {
      phoneNumberId:  null,
      from:           body.from,
      name:           body.name || 'Customer',
      text:           body.message,
      testBusinessId: body.business_id ? parseInt(body.business_id, 10) : null,
    };
  }

  return null;
}

// ─── Reply delivery ───────────────────────────────────────────────────────────

/**
 * Send a WhatsApp message using the business's own token.
 * Falls back to console log if no token is configured.
 */
async function deliverReply(to, replyText, bizToken) {
  const apiToken   = bizToken || process.env.WHATSAPP_API_TOKEN;
  const phoneNumId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl     = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';

  if (!apiToken || apiToken === 'your_permanent_api_token_here') {
    logger.info('─'.repeat(60));
    logger.info(`[WhatsApp → ${to}] (mock — no token configured)`);
    logger.info(replyText);
    logger.info('─'.repeat(60));
    return { mock: true };
  }

  const fetch    = (await import('node-fetch')).default;
  const endpoint = `${apiUrl}/${phoneNumId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: replyText },
  };

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    logger.error('[WhatsApp API] Send failed:', JSON.stringify(result));
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  logger.info(`[WhatsApp API] Message sent to ${to}`, result);
  return result;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handleIncomingMessage(req, res) {
  // Acknowledge immediately so WhatsApp does not retry
  res.status(200).json({ status: 'received' });

  try {
    const parsed = parsePayload(req.body);

    if (!parsed) {
      logger.warn('[Webhook] Unrecognised payload format or non-text message');
      return;
    }

    const { phoneNumberId, from: customerPhone, name: customerName, text: message, testBusinessId } = parsed;

    // ── Resolve which business this message belongs to ─────────────────────────
    let businessId;
    let bizToken = null;

    if (testBusinessId) {
      // Test payload with explicit business_id
      businessId = testBusinessId;
      logger.info(`[Webhook] Test mode — using business_id=${businessId}`);
    } else if (phoneNumberId) {
      // Real WhatsApp payload — look up by phone_number_id
      const biz = await resolveBusinessByPhoneNumberId(phoneNumberId);
      if (!biz) {
        logger.warn(`[Webhook] No active business found for phone_number_id="${phoneNumberId}"`);
        return;
      }
      businessId = biz.id;
      bizToken   = biz.whatsapp_token;
      logger.info(`[Webhook] Resolved business #${businessId} for phone_number_id="${phoneNumberId}"`);
    } else {
      logger.warn('[Webhook] Cannot resolve business — no phoneNumberId or business_id in payload');
      return;
    }

    logger.info(`[Webhook] Incoming from ${customerPhone} → business #${businessId}: "${message}"`);

    // ── 1. Find or create conversation ────────────────────────────────────────
    let conversation = await ConversationModel.findByPhone(businessId, customerPhone);

    if (!conversation) {
      conversation = await ConversationModel.create(businessId, {
        customer_name:  customerName,
        customer_phone: customerPhone,
        platform:       'whatsapp',
      });
      logger.info(`[Webhook] New conversation created: #${conversation.id}`);
    }

    // ── 2. Persist customer message ───────────────────────────────────────────
    await MessageModel.create({
      conversation_id: conversation.id,
      sender:          'customer',
      message,
    });

    // ── 3. Check credit balance before replying ───────────────────────────────
    const creditsOk = await hasCredits(businessId);
    if (!creditsOk) {
      logger.warn(`[Webhook] Business #${businessId} has no credits — reply blocked`);
      return;
    }

    // ── 4. Run rule engine ────────────────────────────────────────────────────
    const { reply, type, ruleName } = await processMessage(message, businessId);

    logger.info(`[RuleEngine] Rule matched: "${ruleName}" | Type: ${type}`);

    // ── 5. Detect and update lead status ──────────────────────────────────────
    const { status: newStatus, changed } = await detectLeadStatus(
      message,
      businessId,
      conversation.lead_status
    );

    if (changed) {
      await ConversationModel.updateLeadStatus(conversation.id, businessId, newStatus);
      logger.info(
        `[LeadDetector] #${conversation.id} upgraded: ` +
        `${conversation.lead_status} → ${newStatus}`
      );
    }

    // ── 6. Persist bot reply ──────────────────────────────────────────────────
    await MessageModel.create({
      conversation_id: conversation.id,
      sender:          'bot',
      message:         reply,
      response_type:   type,
      rule_matched:    ruleName,
    });

    // ── 7. Update last_message snapshot ───────────────────────────────────────
    await ConversationModel.updateLastMessage(conversation.id, message);

    // ── 8. Deliver reply + deduct 1 credit ────────────────────────────────────
    await deliverReply(customerPhone, reply, bizToken);
    await deductCredit(businessId);
    logger.info(`[Webhook] 1 credit deducted from business #${businessId}`);

  } catch (err) {
    logger.error('[Webhook] Processing error:', err.message);
  }
}

module.exports = { verifyWebhook, handleIncomingMessage };
