-- =============================================================================
-- Migration v7 — Payments table (Easypaisa integration)
-- Run AFTER database_complete.sql + migrate-v4 through v6
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                       INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id              INT           NOT NULL,
  order_ref                VARCHAR(100)  UNIQUE,
  amount                   DECIMAL(10,2) NOT NULL,
  currency                 VARCHAR(10)   DEFAULT 'PKR',
  package_type             ENUM('basic','pro') NOT NULL,
  status                   ENUM('pending','success','failed') DEFAULT 'pending',
  easypaisa_transaction_id VARCHAR(255)  NULL,
  created_at               DATETIME      DEFAULT CURRENT_TIMESTAMP,
  paid_at                  DATETIME      NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_pay_business  (business_id),
  INDEX idx_pay_order_ref (order_ref),
  INDEX idx_pay_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
