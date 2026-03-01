'use strict';

/**
 * Easypaisa Hosted Checkout — Payments Controller
 *
 * Flow:
 *  1. Business user clicks Upgrade → POST /api/payments/create
 *  2. Backend inserts pending payment → generates Easypaisa checkout URL
 *  3. Frontend redirects to checkout_url
 *  4. Customer completes payment on Easypaisa
 *  5. Easypaisa POSTs result to POST /api/payments/webhook
 *  6. Backend verifies hash → upgrades package atomically
 *
 * ⚠ Package is ONLY upgraded via webhook — never from frontend redirect.
 *
 * Hash algorithm: HMAC-SHA256, Base64 encoded.
 * Adjust param order if Easypaisa sandbox returns "invalid hash" —
 * consult https://easypay.easypaisa.com.pk for latest integration guide.
 */

const crypto  = require('crypto');
const { pool }       = require('../config/db');
const { send, fail } = require('../utils/response.util');
const PACKAGES       = require('../config/packages');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate HMAC-SHA256 (Base64) for the Easypaisa checkout request.
 * Parameter order: storeId, amount, orderRefNum, transactionDateTime, postBackURL
 */
function generateRequestHash({ storeId, amount, orderRefNum, transactionDateTime, postBackURL }) {
  const raw = [storeId, amount, orderRefNum, transactionDateTime, postBackURL].join('&');
  return crypto
    .createHmac('sha256', process.env.EASYPAISA_HASH_KEY || '')
    .update(raw)
    .digest('base64');
}

/**
 * Verify HMAC-SHA256 hash from Easypaisa webhook callback.
 * Parameter order: storeId, amount, responseCode, paymentMethod,
 *                  transactionId, transactionDateTime, orderRefNum
 */
function verifyWebhookHash(params) {
  const raw = [
    process.env.EASYPAISA_STORE_ID || '',
    params.amount,
    params.responseCode,
    params.paymentMethod   || '',
    params.transactionId   || '',
    params.transactionDateTime || '',
    params.orderRefNum,
  ].join('&');

  const expected = crypto
    .createHmac('sha256', process.env.EASYPAISA_HASH_KEY || '')
    .update(raw)
    .digest('base64');

  return expected === params.merchantHashedReq;
}

/** Format Date to Easypaisa's required yyyyMMddHHmmss */
function formatDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// ─── POST /api/payments/create ────────────────────────────────────────────────

async function createPayment(req, res, next) {
  try {
    const { package_type } = req.body;

    if (!PACKAGES[package_type]) {
      return fail(res, 'Invalid package. Choose "basic" or "pro".', 400);
    }

    const pkg        = PACKAGES[package_type];
    const businessId = req.user.business_id;

    // Insert pending payment record
    const [result] = await pool.query(
      `INSERT INTO payments (business_id, amount, currency, package_type, status)
       VALUES (?, ?, 'PKR', ?, 'pending')`,
      [businessId, pkg.price, package_type]
    );
    const paymentId = result.insertId;

    // Create unique order reference: WAAI-{paymentId}-{timestamp}
    const orderRefNum = `WAAI-${paymentId}-${Date.now()}`;
    await pool.query('UPDATE payments SET order_ref = ? WHERE id = ?', [orderRefNum, paymentId]);

    // Build Easypaisa parameters
    const storeId             = process.env.EASYPAISA_STORE_ID || 'STORE_ID';
    const amount              = pkg.price.toFixed(2);
    const transactionDateTime = formatDateTime();
    const postBackURL         = process.env.EASYPAISA_WEBHOOK_URL || 'http://localhost:5000/api/payments/webhook';
    const successUrl          = process.env.EASYPAISA_SUCCESS_URL || 'http://localhost:3000/billing?payment=success';
    const failUrl             = process.env.EASYPAISA_FAIL_URL    || 'http://localhost:3000/billing?payment=failed';

    const merchantHashedReq = generateRequestHash({
      storeId,
      amount,
      orderRefNum,
      transactionDateTime,
      postBackURL,
    });

    // Build redirect URL (GET-based hosted checkout)
    const baseUrl = process.env.EASYPAISA_API_URL || 'https://easypay.easypaisa.com.pk';
    const params  = new URLSearchParams({
      storeId,
      amount,
      orderRefNum,
      transactionDateTime,
      postBackURL,
      autoRedirect:       '1',
      merchantSuccessURL: successUrl,
      merchantFailureURL: failUrl,
      merchantHashedReq,
    });

    const checkout_url = `${baseUrl}/easypay/Index.jsf?${params.toString()}`;

    return send(res, { checkout_url, payment_id: paymentId, order_ref: orderRefNum }, 'Checkout session created.');
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payments/webhook ───────────────────────────────────────────────

async function paymentWebhook(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const {
      responseCode,
      transactionId,
      orderRefNum,
      amount,
      transactionDateTime,
      paymentMethod,
      merchantHashedReq,
    } = req.body;

    // 1. Verify Easypaisa hash signature
    const hashValid = verifyWebhookHash({
      responseCode,
      transactionId,
      orderRefNum,
      amount,
      transactionDateTime,
      paymentMethod,
      merchantHashedReq,
    });

    // In sandbox mode, skip hash check if EASYPAISA_HASH_KEY not set
    const sandboxMode = !process.env.EASYPAISA_HASH_KEY;
    if (!sandboxMode && !hashValid) {
      console.error('[payments:webhook] Invalid hash for orderRef:', orderRefNum);
      return res.status(400).json({ success: false, message: 'Invalid signature.' });
    }

    // 2. Find payment by order reference
    const [[payment]] = await pool.query(
      'SELECT * FROM payments WHERE order_ref = ? LIMIT 1',
      [orderRefNum]
    );

    if (!payment) {
      console.error('[payments:webhook] Payment not found for orderRef:', orderRefNum);
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // 3. Idempotency — already processed successfully
    if (payment.status === 'success') {
      return res.status(200).json({ success: true, message: 'Already processed.' });
    }

    // 4. Handle payment failure
    if (responseCode !== '0000') {
      await pool.query(
        `UPDATE payments SET status = 'failed', easypaisa_transaction_id = ? WHERE id = ?`,
        [transactionId || null, payment.id]
      );
      console.log(`[payments:webhook] Payment FAILED — orderRef=${orderRefNum} code=${responseCode}`);
      return res.status(200).json({ success: true, message: 'Payment failure recorded.' });
    }

    // 5. Validate amount matches DB record (prevent amount tampering)
    if (Math.abs(parseFloat(amount) - parseFloat(payment.amount)) > 0.01) {
      console.error(`[payments:webhook] Amount mismatch — expected=${payment.amount} got=${amount}`);
      return res.status(400).json({ success: false, message: 'Amount mismatch.' });
    }

    const pkg = PACKAGES[payment.package_type];
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Unknown package type.' });
    }

    // 6. Atomic update — payment + business package + audit log
    await conn.beginTransaction();

    // Mark payment as success
    await conn.query(
      `UPDATE payments
         SET status = 'success', easypaisa_transaction_id = ?, paid_at = NOW()
       WHERE id = ?`,
      [transactionId, payment.id]
    );

    // Upgrade business package (extend from expiry if still valid, else from now)
    await conn.query(
      `UPDATE businesses
         SET package        = ?,
             package_expiry = IF(
               package_expiry IS NOT NULL AND package_expiry > NOW(),
               DATE_ADD(package_expiry, INTERVAL ? DAY),
               DATE_ADD(NOW(),          INTERVAL ? DAY)
             ),
             credit_balance = credit_balance + ?,
             status         = 'active'
       WHERE id = ?`,
      [payment.package_type, pkg.durationDays, pkg.durationDays, pkg.credits, payment.business_id]
    );

    // Audit log — get manager's user_id for admin_id FK
    try {
      const [[manager]] = await conn.query(
        `SELECT id FROM users WHERE business_id = ? AND role = 'manager' LIMIT 1`,
        [payment.business_id]
      );
      if (manager) {
        await conn.query(
          `INSERT INTO super_admin_logs (admin_id, action, target_business_id)
           VALUES (?, ?, ?)`,
          [
            manager.id,
            `PAYMENT_SUCCESS pkg=${payment.package_type} amount=PKR${amount} ep_txn=${transactionId}`,
            payment.business_id,
          ]
        );
      }
    } catch (auditErr) {
      // Non-fatal — log but don't fail the transaction
      console.error('[payments:webhook] Audit log failed:', auditErr.message);
    }

    await conn.commit();

    console.log(`[payments:webhook] ✅ Success — business=${payment.business_id} pkg=${payment.package_type} txn=${transactionId}`);
    return res.status(200).json({ success: true, message: 'Payment processed.' });

  } catch (err) {
    await conn.rollback();
    console.error('[payments:webhook] Error:', err.message);
    next(err);
  } finally {
    conn.release();
  }
}

// ─── GET /api/payments/billing-info ──────────────────────────────────────────
// Returns current package status + recent payments (no package check required)

async function getBillingInfo(req, res, next) {
  try {
    const businessId = req.user.business_id;

    // Get business package info directly (bypass BusinessModel to get all fields)
    const [[biz]] = await pool.query(
      `SELECT name, package, package_expiry, credit_balance, credits_used, status
       FROM businesses WHERE id = ? LIMIT 1`,
      [businessId]
    );

    if (!biz) return fail(res, 'Business not found.', 404);

    // Last 10 payments
    const [payments] = await pool.query(
      `SELECT id, order_ref, amount, currency, package_type, status,
              easypaisa_transaction_id, created_at, paid_at
       FROM payments
       WHERE business_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [businessId]
    );

    // Attach package config metadata
    const packageMeta = PACKAGES[biz.package] ?? null;

    return send(res, {
      business: {
        name:           biz.name,
        package:        biz.package,
        package_expiry: biz.package_expiry,
        credit_balance: Number(biz.credit_balance),
        credits_used:   Number(biz.credits_used),
        status:         biz.status,
      },
      packageMeta,
      plans:    PACKAGES,
      payments,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPayment, paymentWebhook, getBillingInfo };
