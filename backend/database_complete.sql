-- =============================================================================
-- WhatsApp AI Automation System — COMPLETE DATABASE FILE
-- Includes: Full Schema + Super Admin + 10 Demo Businesses + All Demo Data
--
-- HOW TO IMPORT IN phpMyAdmin:
--   1. Open http://localhost/phpmyadmin
--   2. Click "New" in the left sidebar
--   3. Database name: whatsapp_ai   Collation: utf8mb4_unicode_ci
--   4. Click "Create"
--   5. Select "whatsapp_ai" in the left sidebar
--   6. Click "Import" tab → "Choose File" → select this file
--   7. Click "Go"
--
-- ACCOUNTS AFTER IMPORT:
--   Super Admin  : admin@gmail.com      / Admin!123
--   Demo password: Demo@1234  (all 10 demo businesses)
-- =============================================================================

SET NAMES utf8mb4;
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

-- =============================================================================
-- SCHEMA
-- =============================================================================

CREATE TABLE businesses (
  id                        INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name                      VARCHAR(255)  NOT NULL,
  address                   TEXT,
  phone                     VARCHAR(50),
  website                   VARCHAR(255),
  category                  VARCHAR(100)  DEFAULT 'General',
  city                      VARCHAR(100),
  tone                      ENUM('professional','friendly','casual') DEFAULT 'friendly',
  working_hours             JSON,
  whatsapp_phone_number_id  VARCHAR(100)  NULL,
  whatsapp_token            TEXT          NULL,
  status                    ENUM('pending','active','suspended') DEFAULT 'pending',
  package                   ENUM('none','basic','pro','trial') DEFAULT 'none',
  package_expiry            DATETIME      NULL,
  credit_balance            DECIMAL(10,2) DEFAULT 0.00,
  credits_used              DECIMAL(10,2) DEFAULT 0.00,
  plan_price                DECIMAL(10,2) DEFAULT 0.00,
  billing_cycle             ENUM('monthly','yearly') DEFAULT 'monthly',
  created_at                DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  INDEX idx_services_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE lead_keywords (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id   INT          NOT NULL,
  keyword       VARCHAR(100) NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_business_keyword (business_id, keyword),
  INDEX idx_keywords_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE users (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('super_admin','admin','manager') DEFAULT 'manager',
  status        ENUM('pending','active','blocked') DEFAULT 'pending',
  business_id   INT          NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  INDEX idx_users_business (business_id),
  INDEX idx_users_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- BUSINESSES (10 Demo Pakistani Businesses)
-- =============================================================================

INSERT INTO businesses
  (id, name, address, phone, website, category, city, tone, working_hours, status, package, package_expiry, credit_balance, credits_used, plan_price)
VALUES
-- 1. PizzaRun Karachi
(1, 'PizzaRun Karachi', 'Shop 5, Block-6 PECHS, Karachi', '+92 21 3456 7890', 'www.pizzarun.pk',
 'Food & Restaurant', 'Karachi', 'friendly',
 '[{"day":"Monday","from":"12:00","to":"23:00","active":true},{"day":"Tuesday","from":"12:00","to":"23:00","active":true},{"day":"Wednesday","from":"12:00","to":"23:00","active":true},{"day":"Thursday","from":"12:00","to":"23:00","active":true},{"day":"Friday","from":"12:00","to":"00:00","active":true},{"day":"Saturday","from":"12:00","to":"00:00","active":true},{"day":"Sunday","from":"14:00","to":"23:00","active":true}]',
 'active', 'pro', DATE_ADD(NOW(), INTERVAL 6 MONTH), 500.00, 45.00, 3999.00),

-- 2. Al-Hamd Pharmacy
(2, 'Al-Hamd Pharmacy', 'Main Boulevard, Gulberg III, Lahore', '+92 42 3571 2345', 'www.alhamdpharma.pk',
 'Healthcare & Pharmacy', 'Lahore', 'professional',
 '[{"day":"Monday","from":"08:00","to":"23:00","active":true},{"day":"Tuesday","from":"08:00","to":"23:00","active":true},{"day":"Wednesday","from":"08:00","to":"23:00","active":true},{"day":"Thursday","from":"08:00","to":"23:00","active":true},{"day":"Friday","from":"08:00","to":"23:00","active":true},{"day":"Saturday","from":"08:00","to":"23:00","active":true},{"day":"Sunday","from":"09:00","to":"22:00","active":true}]',
 'active', 'basic', DATE_ADD(NOW(), INTERVAL 3 MONTH), 200.00, 22.00, 1999.00),

-- 3. Sunrise Academy
(3, 'Sunrise Academy', 'G-11 Markaz, Islamabad', '+92 51 2345 6789', 'www.sunriseacademy.edu.pk',
 'Education', 'Islamabad', 'professional',
 '[{"day":"Monday","from":"08:00","to":"20:00","active":true},{"day":"Tuesday","from":"08:00","to":"20:00","active":true},{"day":"Wednesday","from":"08:00","to":"20:00","active":true},{"day":"Thursday","from":"08:00","to":"20:00","active":true},{"day":"Friday","from":"08:00","to":"17:00","active":true},{"day":"Saturday","from":"09:00","to":"15:00","active":true},{"day":"Sunday","from":"00:00","to":"00:00","active":false}]',
 'active', 'pro', DATE_ADD(NOW(), INTERVAL 6 MONTH), 500.00, 38.00, 3999.00),

-- 4. Hassan Auto Parts
(4, 'Hassan Auto Parts', 'Hall Road, Lahore', '+92 300 123 4567', 'www.hassanautoparts.pk',
 'Automotive', 'Lahore', 'friendly',
 '[{"day":"Monday","from":"09:00","to":"19:00","active":true},{"day":"Tuesday","from":"09:00","to":"19:00","active":true},{"day":"Wednesday","from":"09:00","to":"19:00","active":true},{"day":"Thursday","from":"09:00","to":"19:00","active":true},{"day":"Friday","from":"09:00","to":"13:00","active":true},{"day":"Saturday","from":"09:00","to":"19:00","active":true},{"day":"Sunday","from":"00:00","to":"00:00","active":false}]',
 'active', 'trial', DATE_ADD(NOW(), INTERVAL 1 MONTH), 100.00, 12.00, 0.00),

-- 5. Bloom Boutique
(5, 'Bloom Boutique', 'MM Alam Road, Gulberg, Lahore', '+92 300 987 6543', 'www.bloomboutique.pk',
 'Fashion & Clothing', 'Lahore', 'friendly',
 '[{"day":"Monday","from":"10:00","to":"21:00","active":true},{"day":"Tuesday","from":"10:00","to":"21:00","active":true},{"day":"Wednesday","from":"10:00","to":"21:00","active":true},{"day":"Thursday","from":"10:00","to":"21:00","active":true},{"day":"Friday","from":"10:00","to":"21:00","active":true},{"day":"Saturday","from":"10:00","to":"22:00","active":true},{"day":"Sunday","from":"12:00","to":"20:00","active":true}]',
 'active', 'basic', DATE_ADD(NOW(), INTERVAL 3 MONTH), 200.00, 18.00, 1999.00),

-- 6. TechFix Lahore
(6, 'TechFix Lahore', 'Liberty Market, Lahore', '+92 321 456 7890', 'www.techfix.pk',
 'Technology & Repair', 'Lahore', 'professional',
 '[{"day":"Monday","from":"10:00","to":"20:00","active":true},{"day":"Tuesday","from":"10:00","to":"20:00","active":true},{"day":"Wednesday","from":"10:00","to":"20:00","active":true},{"day":"Thursday","from":"10:00","to":"20:00","active":true},{"day":"Friday","from":"10:00","to":"20:00","active":true},{"day":"Saturday","from":"10:00","to":"20:00","active":true},{"day":"Sunday","from":"00:00","to":"00:00","active":false}]',
 'active', 'pro', DATE_ADD(NOW(), INTERVAL 6 MONTH), 500.00, 55.00, 3999.00),

-- 7. Green Valley Farm (pending)
(7, 'Green Valley Farm', 'Bhalwal Road, Sargodha', '+92 311 222 3344', NULL,
 'Agriculture & Farming', 'Sargodha', 'friendly',
 '[{"day":"Monday","from":"07:00","to":"18:00","active":true},{"day":"Tuesday","from":"07:00","to":"18:00","active":true},{"day":"Wednesday","from":"07:00","to":"18:00","active":true},{"day":"Thursday","from":"07:00","to":"18:00","active":true},{"day":"Friday","from":"07:00","to":"12:00","active":true},{"day":"Saturday","from":"07:00","to":"18:00","active":true},{"day":"Sunday","from":"00:00","to":"00:00","active":false}]',
 'pending', 'none', NULL, 0.00, 0.00, 0.00),

-- 8. Crystal Spa & Salon (pending)
(8, 'Crystal Spa & Salon', 'Clifton Block 4, Karachi', '+92 331 567 8901', NULL,
 'Beauty & Wellness', 'Karachi', 'friendly',
 '[{"day":"Monday","from":"10:00","to":"21:00","active":true},{"day":"Tuesday","from":"10:00","to":"21:00","active":true},{"day":"Wednesday","from":"10:00","to":"21:00","active":true},{"day":"Thursday","from":"10:00","to":"21:00","active":true},{"day":"Friday","from":"10:00","to":"21:00","active":true},{"day":"Saturday","from":"09:00","to":"22:00","active":true},{"day":"Sunday","from":"11:00","to":"20:00","active":true}]',
 'pending', 'none', NULL, 0.00, 0.00, 0.00),

-- 9. Swift Courier Services (suspended)
(9, 'Swift Courier Services', 'Korangi Industrial Area, Karachi', '+92 21 3512 4567', 'www.swiftcourier.pk',
 'Logistics & Courier', 'Karachi', 'professional',
 '[{"day":"Monday","from":"09:00","to":"18:00","active":true},{"day":"Tuesday","from":"09:00","to":"18:00","active":true},{"day":"Wednesday","from":"09:00","to":"18:00","active":true},{"day":"Thursday","from":"09:00","to":"18:00","active":true},{"day":"Friday","from":"09:00","to":"18:00","active":true},{"day":"Saturday","from":"10:00","to":"16:00","active":true},{"day":"Sunday","from":"00:00","to":"00:00","active":false}]',
 'suspended', 'basic', DATE_ADD(NOW(), INTERVAL 2 MONTH), 50.00, 8.00, 1999.00),

-- 10. Golden Bakers
(10, 'Golden Bakers', 'Township Sector B-2, Lahore', '+92 42 3521 6789', 'www.goldenbakers.pk',
 'Food & Bakery', 'Lahore', 'friendly',
 '[{"day":"Monday","from":"07:00","to":"22:00","active":true},{"day":"Tuesday","from":"07:00","to":"22:00","active":true},{"day":"Wednesday","from":"07:00","to":"22:00","active":true},{"day":"Thursday","from":"07:00","to":"22:00","active":true},{"day":"Friday","from":"07:00","to":"22:00","active":true},{"day":"Saturday","from":"07:00","to":"23:00","active":true},{"day":"Sunday","from":"08:00","to":"22:00","active":true}]',
 'active', 'basic', DATE_ADD(NOW(), INTERVAL 3 MONTH), 200.00, 16.00, 1999.00);


-- =============================================================================
-- USERS
-- Passwords:  admin@gmail.com = Admin!123
--             all demo businesses = Demo@1234
-- =============================================================================

INSERT INTO users (id, email, password, role, status, business_id) VALUES
-- Super Admin (no business)
(1,  'admin@gmail.com',                '$2b$10$qvWo5DghumUzFO3VZOMDEeHv2yJU8W4jVcHnQ7V.iJwqashYu574K', 'super_admin', 'active',  NULL),
-- Demo business managers
(2,  'pizza@pizzarun.pk',              '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  1),
(3,  'info@alhamdpharma.pk',           '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  2),
(4,  'admin@sunriseacademy.edu.pk',    '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  3),
(5,  'hassan@autoparts.pk',            '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  4),
(6,  'hello@bloomboutique.pk',         '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  5),
(7,  'support@techfix.pk',             '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  6),
(8,  'greenvalley@farm.pk',            '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'pending', 7),
(9,  'crystal@spakarachi.pk',          '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'pending', 8),
(10, 'ops@swiftcourier.pk',            '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  9),
(11, 'info@goldenbakers.pk',           '$2b$10$Gw7POQc7h5VHlv5JuneZmeSlivCwjw7mta1giuosUuyGGmgTIP/AK', 'manager',     'active',  10);


-- =============================================================================
-- SERVICES
-- =============================================================================

-- Business 1: PizzaRun Karachi
INSERT INTO services (business_id, name, price, description, duration) VALUES
(1, 'Margherita Pizza',    'Rs. 450',  'Classic tomato sauce with mozzarella cheese',              '20 min'),
(1, 'Chicken BBQ Pizza',   'Rs. 750',  'Grilled chicken with BBQ sauce and bell peppers',          '25 min'),
(1, 'Beef Burger',         'Rs. 350',  'Juicy beef patty with lettuce, tomato and special sauce',  '15 min'),
(1, 'Chicken Karahi Pizza','Rs. 850',  'Desi twist — karahi spices on a pizza base',               '25 min'),
(1, 'Family Deal',         'Rs. 1800', '2 Large pizzas + garlic bread + 1.5L drink',               '35 min');

-- Business 2: Al-Hamd Pharmacy
INSERT INTO services (business_id, name, price, description, duration) VALUES
(2, 'OTC Medicines',       'Market price', 'Panadol, Brufen, antacids and all common medicines', 'Immediate'),
(2, 'Prescription Filling','Market price', 'Prescription medicines dispensed by licensed pharmacist', '10 min'),
(2, 'BP & Sugar Check',    'Rs. 50',       'Free blood pressure + blood sugar check for customers', '5 min'),
(2, 'Home Delivery',       'Rs. 100',      'Medicine delivery within 5km radius of Gulberg',       '45-60 min'),
(2, 'Monthly Medicines',   'Market price', 'Bulk monthly prescription with 5% loyalty discount',  'Same day');

-- Business 3: Sunrise Academy
INSERT INTO services (business_id, name, price, description, duration) VALUES
(3, 'Matric Preparation',    'Rs. 3500/mo', 'Complete 9th & 10th class coaching all subjects',     '2 hr/day'),
(3, 'FSc Pre-Medical',       'Rs. 4500/mo', 'Biology, Chemistry, Physics coaching for FSc Part 1&2', '2.5 hr/day'),
(3, 'MDCAT Entry Test',      'Rs. 6000/mo', 'Intensive MDCAT preparation with mock tests',         '3 hr/day'),
(3, 'O-Levels Coaching',     'Rs. 5000/mo', 'Cambridge O-Levels all subjects by experienced tutors', '2 hr/day'),
(3, 'One-on-One Tutoring',   'Rs. 800/hr',  'Private tutoring sessions at your home or academy',   '1 hr');

-- Business 4: Hassan Auto Parts
INSERT INTO services (business_id, name, price, description, duration) VALUES
(4, 'Engine Oil & Filter',   'Rs. 2500',    'Premium engine oil change with genuine filter',       '30 min'),
(4, 'Brake Pads',            'Rs. 1800',    'OEM quality brake pads for all car models',           '45 min'),
(4, 'Battery Replacement',   'Rs. 8000',    'Osaka/AGS battery with 1-year warranty',             '20 min'),
(4, 'Tyres (Set of 4)',      'Rs. 18000',   'General, Bridgestone, Continental — all brands',      '1 hr'),
(4, 'Suspension Parts',      'Call for price','Shock absorbers, control arms, ball joints',       'Variable');

-- Business 5: Bloom Boutique
INSERT INTO services (business_id, name, price, description, duration) VALUES
(5, 'Casual Wear',           'Rs. 1500-3500', 'Trendy everyday outfits — lawn, cambric, cotton',  'In-store'),
(5, 'Formal Collection',     'Rs. 4000-8000', 'Ready-to-wear formal dresses for events',          'In-store'),
(5, 'Bridal Wear',           'Rs. 15000+',    'Custom bridal dresses with embroidery and work',   '2-3 weeks'),
(5, 'Accessories',           'Rs. 500-2000',  'Handbags, scarves, jewellery — complete outfit',   'In-store'),
(5, 'Alteration Service',    'Rs. 300-800',   'Expert tailoring and alteration for perfect fit',  '2-3 days');

-- Business 6: TechFix Lahore
INSERT INTO services (business_id, name, price, description, duration) VALUES
(6, 'Phone Screen Repair',   'Rs. 2500-5000', 'OEM screen replacement for iPhone/Samsung/Oppo',  '1-2 hr'),
(6, 'Laptop Repair',         'Rs. 1500-8000', 'Hardware/software repair, virus removal, SSD',    '1-3 days'),
(6, 'Data Recovery',         'Rs. 3000-12000','Recover deleted data from phones, laptops, HDD',  '1-2 days'),
(6, 'CCTV Installation',     'Rs. 12000+',    '4-camera CCTV setup with DVR and remote viewing', '4-6 hr'),
(6, 'WiFi Setup & Networking','Rs. 2000+',    'Home/office network setup, range extenders',       '2-3 hr');

-- Business 9: Swift Courier Services
INSERT INTO services (business_id, name, price, description, duration) VALUES
(9, 'Same-Day Delivery',     'Rs. 150-250', 'Within-city same day delivery (order before 2pm)',  'Same day'),
(9, 'Next-Day Delivery',     'Rs. 200-350', 'Nationwide next-day delivery to major cities',       'Next day'),
(9, 'Bulk Shipment',         'Custom price','Volume discounts for e-commerce businesses',         'Negotiable'),
(9, 'Document Delivery',     'Rs. 100-200', 'Secure document and envelope delivery citywide',     '2-4 hr'),
(9, 'International Courier', 'Rs. 2500+',   'Worldwide shipping via DHL/FedEx partner',           '3-7 days');

-- Business 10: Golden Bakers
INSERT INTO services (business_id, name, price, description, duration) VALUES
(10,'Custom Cakes',          'Rs. 1200-4000','Birthday, wedding and occasion cakes with custom design', '24 hr order'),
(10,'Bread & Buns',          'Rs. 80-200',   'Fresh baked daily — white, brown, dinner rolls',   'Daily fresh'),
(10,'Pastries & Croissants', 'Rs. 150-300',  'Butter croissants, cream pastries, danish',         'Daily fresh'),
(10,'Cupcakes (12-pack)',    'Rs. 900',       'Dozen cupcakes with custom frosting flavors',       'Same day'),
(10,'Catering Packages',     'Rs. 5000+',     'Bulk dessert/snack trays for events and offices',  '48 hr notice');


-- =============================================================================
-- FAQs
-- =============================================================================

-- Business 1: PizzaRun Karachi
INSERT INTO faqs (business_id, question, answer) VALUES
(1,'What are your delivery hours?',            'We deliver from 12 PM to 11 PM daily. On Fridays and Saturdays we deliver until midnight!'),
(1,'What is the minimum order for delivery?',  'Minimum order for delivery is Rs. 500. Free delivery on orders above Rs. 1000 within 5km.'),
(1,'How long does delivery take?',             'Usually 30-45 minutes depending on your location and order volume. We''ll send you a confirmation.'),
(1,'Do you accept online payment?',            'Yes! We accept EasyPaisa, JazzCash, bank transfer, and cash on delivery.'),
(1,'Can I customize my pizza toppings?',       'Absolutely! You can add or remove any toppings. Additional toppings are Rs. 100 each.');

-- Business 2: Al-Hamd Pharmacy
INSERT INTO faqs (business_id, question, answer) VALUES
(2,'Are you open 24 hours?',                   'We are open from 8 AM to 11 PM daily. For emergencies, please call our emergency line +92 300 4501234.'),
(2,'Do you deliver medicines at home?',        'Yes, we offer home delivery within 5km for a flat fee of Rs. 100. Minimum order Rs. 500.'),
(2,'Can I get medicines without a prescription?','Over-the-counter medicines are available without prescription. For prescription medicines, a valid prescription is required by law.'),
(2,'Do you offer discounts on bulk orders?',   'Yes! Monthly medicine packages get a 5% discount. Senior citizens get 10% off on all purchases.'),
(2,'Do you stock all medicines?',              'We stock 95% of common medicines. If something is unavailable, we can arrange it within 24 hours.');

-- Business 3: Sunrise Academy
INSERT INTO faqs (business_id, question, answer) VALUES
(3,'What classes do you offer?',               'We offer coaching for Matric (9th-10th), FSc (11th-12th), O-Levels, A-Levels, and MDCAT/ECAT entry test preparation.'),
(3,'What are the batch timings?',              'Morning batch: 8 AM - 11 AM. Evening batch: 4 PM - 7 PM. Weekend batch: Saturday & Sunday 9 AM - 1 PM.'),
(3,'Do you provide study material?',           'Yes, complete study notes, past papers, and practice tests are included in the fee. No extra charges.'),
(3,'What is the fee structure?',               'Matric: Rs. 3500/month. FSc: Rs. 4500/month. MDCAT: Rs. 6000/month. O-Levels: Rs. 5000/month. Discounts for siblings.'),
(3,'How do I register?',                       'Visit our campus at G-11 Markaz Islamabad with your previous result card, or WhatsApp us to book a free trial class.');

-- Business 4: Hassan Auto Parts
INSERT INTO faqs (business_id, question, answer) VALUES
(4,'Do you have parts for all car models?',    'We stock parts for Toyota, Honda, Suzuki, Hyundai, KIA, and most popular Pakistani car brands. Call to check availability.'),
(4,'Are your parts genuine or local?',         'We carry both genuine OEM parts and quality local alternatives. We clearly label all products so you can choose.'),
(4,'Do you offer installation service?',       'Basic installation is free with purchase (oil change, battery, wipers). Complex jobs are referred to trusted workshops.'),
(4,'What is your return policy?',              'Unused parts can be returned within 7 days with receipt. No returns on electrical parts once installed.'),
(4,'Can I order online?',                      'Yes! WhatsApp us your car model, year, and part needed. We''ll confirm availability and price. COD available.');

-- Business 5: Bloom Boutique
INSERT INTO faqs (business_id, question, answer) VALUES
(5,'Do you have a sale or discount offers?',   'Yes! We have seasonal sales in June and December. Follow us on Instagram @bloomboutique for flash sale alerts.'),
(5,'Can I exchange or return clothes?',        'Exchange is available within 7 days with original receipt and tags attached. Sale items are non-exchangeable.'),
(5,'Do you do custom stitching?',              'Yes! We offer custom stitching for any fabric you bring. Turnaround time is 7-10 days. Contact for pricing.'),
(5,'What sizes do you carry?',                 'We carry sizes XS to 3XL in most styles. We also offer custom sizing for bridal and formal wear.'),
(5,'Do you ship outside Lahore?',              'Yes! We ship nationwide via TCS and Leopards Couriers. Shipping charges are calculated at checkout. COD available.');

-- Business 6: TechFix Lahore
INSERT INTO faqs (business_id, question, answer) VALUES
(6,'How long does phone repair take?',         'Screen repair takes 1-2 hours. Battery replacement takes 30 minutes. Complex motherboard repairs may take 1-3 days.'),
(6,'Do you provide warranty on repairs?',      'Yes! All repairs come with a 30-day warranty. Screen replacements have a 90-day warranty on the part.'),
(6,'Can you recover data from a broken phone?','In most cases yes, even from water-damaged or cracked phones. Success rate is about 80%. Call for assessment.'),
(6,'Do you repair all phone brands?',          'We repair iPhone, Samsung, Oppo, Vivo, Xiaomi, Realme, and most Android brands. Bring in your device for a free quote.'),
(6,'Do you come to my location for laptop repair?','Yes, we offer on-site service in Lahore for laptop, CCTV, and networking. Call to schedule a visit (Rs. 500 visit fee).');

-- Business 10: Golden Bakers
INSERT INTO faqs (business_id, question, answer) VALUES
(10,'How far in advance should I order a custom cake?','Custom cakes require minimum 24 hours advance order. For wedding/event cakes, please order 5-7 days ahead.'),
(10,'What flavors do you offer?',              'Chocolate, vanilla, red velvet, black forest, lemon, carrot, and seasonal flavors. Custom flavors available on request.'),
(10,'Do you deliver cakes?',                   'Yes, we deliver within Lahore for Rs. 200-400 depending on distance. For orders above Rs. 3000, delivery is free.'),
(10,'Are your products halal?',                'Yes, 100% halal certified. We use only halal-certified ingredients and follow strict hygiene standards.'),
(10,'Can you make eggless cakes?',             'Yes! We offer eggless versions of all our cakes. Please mention when ordering. Slight price difference may apply.');


-- =============================================================================
-- LEAD KEYWORDS
-- =============================================================================

INSERT IGNORE INTO lead_keywords (business_id, keyword) VALUES
-- Business 1: PizzaRun
(1,'order'),(1,'delivery'),(1,'pizza'),(1,'price'),(1,'menu'),(1,'hungry'),(1,'deal'),
(1,'discount'),(1,'home delivery'),(1,'how much'),(1,'cost'),(1,'interested'),(1,'want to order'),

-- Business 2: Al-Hamd Pharmacy
(2,'medicine'),(2,'prescription'),(2,'tablet'),(2,'syrup'),(2,'delivery'),(2,'stock'),
(2,'price'),(2,'available'),(2,'panadol'),(2,'how much'),(2,'urgent'),(2,'need medicine'),

-- Business 3: Sunrise Academy
(3,'admission'),(3,'enroll'),(3,'register'),(3,'fee'),(3,'batch'),(3,'schedule'),
(3,'matric'),(3,'fsc'),(3,'mdcat'),(3,'how much'),(3,'want to join'),(3,'interested'),

-- Business 4: Hassan Auto Parts
(4,'price'),(4,'available'),(4,'part'),(4,'order'),(4,'how much'),(4,'need'),
(4,'honda'),(4,'toyota'),(4,'suzuki'),(4,'cost'),(4,'genuine'),(4,'want to buy'),

-- Business 5: Bloom Boutique
(5,'price'),(5,'available'),(5,'size'),(5,'dress'),(5,'how much'),(5,'discount'),
(5,'order'),(5,'want'),(5,'buy'),(5,'interested'),(5,'bridal'),(5,'collection'),

-- Business 6: TechFix
(6,'repair'),(6,'price'),(6,'cost'),(6,'how much'),(6,'screen'),(6,'broken'),
(6,'laptop'),(6,'phone'),(6,'fix'),(6,'warranty'),(6,'interested'),(6,'want to repair'),

-- Business 9: Swift Courier
(9,'send'),(9,'deliver'),(9,'price'),(9,'how much'),(9,'tracking'),(9,'parcel'),
(9,'same day'),(9,'urgent'),(9,'shipment'),(9,'cost'),(9,'international'),(9,'courier'),

-- Business 10: Golden Bakers
(10,'cake'),(10,'order'),(10,'price'),(10,'custom'),(10,'delivery'),(10,'how much'),
(10,'birthday'),(10,'wedding'),(10,'interested'),(10,'want'),(10,'flavor'),(10,'book');


-- =============================================================================
-- CONVERSATIONS + MESSAGES (Active businesses only)
-- =============================================================================

-- ─── Business 1: PizzaRun Karachi ───────────────────────────────────────────

INSERT INTO conversations (id, business_id, customer_name, customer_phone, lead_status, is_contacted, last_message, last_message_at) VALUES
(1, 1, 'Ahmed Raza',     '+92 300 1234567', 'hot',  1, 'Ok phir kal order karta hun, shukriya!', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 1, 'Sara Khan',      '+92 333 9876543', 'warm', 0, 'Prices thori zyada hain, sochna padega', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 1, 'Bilal Hussain',  '+92 321 5556677', 'hot',  0, 'Family deal ka order kar do please', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched) VALUES
(1, 'customer', 'Assalam o alaikum, aap ki delivery hai kya Gulshan mein?', 'rule', NULL),
(1, 'bot', 'Walaikum Assalam! Haan ji, hum Gulshan mein deliver karte hain. Minimum order Rs. 500 hai aur 5km tak free delivery Rs. 1000+ par. Kya order karna chahte hain?', 'rule', 'greeting'),
(1, 'customer', 'Chicken BBQ pizza aur Family Deal ka price batao?', 'rule', NULL),
(1, 'bot', 'Chicken BBQ Pizza: Rs. 750 | Family Deal (2 large pizzas + garlic bread + 1.5L drink): Rs. 1800. Delivery usually 30-45 minutes mein. Order karein?', 'rule', 'pricing'),
(1, 'customer', 'Ok phir kal order karta hun, shukriya!', 'rule', NULL),
(1, 'bot', 'Zaroor! Kal ka intezaar rahega. Koi bhi sawal ho toh WhatsApp karein. Thank you!', 'rule', 'fallback'),

(2, 'customer', 'Hi, aap ka menu share karo?', 'rule', NULL),
(2, 'bot', 'Hello! Hamare main items: Margherita Pizza Rs.450, Chicken BBQ Pizza Rs.750, Beef Burger Rs.350, Family Deal Rs.1800. Puri menu website par hai: www.pizzarun.pk', 'rule', 'greeting'),
(2, 'customer', 'Prices thori zyada hain, sochna padega', 'rule', NULL),
(2, 'bot', 'Samajh mein aata hai! Hum 100% fresh ingredients use karte hain. Is waqt Rs.1000+ par free delivery bhi mil rahi hai. Koi deal consider karein?', 'rule', 'fallback'),

(3, 'customer', 'Bhai Family Deal mangwana hai, kitna time lagega?', 'rule', NULL),
(3, 'bot', 'Family Deal Rs.1800 mein: 2 large pizzas + garlic bread + 1.5L drink. Delivery time 35-45 minute. Address batain?', 'rule', 'pricing'),
(3, 'customer', 'Family deal ka order kar do please', 'rule', NULL),
(3, 'bot', 'Zaroor! Apna complete address aur phone number share karein, hum abhi confirm karte hain. Payment: EasyPaisa/JazzCash/COD sab accepted hain!', 'rule', 'booking');

-- ─── Business 2: Al-Hamd Pharmacy ──────────────────────────────────────────

INSERT INTO conversations (id, business_id, customer_name, customer_phone, lead_status, is_contacted, last_message, last_message_at) VALUES
(4, 2, 'Dr. Farhan Ali',  '+92 300 4455667', 'hot',  1, 'Great! Your order of 3 strips Panadol Extra = Rs. 180. Confirm your address please.', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 2, 'Ayesha Siddiqui', '+92 321 7788990', 'warm', 0, 'Let me think and get back to you', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(6, 2, 'Tariq Mehmood',   '+92 333 2211334', 'hot',  0, 'Yes, Al-Hamd Pharmacy is open 7 days a week from 8 AM to 11 PM.', DATE_SUB(NOW(), INTERVAL 45 MINUTE));

INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched) VALUES
(4, 'customer', 'Panadol Extra available hai kya? 3 strips chahiye', 'rule', NULL),
(4, 'bot', 'Haan ji, Panadol Extra available hai. 3 strips ki price: Rs. 60 x 3 = Rs. 180. Home delivery bhi available hai Rs. 100 mein (minimum order Rs. 500). Kya deliver karein?', 'rule', 'pricing'),
(4, 'customer', 'Haan please deliver karo, main Gulberg mein hun', 'rule', NULL),
(4, 'bot', 'Great! Your order of 3 strips Panadol Extra = Rs. 180. Confirm your address please.', 'rule', 'booking'),

(5, 'customer', 'Kya aap diabetes ki medicines stock karte hain?', 'rule', NULL),
(5, 'bot', 'Haan ji, hum diabetes ki sari common medicines stock karte hain: Metformin, Glimepiride, Januvia, Amaryl, Glucophage etc. Prescription hai toh aur bhi help kar sakte hain. Kya chahiye?', 'rule', 'services'),
(5, 'customer', 'Glucophage 500mg ka price kya hai?', 'rule', NULL),
(5, 'bot', 'Glucophage 500mg (20 tablets) - Rs. 145. Monthly pack available hai 5% discount ke saath. Prescription chahiye. Delivery bhi possible hai.', 'rule', 'pricing'),
(5, 'customer', 'Let me think and get back to you', 'rule', NULL),
(5, 'bot', 'Bilkul, zaroor! Jab bhi ready hon WhatsApp karein. Hum 8 AM se 11 PM tak available hain.', 'rule', 'fallback'),

(6, 'customer', 'Hello, kya aap Sunday ko bhi open hain?', 'rule', NULL),
(6, 'bot', 'Yes, Al-Hamd Pharmacy is open 7 days a week from 8 AM to 11 PM.', 'rule', 'hours'),
(6, 'customer', 'Acha, BP check bhi hoti hai kya?', 'rule', NULL),
(6, 'bot', 'Haan ji! Free BP aur blood sugar check available hai daily. Koi charge nahi. Aa jayein ya appointment lein.', 'rule', 'services');

-- ─── Business 3: Sunrise Academy ───────────────────────────────────────────

INSERT INTO conversations (id, business_id, customer_name, customer_phone, lead_status, is_contacted, last_message, last_message_at) VALUES
(7, 3, 'Zainab Malik',   '+92 312 3344556', 'hot',  0, 'Registration ke liye kab aayen?', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(8, 3, 'Hassan Ahmed',   '+92 300 6677889', 'warm', 0, 'Fee structure email karo please', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(9, 3, 'Maria Qureshi',  '+92 345 8899001', 'hot',  1, 'MDCAT batch mein seat available hai, aaun?', DATE_SUB(NOW(), INTERVAL 4 HOUR));

INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched) VALUES
(7, 'customer', 'Assalam, MDCAT preparation ki classes hain kya?', 'rule', NULL),
(7, 'bot', 'Walaikum Assalam! Haan ji, hum MDCAT preparation classes offer karte hain. Rs. 6000/month mein: daily 3 hour classes, complete notes, weekly mock tests. Morning aur evening batches available. Interested hain?', 'rule', 'services'),
(7, 'customer', 'Haan, mujhe enroll karna hai. Kitni seats hain abhi?', 'rule', NULL),
(7, 'bot', 'Hamare MDCAT batch mein sirf 5 seats bachi hain is month. Abhi register karein aur pehle class free trial lein. Fee partial payment mein bhi accept ki jati hai.', 'rule', 'booking'),
(7, 'customer', 'Registration ke liye kab aayen?', 'rule', NULL),
(7, 'bot', 'Kisi bhi din Sat-Thu 8 AM se 8 PM ke darmiyan aa jayein. Address: G-11 Markaz, Islamabad. Original documents le aayen. Ya kal free trial book karein!', 'rule', 'location'),

(8, 'customer', 'Matric coaching ki fees kya hain?', 'rule', NULL),
(8, 'bot', 'Matric (9th-10th) coaching: Rs. 3500/month. Includes all subjects, notes, past papers. Sibling discount: 15% off. Morning batch (8-11 AM) aur evening (4-7 PM) available.', 'rule', 'pricing'),
(8, 'customer', 'Fee structure email karo please', 'rule', NULL),
(8, 'bot', 'Zaroor! Apna email address share karein. Ya direct visit karein G-11 Markaz par aur complete prospectus le jayein. Free trial class bhi le sakte hain.', 'rule', 'fallback'),

(9, 'customer', 'MDCAT batch ki seat available hai kya?', 'rule', NULL),
(9, 'bot', 'Haan! Abhi limited seats hain MDCAT batch mein. Rs. 6000/month. Daily 3 ghante, complete mock tests, biology chemistry physics sab. Trial class free hai!', 'rule', 'services'),
(9, 'customer', 'MDCAT batch mein seat available hai, aaun?', 'rule', NULL),
(9, 'bot', 'Bilkul! Aaj ya kal aa jayein 9 AM ke baad. Trial class book karein is WhatsApp par. Seat hold kar dete hain aapke liye!', 'rule', 'booking');

-- ─── Business 6: TechFix Lahore ────────────────────────────────────────────

INSERT INTO conversations (id, business_id, customer_name, customer_phone, lead_status, is_contacted, last_message, last_message_at) VALUES
(10, 6, 'Usman Tariq',   '+92 300 9988776', 'hot',  0, 'Samsung S21 ka screen fix kar sakte ho? Kitna hoga?', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(11, 6, 'Nadia Bashir',  '+92 333 6677001', 'warm', 0, 'Theek hai sochti hun, aapka number save kar liya', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(12, 6, 'Kamran Malik',  '+92 321 4433220', 'hot',  1, 'Aaj le aaon laptop?', DATE_SUB(NOW(), INTERVAL 3 HOUR));

INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched) VALUES
(10, 'customer', 'Samsung S21 ka screen toot gaya, repair ho sakta hai?', 'rule', NULL),
(10, 'bot', 'Haan ji! Samsung S21 screen repair available hai. OEM screen ke saath price Rs. 4500-5500. Time: 1-2 ghante. 90-day warranty. Bring in your phone for a free assessment!', 'rule', 'pricing'),
(10, 'customer', 'Samsung S21 ka screen fix kar sakte ho? Kitna hoga?', 'rule', NULL),
(10, 'bot', 'Samsung S21 Ultra screen: Rs. 5000 (OEM) ya Rs. 3500 (compatible). Kaunsa model hai exactly? Address: Liberty Market, Lahore. Monday-Saturday 10 AM - 8 PM.', 'rule', 'pricing'),

(11, 'customer', 'Laptop slow ho gaya hai, clean aur format karte ho?', 'rule', NULL),
(11, 'bot', 'Haan! Laptop clean, format, Windows reinstall + antivirus: Rs. 1500. SSD upgrade bhi available hai (Rs. 8000 se) jo laptop 3x fast kar deta hai. Bring in for free diagnosis.', 'rule', 'services'),
(11, 'customer', 'Theek hai sochti hun, aapka number save kar liya', 'rule', NULL),
(11, 'bot', 'Zaroor! Jab bhi ready hon aayein ya WhatsApp karein. Walk-in available hai, no appointment needed. Thank you!', 'rule', 'fallback'),

(12, 'customer', 'Laptop battery bilkul nahi chalti, replace hogi?', 'rule', NULL),
(12, 'bot', 'Haan, battery replacement available hai Rs. 3500-5500 depending on laptop model. Dell, HP, Lenovo, Asus sab available. 6-month warranty. Kaunsa model hai?', 'rule', 'pricing'),
(12, 'customer', 'Dell Inspiron 15 hai, kab aana hai?', 'rule', NULL),
(12, 'bot', 'Dell Inspiron 15 battery: Rs. 3800. Aaj ya kal kisi bhi time 10 AM - 8 PM ko aa jayein. Liberty Market, Lahore. 45 minute mein ready!', 'rule', 'booking'),
(12, 'customer', 'Aaj le aaon laptop?', 'rule', NULL),
(12, 'bot', 'Bilkul! Aaj aa jayein, technician available hai. Direct aayein, wait nahi karna padega. Address: Shop 12, Liberty Market, Lahore.', 'rule', 'location');

-- ─── Business 10: Golden Bakers ────────────────────────────────────────────

INSERT INTO conversations (id, business_id, customer_name, customer_phone, lead_status, is_contacted, last_message, last_message_at) VALUES
(13, 10, 'Sana Riaz',     '+92 333 5544332', 'hot',  0, 'Birthday cake customize hogi? Chocolate flavor mein?', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(14, 10, 'Ali Raza',      '+92 300 7766554', 'warm', 0, 'Prices reasonable hain, consider kar raha hun', DATE_SUB(NOW(), INTERVAL 7 HOUR));

INSERT INTO messages (conversation_id, sender, message, response_type, rule_matched) VALUES
(13, 'customer', 'Kya aap custom cakes banate hain?', 'rule', NULL),
(13, 'bot', 'Haan ji! Hum custom birthday, wedding aur occasion cakes banate hain. Price Rs. 1200 se shuru (1 kg) se Rs. 4000+ tak (elaborate designs). 24 hour pehle order zaroor karein.', 'rule', 'services'),
(13, 'customer', 'Birthday cake customize hogi? Chocolate flavor mein?', 'rule', NULL),
(13, 'bot', 'Bilkul! Chocolate cake best-seller hai hamare. 1kg: Rs. 1500, 2kg: Rs. 2800. Custom message, fondant decoration, naam sab ho sakta hai. Kab chahiye? Delivery bhi available hai!', 'rule', 'pricing'),

(14, 'customer', 'Croissants aur pastries kitne ki hain?', 'rule', NULL),
(14, 'bot', 'Butter Croissants: Rs. 150 each (6-pack Rs. 800). Cream pastries: Rs. 200-250. Chocolate danish: Rs. 180. Daily fresh baked, morning mein available hoti hain!', 'rule', 'pricing'),
(14, 'customer', 'Prices reasonable hain, consider kar raha hun', 'rule', NULL),
(14, 'bot', 'Shukriya! Hamare bakery mein fresh items daily 7 AM se available hain. Office/event orders par special discount bhi milta hai. Koi bhi sawal ho WhatsApp karein!', 'rule', 'fallback');
