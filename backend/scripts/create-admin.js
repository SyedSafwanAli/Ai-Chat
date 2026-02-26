/**
 * Create the first admin user for the dashboard.
 *
 * Usage (from the backend/ folder):
 *   node scripts/create-admin.js
 *
 * Override defaults with env vars:
 *   ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=Secret@99 node scripts/create-admin.js
 */
'use strict';

require('dotenv').config();

const bcrypt  = require('bcryptjs');
const { pool } = require('../src/config/db');

const EMAIL    = process.env.ADMIN_EMAIL    || 'admin@luxebeauty.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

async function main() {
  console.log('Creating admin user...');

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [EMAIL]
  );

  if (existing.length > 0) {
    console.log(`\n⚠️  Admin already exists: ${EMAIL}`);
    console.log('   Delete the user in phpMyAdmin first if you want to reset the password.');
    process.exit(0);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  // Admin users are always 'active' — they bypass package checks
  await pool.query(
    'INSERT INTO users (email, password, role, status, business_id) VALUES (?, ?, ?, ?, ?)',
    [EMAIL, hash, 'admin', 'active', 1]
  );

  console.log('\n✅ Admin user created!');
  console.log(`   Email    : ${EMAIL}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log('\n   Change the password after first login.');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Failed to create admin:', err.message);
  console.error('   Make sure XAMPP MySQL is running and .env is configured.');
  process.exit(1);
});
