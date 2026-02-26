-- =============================================================================
-- WhatsApp AI Automation System — MySQL Schema
-- Compatible with phpMyAdmin / XAMPP / MariaDB
--
-- HOW TO IMPORT IN phpMyAdmin:
--   1. Open phpMyAdmin  →  http://localhost/phpmyadmin
--   2. Click "New" in the left sidebar
--   3. Database name: whatsapp_ai   Collation: utf8mb4_unicode_ci
--   4. Click "Create"
--   5. Select "whatsapp_ai" in the left sidebar
--   6. Click the "Import" tab (top menu bar)
--   7. Click "Choose File" → select this schema.sql
--   8. Click "Go"
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS super_admin_logs;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS lead_keywords;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS businesses;

SET FOREIGN_KEY_CHECKS = 1;

-- BUSINESSES
CREATE TABLE businesses (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  address         TEXT,
  phone           VARCHAR(50),
  website         VARCHAR(255),
  category        VARCHAR(100) DEFAULT 'Beauty & Wellness',
  tone            ENUM('professional','friendly','casual') DEFAULT 'friendly',
  working_hours   JSON,
  package         ENUM('none','basic','pro','trial') DEFAULT 'none',
  package_expiry  DATETIME     NULL,
  credit_balance  DECIMAL(10,2) DEFAULT 0.00,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SERVICES
CREATE TABLE services (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id   INT          NOT NULL,
  name          VARCHAR(255) NOT NULL,
  price         VARCHAR(100),
  description   TEXT,
  duration      VARCHAR(100),
  is_active     TINYINT(1)   DEFAULT 1,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_services_business (business_id),
  INDEX idx_services_active   (business_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQS
CREATE TABLE faqs (
  id            INT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id   INT      NOT NULL,
  question      TEXT     NOT NULL,
  answer        TEXT     NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_faqs_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LEAD KEYWORDS
CREATE TABLE lead_keywords (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id   INT          NOT NULL,
  keyword       VARCHAR(100) NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_business_keyword (business_id, keyword),
  INDEX idx_keywords_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CONVERSATIONS
CREATE TABLE conversations (
  id               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id      INT          NOT NULL,
  customer_name    VARCHAR(255),
  customer_phone   VARCHAR(50)  NOT NULL,
  platform         VARCHAR(50)  DEFAULT 'whatsapp',
  lead_status      ENUM('hot','warm','cold') DEFAULT 'cold',
  is_contacted     TINYINT(1)   DEFAULT 0,
  last_message     TEXT,
  last_message_at  DATETIME,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_conversations_business (business_id),
  INDEX idx_conversations_phone    (customer_phone),
  INDEX idx_conversations_status   (lead_status),
  INDEX idx_conversations_updated  (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MESSAGES
CREATE TABLE messages (
  id               INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id  INT         NOT NULL,
  sender           ENUM('customer','bot') NOT NULL,
  message          TEXT        NOT NULL,
  response_type    ENUM('rule','fallback','manual') DEFAULT 'rule',
  rule_matched     VARCHAR(100),
  created_at       DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_created      (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS (admin accounts + manager accounts created via signup)
CREATE TABLE users (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager') DEFAULT 'manager',
  status        ENUM('pending','active','blocked') DEFAULT 'pending',
  business_id   INT,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  INDEX idx_users_business (business_id),
  INDEX idx_users_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SUPPORT MESSAGES (user ↔ admin chat)
CREATE TABLE support_messages (
  id          INT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT      NOT NULL,
  message     TEXT     NOT NULL,
  sender      ENUM('user','admin') NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_support_user    (user_id),
  INDEX idx_support_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SUPER ADMIN ACTION LOGS
CREATE TABLE super_admin_logs (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_id            INT          NOT NULL,
  action              VARCHAR(255) NOT NULL,
  target_business_id  INT          NULL,
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id)            REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_business_id)  REFERENCES businesses(id) ON DELETE SET NULL,
  INDEX idx_logs_admin    (admin_id),
  INDEX idx_logs_business (target_business_id),
  INDEX idx_logs_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO businesses (id, name, address, phone, website, category, tone, working_hours, package, package_expiry)
VALUES (
  1,
  'Luxe Beauty Salon',
  '123 King Fahd Road, Riyadh, Saudi Arabia 12343',
  '+966 50 123 4567',
  'www.luxebeauty.com',
  'Beauty & Wellness',
  'friendly',
  '{"monday_saturday":{"open":"09:00","close":"21:00","active":true},"sunday":{"open":"10:00","close":"18:00","active":true}}',
  'trial',
  DATE_ADD(NOW(), INTERVAL 30 DAY)
);

INSERT INTO services (business_id, name, price, description, duration) VALUES
  (1,'Haircut & Styling',    '$35', 'Professional cut and blow-dry with styling',          '45 min'),
  (1,'Hair Coloring',        '$85', 'Full hair color treatment with premium products',      '2 hr'),
  (1,'Bridal Package',       '$280','Complete bridal hair, makeup, and styling service',    '4 hr'),
  (1,'Manicure & Pedicure',  '$55', 'Complete nail care with gel or regular polish',        '1.5 hr'),
  (1,'Deep Facial Treatment','$65', 'Deep cleansing facial with premium skincare products', '1 hr');

INSERT INTO faqs (business_id, question, answer) VALUES
  (1,'What are your working hours?',
     'We are open Monday to Saturday from 9:00 AM to 9:00 PM, and Sunday from 10:00 AM to 6:00 PM.'),
  (1,'Do you accept walk-ins?',
     'Yes, we accept walk-in clients, but appointments are strongly recommended.'),
  (1,'What payment methods do you accept?',
     'We accept cash, all major credit/debit cards, Apple Pay, and bank transfers.'),
  (1,'Do you offer home service?',
     'Yes! We offer home service for bridal and special occasion packages. Travel fee applies.'),
  (1,'How do I cancel or reschedule my appointment?',
     'You can cancel or reschedule up to 24 hours before your appointment. Late cancellations may incur a fee.');

INSERT IGNORE INTO lead_keywords (business_id, keyword) VALUES
  (1,'booking'),(1,'price'),(1,'appointment'),(1,'available'),
  (1,'cost'),(1,'how much'),(1,'package'),(1,'bridal'),
  (1,'discount'),(1,'offer'),(1,'schedule'),(1,'interested'),
  (1,'budget'),(1,'visit'),(1,'reserve'),(1,'i want'),
  (1,'i need'),(1,'can i come'),(1,'wedding'),(1,'want to book');
