/**
 * Live migration: Super Admin Platform columns/tables.
 *
 * Run ONCE from the backend/ folder:
 *   node scripts/migrate-platform.js
 *   npm run migrate:platform
 *
 * Safe to re-run — uses IF NOT EXISTS guards.
 */
'use strict';

require('dotenv').config();
const { pool } = require('../src/config/db');

async function run() {
  console.log('Running platform migration…\n');

  // 1. credit_balance — credits remaining (top-up pool)
  await pool.query(`
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00
  `);
  console.log('✅  businesses.credit_balance ensured');

  // 2. credits_used — cumulative AI credits consumed
  await pool.query(`
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS credits_used DECIMAL(10,2) NOT NULL DEFAULT 0.00
  `);
  console.log('✅  businesses.credits_used ensured');

  // 3. super_admin_logs — audit trail for every admin action
  await pool.query(`
    CREATE TABLE IF NOT EXISTS super_admin_logs (
      id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      admin_id            INT          NOT NULL,
      action              VARCHAR(255) NOT NULL,
      target_business_id  INT          NULL,
      created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id)           REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (target_business_id) REFERENCES businesses(id) ON DELETE SET NULL,
      INDEX idx_logs_admin    (admin_id),
      INDEX idx_logs_business (target_business_id),
      INDEX idx_logs_created  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅  super_admin_logs table ensured');

  console.log('\nMigration complete. Restart the backend server.');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
