'use strict';

const { pool } = require('../config/db');

const ServiceModel = {
  findAll: async (businessId) => {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE business_id = ? ORDER BY name ASC',
      [businessId]
    );
    return rows;
  },

  findActive: async (businessId) => {
    const [rows] = await pool.query(
      `SELECT id, name, price, description, duration
         FROM services
        WHERE business_id = ? AND is_active = 1
        ORDER BY name ASC`,
      [businessId]
    );
    return rows;
  },

  findById: async (id, businessId) => {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    return rows[0] || null;
  },

  create: async (businessId, { name, price, description, duration }) => {
    const [result] = await pool.query(
      `INSERT INTO services (business_id, name, price, description, duration)
       VALUES (?, ?, ?, ?, ?)`,
      [businessId, name, price || null, description || null, duration || null]
    );
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  update: async (id, businessId, { name, price, description, duration, is_active }) => {
    await pool.query(
      `UPDATE services
          SET name        = COALESCE(?, name),
              price       = COALESCE(?, price),
              description = COALESCE(?, description),
              duration    = COALESCE(?, duration),
              is_active   = COALESCE(?, is_active)
        WHERE id = ? AND business_id = ?`,
      [
        name || null, price || null, description || null,
        duration || null, is_active ?? null,
        id, businessId,
      ]
    );
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    return rows[0] || null;
  },

  delete: async (id, businessId) => {
    const [rows] = await pool.query(
      'SELECT id FROM services WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (!rows[0]) return null;
    await pool.query('DELETE FROM services WHERE id = ? AND business_id = ?', [id, businessId]);
    return { id: rows[0].id };
  },
};

module.exports = ServiceModel;
