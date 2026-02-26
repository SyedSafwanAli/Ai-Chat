'use strict';

const { pool } = require('../config/db');

const ConversationModel = {
  /** Paginated list with optional status / search filter. */
  findAll: async (businessId, { status, search, limit = 50, offset = 0 } = {}) => {
    let where  = 'WHERE business_id = ?';
    const params = [businessId];

    if (status && status !== 'all') {
      where += ' AND lead_status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (customer_name LIKE ? OR customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM conversations ${where}`,
      params
    );
    const total = countRows[0].total;

    // Data page
    const [rows] = await pool.query(
      `SELECT * FROM conversations ${where}
        ORDER BY last_message_at DESC, updated_at DESC
        LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return { rows, total };
  },

  /** Single conversation with all its messages. */
  findById: async (id, businessId) => {
    const [convRows] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (!convRows[0]) return null;

    const [msgRows] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [id]
    );
    return { ...convRows[0], messages: msgRows };
  },

  /** Find most recent conversation by phone (used in webhook). */
  findByPhone: async (businessId, customerPhone) => {
    const [rows] = await pool.query(
      `SELECT * FROM conversations
        WHERE business_id = ? AND customer_phone = ?
        ORDER BY updated_at DESC
        LIMIT 1`,
      [businessId, customerPhone]
    );
    return rows[0] || null;
  },

  create: async (businessId, { customer_name, customer_phone, platform = 'whatsapp' }) => {
    const [result] = await pool.query(
      `INSERT INTO conversations (business_id, customer_name, customer_phone, platform)
       VALUES (?, ?, ?, ?)`,
      [businessId, customer_name || null, customer_phone, platform]
    );
    const [rows] = await pool.query(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  },

  /** Escalate lead status — never downgrade. */
  updateLeadStatus: async (id, businessId, lead_status) => {
    const hierarchy = { hot: 3, warm: 2, cold: 1 };
    const [current] = await pool.query(
      'SELECT lead_status FROM conversations WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (!current[0]) return null;

    const newStatus =
      hierarchy[lead_status] > hierarchy[current[0].lead_status]
        ? lead_status
        : current[0].lead_status;

    await pool.query(
      'UPDATE conversations SET lead_status = ? WHERE id = ? AND business_id = ?',
      [newStatus, id, businessId]
    );
    const [rows] = await pool.query(
      'SELECT * FROM conversations WHERE id = ?', [id]
    );
    return rows[0];
  },

  markContacted: async (id, businessId, value = true) => {
    await pool.query(
      'UPDATE conversations SET is_contacted = ? WHERE id = ? AND business_id = ?',
      [value ? 1 : 0, id, businessId]
    );
    const [rows] = await pool.query(
      'SELECT * FROM conversations WHERE id = ?', [id]
    );
    return rows[0] || null;
  },

  updateLastMessage: async (id, message) => {
    await pool.query(
      `UPDATE conversations
          SET last_message = ?, last_message_at = NOW()
        WHERE id = ?`,
      [message, id]
    );
  },
};

module.exports = ConversationModel;
