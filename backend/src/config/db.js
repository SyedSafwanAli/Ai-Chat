'use strict';

const mysql = require('mysql2/promise');

/**
 * MySQL connection pool (mysql2/promise).
 * Uses environment variables from .env — defaults match XAMPP.
 *
 * XAMPP defaults:
 *   DB_HOST=localhost  DB_PORT=3306  DB_USER=root  DB_PASSWORD=  DB_NAME=whatsapp_ai
 */
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT || '3306', 10),
  database:          process.env.DB_NAME     || 'whatsapp_ai',
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          'Z',          // store/return dates as UTC
  charset:           'utf8mb4',
  decimalNumbers:    true,         // return DECIMAL as JS number
});

/**
 * Test the DB connection at startup.
 * Exits the process on failure so the server never starts broken.
 */
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    console.log(`✅ MySQL connected at ${rows[0].now}`);
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your .env  DB_HOST / DB_USER / DB_PASSWORD / DB_NAME');
    console.error('   Make sure XAMPP MySQL service is running.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
