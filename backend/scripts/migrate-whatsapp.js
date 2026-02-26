'use strict';

/**
 * Migration: Add WhatsApp credentials columns to businesses table
 *
 * Run:  node scripts/migrate-whatsapp.js
 * npm:  npm run migrate:whatsapp
 *
 * Adds (only if they don't already exist):
 *   - whatsapp_phone_number_id  VARCHAR(100)  — Meta phone_number_id
 *   - whatsapp_token            TEXT          — permanent access token
 */

require('dotenv').config();
const { pool } = require('../src/config/db');

async function run() {
  const conn = await pool.getConnection();
  console.log('\n🔧 Running WhatsApp migration…\n');

  try {
    // Check which columns already exist
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'businesses'
          AND COLUMN_NAME  IN ('whatsapp_phone_number_id', 'whatsapp_token')`
    );

    const existing = cols.map((c) => c.COLUMN_NAME);

    if (!existing.includes('whatsapp_phone_number_id')) {
      await conn.query(
        `ALTER TABLE businesses
         ADD COLUMN whatsapp_phone_number_id VARCHAR(100) NULL AFTER tone`
      );
      console.log('  ✓ Added column: whatsapp_phone_number_id');
    } else {
      console.log('  ℹ  Column already exists: whatsapp_phone_number_id');
    }

    if (!existing.includes('whatsapp_token')) {
      await conn.query(
        `ALTER TABLE businesses
         ADD COLUMN whatsapp_token TEXT NULL AFTER whatsapp_phone_number_id`
      );
      console.log('  ✓ Added column: whatsapp_token');
    } else {
      console.log('  ℹ  Column already exists: whatsapp_token');
    }

    console.log('\n✅ Migration complete.\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message, '\n');
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
