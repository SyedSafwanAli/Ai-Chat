'use strict';

const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.*, b.name AS business_name
     FROM users u
     LEFT JOIN businesses b ON b.id = u.business_id
     WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, email, role, status, business_id, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create(email, hashedPassword, role = 'admin', businessId = null, status = 'active') {
  const [result] = await pool.query(
    'INSERT INTO users (email, password, role, status, business_id) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, role, status, businessId]
  );
  return findById(result.insertId);
}

module.exports = { findByEmail, findById, create };
