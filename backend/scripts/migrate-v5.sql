-- =============================================================================
-- Migration V5 — Custom Package Plans + Announcements
-- Run this if you already imported database_complete.sql or ran migrate-v4.sql
--
-- HOW TO RUN IN phpMyAdmin:
--   1. Open phpMyAdmin → select "whatsapp_ai" database
--   2. Click the "Import" tab
--   3. Choose this file → click "Go"
-- =============================================================================

-- 1. Change package_plans.name from ENUM to VARCHAR so custom plan names are supported
ALTER TABLE package_plans
  MODIFY COLUMN name VARCHAR(50) NOT NULL;

-- 2. Announcements table (system-wide notices posted by super admin)
CREATE TABLE IF NOT EXISTS announcements (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  type       ENUM('info','warning','success') DEFAULT 'info',
  created_by INT          NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ann_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
