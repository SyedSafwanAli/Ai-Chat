'use strict';

const { pool } = require('../config/db');

const MessageModel = {
  findByConversation: async (conversationId) => {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
    return rows;
  },

  create: async ({ conversation_id, sender, message, response_type = 'rule', rule_matched = null }) => {
    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched)
       VALUES (?, ?, ?, ?, ?)`,
      [conversation_id, sender, message, response_type, rule_matched]
    );
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE id = ?', [result.insertId]
    );
    return rows[0];
  },

  /**
   * Messages per day for the last N days — chart data.
   * Returns: [{ date: 'Feb 21', messages: 142 }, ...]
   */
  perDayForBusiness: async (businessId, days = 7) => {
    const [rows] = await pool.query(
      `SELECT
          DATE_FORMAT(m.created_at, '%b %e') AS date,
          COUNT(m.id)                         AS messages
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
        WHERE c.business_id = ?
          AND m.created_at >= NOW() - INTERVAL ? DAY
        GROUP BY DATE(m.created_at), DATE_FORMAT(m.created_at, '%b %e')
        ORDER BY DATE(m.created_at) ASC`,
      [businessId, days]
    );
    return rows;
  },

  /** Rule vs fallback breakdown for bot messages. */
  typeSummary: async (businessId) => {
    const [rows] = await pool.query(
      `SELECT
          m.response_type,
          COUNT(m.id) AS count
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
        WHERE c.business_id = ?
          AND m.sender = 'bot'
        GROUP BY m.response_type`,
      [businessId]
    );
    return rows;
  },
};

module.exports = MessageModel;
