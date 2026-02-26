'use strict';

/**
 * V2 Migration — Multi-tenant SaaS Upgrade
 *
 * Run: node scripts/migrate-v2.js
 * npm:  npm run migrate:v2
 *
 * Safe to re-run — uses ADD COLUMN IF NOT EXISTS and catches duplicate key errors.
 */

require('dotenv').config();
const { pool } = require('../src/config/db');

async function run() {
  const conn = await pool.getConnection();
  console.log('\n🚀 Starting V2 migration…\n');

  try {
    // ── 1. Upgrade users.role ENUM to include super_admin ───────────────────
    await conn.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('super_admin','admin','manager') NOT NULL DEFAULT 'manager'
    `);
    console.log('✓ users.role upgraded to ENUM(super_admin, admin, manager)');

    // ── 2. Add businesses.status ────────────────────────────────────────────
    try {
      await conn.query(`
        ALTER TABLE businesses
        ADD COLUMN status ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending'
      `);
      console.log('✓ businesses.status added');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ businesses.status already exists — skipping');
      } else throw e;
    }

    // ── 3. Add extra business info columns ─────────────────────────────────
    const extraCols = [
      "ALTER TABLE businesses ADD COLUMN phone         VARCHAR(20)                      AFTER status",
      "ALTER TABLE businesses ADD COLUMN category      VARCHAR(100)                     AFTER phone",
      "ALTER TABLE businesses ADD COLUMN city          VARCHAR(100)                     AFTER category",
      "ALTER TABLE businesses ADD COLUMN plan_price    DECIMAL(10,2) DEFAULT 0.00       AFTER city",
      "ALTER TABLE businesses ADD COLUMN billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly' AFTER plan_price",
    ];
    for (const sql of extraCols) {
      try {
        await conn.query(sql);
        const col = sql.match(/ADD COLUMN (\w+)/)[1];
        console.log(`✓ businesses.${col} added`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          const col = sql.match(/ADD COLUMN (\w+)/)[1];
          console.log(`ℹ businesses.${col} already exists — skipping`);
        } else throw e;
      }
    }

    // ── 4. Sync existing business.status from user.status ──────────────────
    await conn.query(`
      UPDATE businesses b
      JOIN   users u ON u.business_id = b.id AND u.role = 'manager'
      SET    b.status = CASE
               WHEN u.status = 'active'  THEN 'active'
               WHEN u.status = 'blocked' THEN 'suspended'
               ELSE 'pending'
             END
    `);
    console.log('✓ Synced businesses.status from existing user statuses');

    // ── 5. Promote admin@gmail.com → super_admin ────────────────────────────
    const [promoted] = await conn.query(`
      UPDATE users SET role = 'super_admin'
      WHERE email = 'admin@gmail.com' AND role = 'admin'
    `);
    if (promoted.affectedRows > 0) {
      console.log('✓ admin@gmail.com promoted to super_admin');
    } else {
      console.log('ℹ admin@gmail.com not found with role=admin (already super_admin or different email)');
    }

    // ── 6. Add database indexes ─────────────────────────────────────────────
    const indexes = [
      ['idx_businesses_status',     'CREATE INDEX idx_businesses_status     ON businesses(status)'],
      ['idx_convs_business_id',     'CREATE INDEX idx_convs_business_id     ON conversations(business_id)'],
      ['idx_users_status',          'CREATE INDEX idx_users_status          ON users(status)'],
      ['idx_support_msgs_user_id',  'CREATE INDEX idx_support_msgs_user_id  ON support_messages(user_id)'],
    ];

    for (const [name, sql] of indexes) {
      try {
        await conn.query(sql);
        console.log(`✓ Index created: ${name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
          console.log(`ℹ Index ${name} already exists — skipping`);
        } else throw e;
      }
    }

    console.log('\n✅ V2 migration completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Log in with admin@gmail.com — role is now super_admin');
    console.log('  3. All existing active businesses are now status=active\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
