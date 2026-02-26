'use strict';

const { pool } = require('../config/db');

const BusinessModel = {
  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM businesses WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  update: async (id, fields) => {
    const { name, address, phone, website, category, tone, working_hours } = fields;
    await pool.query(
      `UPDATE businesses
          SET name          = COALESCE(?, name),
              address       = COALESCE(?, address),
              phone         = COALESCE(?, phone),
              website       = COALESCE(?, website),
              category      = COALESCE(?, category),
              tone          = COALESCE(?, tone),
              working_hours = COALESCE(?, working_hours)
        WHERE id = ?`,
      [
        name || null, address || null, phone || null,
        website || null, category || null, tone || null,
        working_hours ? JSON.stringify(working_hours) : null,
        id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = BusinessModel;
