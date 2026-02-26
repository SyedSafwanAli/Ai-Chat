'use strict';

const { pool } = require('../config/db');

const KeywordModel = {
  findAll: async (businessId) => {
    const [rows] = await pool.query(
      'SELECT * FROM lead_keywords WHERE business_id = ? ORDER BY keyword ASC',
      [businessId]
    );
    return rows;
  },

  findAllStrings: async (businessId) => {
    const [rows] = await pool.query(
      'SELECT keyword FROM lead_keywords WHERE business_id = ? ORDER BY keyword ASC',
      [businessId]
    );
    return rows.map((r) => r.keyword);
  },

  create: async (businessId, keyword) => {
    try {
      const [result] = await pool.query(
        'INSERT IGNORE INTO lead_keywords (business_id, keyword) VALUES (?, ?)',
        [businessId, keyword.toLowerCase().trim()]
      );
      if (result.affectedRows === 0) return null; // duplicate
      const [rows] = await pool.query(
        'SELECT * FROM lead_keywords WHERE id = ?',
        [result.insertId]
      );
      return rows[0];
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return null;
      throw err;
    }
  },

  delete: async (id, businessId) => {
    const [rows] = await pool.query(
      'SELECT id FROM lead_keywords WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (!rows[0]) return null;
    await pool.query(
      'DELETE FROM lead_keywords WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    return { id: rows[0].id };
  },
};

module.exports = KeywordModel;
