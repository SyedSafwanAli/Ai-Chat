-- =============================================================================
-- Migration v6 — Quick Replies table
-- Run AFTER database_complete.sql + migrate-v4.sql + migrate-v5.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS quick_replies (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id INT          NOT NULL,
  title       VARCHAR(100) NOT NULL,
  body        TEXT         NOT NULL,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_qr_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
