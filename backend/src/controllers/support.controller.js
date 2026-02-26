'use strict';

const { pool }       = require('../config/db');
const { send, fail } = require('../utils/response.util');

// ─── User-facing support endpoints ────────────────────────────────────────────

/**
 * GET /api/support
 * Returns all support messages for the logged-in user (their conversation thread).
 */
async function getMyMessages(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, message, sender, created_at
       FROM   support_messages
       WHERE  user_id = ?
       ORDER  BY created_at ASC`,
      [req.user.id]
    );
    return send(res, { messages: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/support
 * Body: { message }
 * Sends a message from the user to admin.
 */
async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return fail(res, 'Message is required.', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO support_messages (user_id, message, sender)
       VALUES (?, ?, 'user')`,
      [req.user.id, message.trim()]
    );

    const [rows] = await pool.query(
      'SELECT id, message, sender, created_at FROM support_messages WHERE id = ?',
      [result.insertId]
    );

    return send(res, { message: rows[0] }, 'Message sent.', 201);
  } catch (err) {
    next(err);
  }
}

// ─── Admin-facing support endpoints ───────────────────────────────────────────

/**
 * GET /api/admin/support
 * Returns all support threads grouped by user (admin view).
 */
async function getAllThreads(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT sm.id, sm.message, sm.sender, sm.created_at,
              u.id AS user_id, u.email AS user_email,
              b.id AS business_id, b.name AS business_name,
              u.status AS user_status
       FROM   support_messages sm
       JOIN   users      u ON u.id = sm.user_id
       LEFT   JOIN businesses b ON b.id = u.business_id
       ORDER  BY sm.created_at DESC
       LIMIT  200`
    );
    return send(res, { messages: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support/:userId
 * Body: { message }
 * Sends a reply from admin to a specific user.
 */
async function replyToUser(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { message } = req.body;

    if (!message || !message.trim()) {
      return fail(res, 'Message is required.', 400);
    }

    // Verify the target user exists
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!users.length) {
      return fail(res, 'User not found.', 404);
    }

    const [result] = await pool.query(
      `INSERT INTO support_messages (user_id, message, sender)
       VALUES (?, ?, 'admin')`,
      [userId, message.trim()]
    );

    const [rows] = await pool.query(
      'SELECT id, message, sender, created_at FROM support_messages WHERE id = ?',
      [result.insertId]
    );

    return send(res, { message: rows[0] }, 'Reply sent.', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyMessages, sendMessage, getAllThreads, replyToUser };
