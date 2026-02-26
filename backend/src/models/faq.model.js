'use strict';

const { pool } = require('../config/db');

const FAQModel = {
  findAll: async (businessId) => {
    const [rows] = await pool.query(
      'SELECT * FROM faqs WHERE business_id = ? ORDER BY created_at ASC',
      [businessId]
    );
    return rows;
  },

  findById: async (id, businessId) => {
    const [rows] = await pool.query(
      'SELECT * FROM faqs WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    return rows[0] || null;
  },

  create: async (businessId, { question, answer }) => {
    const [result] = await pool.query(
      'INSERT INTO faqs (business_id, question, answer) VALUES (?, ?, ?)',
      [businessId, question, answer]
    );
    const [rows] = await pool.query('SELECT * FROM faqs WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  update: async (id, businessId, { question, answer }) => {
    await pool.query(
      `UPDATE faqs
          SET question = COALESCE(?, question),
              answer   = COALESCE(?, answer)
        WHERE id = ? AND business_id = ?`,
      [question || null, answer || null, id, businessId]
    );
    const [rows] = await pool.query(
      'SELECT * FROM faqs WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    return rows[0] || null;
  },

  delete: async (id, businessId) => {
    const [rows] = await pool.query(
      'SELECT id FROM faqs WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (!rows[0]) return null;
    await pool.query('DELETE FROM faqs WHERE id = ? AND business_id = ?', [id, businessId]);
    return { id: rows[0].id };
  },
};

module.exports = FAQModel;
