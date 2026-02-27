-- =============================================================================
-- Migration V4 — Package Plans + Credit Transactions
-- Run this if you already imported database_complete.sql or schema.sql before
--
-- HOW TO RUN IN phpMyAdmin:
--   1. Open phpMyAdmin → select "whatsapp_ai" database
--   2. Click the "Import" tab
--   3. Choose this file → click "Go"
-- =============================================================================

-- Package Plans (pricing tiers)
CREATE TABLE IF NOT EXISTS package_plans (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          ENUM('basic','pro','trial') NOT NULL UNIQUE,
  monthly_price DECIMAL(10,2) DEFAULT 0.00,
  credit_limit  INT          DEFAULT 0,
  description   TEXT,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default plans (IGNORE if already exists)
INSERT IGNORE INTO package_plans (name, monthly_price, credit_limit, description) VALUES
  ('trial', 0.00,   500,   '30-day free trial — 500 AI reply credits included'),
  ('basic', 29.00,  2000,  'For small businesses — 2,000 AI credits per month'),
  ('pro',   79.00,  10000, 'For growing businesses — 10,000 AI credits per month');

-- Credit Transactions (every top-up and grant logged here)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  admin_id    INT NOT NULL,
  type        ENUM('topup','approve_grant') DEFAULT 'topup',
  amount      DECIMAL(10,2) NOT NULL,
  notes       VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id)    REFERENCES users(id)      ON DELETE CASCADE,
  INDEX idx_ct_business (business_id),
  INDEX idx_ct_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
