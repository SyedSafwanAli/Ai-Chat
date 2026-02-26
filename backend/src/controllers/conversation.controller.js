'use strict';

const ConversationModel = require('../models/conversation.model');
const { pool }          = require('../config/db');
const { send, fail }    = require('../utils/response.util');

/** GET /api/conversations */
async function listConversations(req, res, next) {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const { rows, total } = await ConversationModel.findAll(req.user.business_id, {
      status, search,
      limit:  parseInt(limit,  10),
      offset: parseInt(offset, 10),
    });
    return send(res, { conversations: rows, total, limit: +limit, offset: +offset });
  } catch (err) { next(err); }
}

/** GET /api/conversations/:id */
async function getConversation(req, res, next) {
  try {
    const conversation = await ConversationModel.findById(parseInt(req.params.id, 10), req.user.business_id);
    if (!conversation) return fail(res, 'Conversation not found', 404);
    return send(res, { conversation });
  } catch (err) { next(err); }
}

/** PATCH /api/conversations/:id/status */
async function updateLeadStatus(req, res, next) {
  try {
    const { lead_status } = req.body;
    if (!['hot', 'warm', 'cold'].includes(lead_status))
      return fail(res, 'lead_status must be hot, warm, or cold', 400);

    const updated = await ConversationModel.updateLeadStatus(
      parseInt(req.params.id, 10), req.user.business_id, lead_status
    );
    if (!updated) return fail(res, 'Conversation not found', 404);
    return send(res, { conversation: updated }, 'Lead status updated');
  } catch (err) { next(err); }
}

/** PATCH /api/conversations/:id/contacted */
async function markContacted(req, res, next) {
  try {
    const { contacted = true } = req.body;
    const updated = await ConversationModel.markContacted(
      parseInt(req.params.id, 10), req.user.business_id, Boolean(contacted)
    );
    if (!updated) return fail(res, 'Conversation not found', 404);
    return send(res, { conversation: updated }, 'Marked as contacted');
  } catch (err) { next(err); }
}

/** POST /api/conversations/:id/reply — manual reply from dashboard */
async function sendReply(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return fail(res, 'Message is required.', 400);

    const convId     = parseInt(req.params.id, 10);
    const businessId = req.user.business_id;

    const [[conv]] = await pool.query(
      'SELECT id FROM conversations WHERE id = ? AND business_id = ?',
      [convId, businessId]
    );
    if (!conv) return fail(res, 'Conversation not found.', 404);

    await pool.query(
      'INSERT INTO messages (conversation_id, sender, message, response_type) VALUES (?, ?, ?, ?)',
      [convId, 'bot', message.trim(), 'manual']
    );
    await pool.query(
      'UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?',
      [message.trim(), convId]
    );

    return send(res, {}, 'Reply sent.');
  } catch (err) { next(err); }
}

/** GET /api/leads — hot + warm conversations */
async function listLeads(req, res, next) {
  try {
    const businessId = req.user.business_id;
    const { search, limit = 50, offset = 0 } = req.query;

    let where  = `WHERE c.business_id = ? AND c.lead_status IN ('hot','warm')`;
    const params = [businessId];

    if (search) {
      where += ' AND (c.customer_name LIKE ? OR c.customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM conversations c ${where}`, params
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query(
      `SELECT c.*,
              (SELECT message FROM messages
                WHERE conversation_id = c.id AND sender = 'customer'
                ORDER BY created_at DESC LIMIT 1) AS last_customer_message
         FROM conversations c
        ${where}
        ORDER BY c.lead_status = 'hot' DESC, c.last_message_at DESC
        LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return send(res, { leads: rows, total });
  } catch (err) { next(err); }
}

module.exports = {
  listConversations, getConversation,
  updateLeadStatus,  markContacted, sendReply, listLeads,
};
