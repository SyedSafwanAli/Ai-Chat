# WhatsApp AI Automation System — Project Summary

## Overview

A full-stack **Multi-tenant SaaS WhatsApp Automation System** for small businesses:

- **Frontend**: Next.js 14 admin dashboard (`whatsapp-ai-dashboard/`)
- **Backend**: Node.js + Express REST API (`backend/`)
- **Database**: MySQL / phpMyAdmin (XAMPP)

---

## Tech Stack

| Layer    | Technology                                     |
|----------|------------------------------------------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts, Lucide Icons |
| Backend  | Node.js, Express.js, mysql2, bcryptjs, jsonwebtoken, helmet, cors, morgan, dotenv |
| Database | MySQL (XAMPP / phpMyAdmin)                     |
| Auth     | JWT (24 h expiry), bcrypt (10 rounds), Bearer token |

---

## Project Structure

```
Ai Chat/
├── whatsapp-ai-dashboard/       ← Next.js frontend
│   ├── src/
│   │   ├── app/                 ← Pages (App Router)
│   │   │   ├── page.tsx                  ← Dashboard (business name greeting)
│   │   │   ├── login/page.tsx            ← Login (+ "Sign up" link)
│   │   │   ├── signup/page.tsx           ← Business self-registration
│   │   │   ├── platform/page.tsx         ← Super Admin Platform Control
│   │   │   ├── conversations/page.tsx    ← Conversations
│   │   │   ├── leads/page.tsx            ← Leads
│   │   │   ├── ai-usage/page.tsx         ← AI Usage
│   │   │   └── business-settings/page.tsx← Settings (5 tabs)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── main-layout.tsx       ← Auth guard + super_admin redirect
│   │   │   │   ├── sidebar.tsx           ← Role-aware nav (Platform Admin = super_admin only)
│   │   │   │   └── topbar.tsx            ← Real business name / "Super Admin" display
│   │   │   ├── dashboard/       ← KPI cards, charts, tables, HotLeadsPanel
│   │   │   ├── business-settings/
│   │   │   │   ├── general-info-tab.tsx  ← Dynamic from DB (incl. 7-day working hours)
│   │   │   │   ├── services-tab.tsx      ← Dynamic from DB (add/edit/delete)
│   │   │   │   ├── faqs-tab.tsx          ← Dynamic from DB (add/edit/delete)
│   │   │   │   ├── lead-keywords-tab.tsx ← Dynamic from DB (add/delete)
│   │   │   │   └── whatsapp-tab.tsx      ← Connect WhatsApp number (phone_number_id + token)
│   │   │   ├── ai-usage/        ← Stats, charts, cost card
│   │   │   └── ui/              ← Button, Card, Badge, Input
│   │   ├── lib/
│   │   │   ├── api.ts           ← Centralized fetch wrapper (auto JWT)
│   │   │   ├── types.ts         ← Shared interfaces (Conversation, HotLead, LeadStatus)
│   │   │   └── utils.ts         ← cn() utility
│   │   └── contexts/
│   │       └── AuthContext.tsx  ← Global auth state (login/logout/user + business_name)
│   └── package.json
│
├── backend/                     ← Express API server
│   ├── server.js                ← Entry point, graceful shutdown
│   ├── schema.sql               ← MySQL schema + seed data
│   ├── .env.example             ← Environment variables template
│   ├── scripts/
│   │   ├── create-admin.js      ← One-time admin user seeder
│   │   ├── migrate-platform.js  ← V1 migration (credit_balance, super_admin_logs)
│   │   ├── migrate-v2.js        ← V2 migration (roles, business.status, indexes)
│   │   └── migrate-whatsapp.js  ← V3 migration (whatsapp_phone_number_id, whatsapp_token)
│   └── src/
│       ├── app.js               ← Express app, middleware, built-in rate limiter
│       ├── config/db.js         ← MySQL connection pool
│       ├── models/
│       │   ├── user.model.js    ← findByEmail JOINs businesses → returns business_name
│       │   └── business.model.js← findById, update (incl. working_hours JSON)
│       ├── controllers/
│       │   ├── auth.controller.js         ← signup, login, me, logout
│       │   ├── settings.controller.js     ← business info, services, FAQs, keywords, WhatsApp
│       │   ├── dashboard.controller.js    ← KPIs + charts (per-business via req.user.business_id)
│       │   ├── conversation.controller.js ← conversations, leads (per-business)
│       │   ├── platform.controller.js     ← Super Admin handlers
│       │   ├── support.controller.js      ← user + admin support messages
│       │   └── webhook.controller.js      ← Multi-tenant routing by phone_number_id
│       ├── routes/
│       │   ├── auth.routes.js          ← /api/auth/*
│       │   ├── settings.routes.js      ← /api/settings/*, /api/services/*, /api/faqs/*,
│       │   │                              /api/keywords/*, /api/whatsapp
│       │   ├── super-admin.routes.js   ← /api/super-admin/*
│       │   ├── support.routes.js       ← /api/support
│       │   └── admin.routes.js         ← /api/admin/* (legacy)
│       ├── services/            ← Rule engine + lead detector
│       ├── middleware/
│       │   ├── authMiddleware.js       ← authenticate, requireAdmin, requireSuperAdmin
│       │   ├── checkPackageAccess.js   ← dual status gate (user + business)
│       │   └── errorHandler.js
│       └── utils/               ← Response helpers, logger
│
└── PROJECT_SUMMARY.md           ← This file
```

---

## Frontend Pages

### 1. Dashboard (`/`)
- 4 KPI cards: Total Messages, Total Leads, Conversion Rate, Rule-Based %
- Area chart: Messages per day (7 days)
- Bar chart: Leads per day
- Conversations table with search, status filter, pagination
- Hot Leads panel — real API data, clean empty state when no leads
- `pageDescription` shows **"Welcome, {BusinessName}"** from logged-in user
- Uses `Promise.allSettled` — each API fails independently
- No dummy/fallback data for conversations or hot leads

### 2. Login (`/login`)
- Split-panel layout: blue gradient left, form right
- Email + password with show/hide toggle
- "Don't have an account? Sign up" link → `/signup`

### 3. Signup (`/signup`)
- Fields: Business Name, Email, Password, Confirm Password
- Calls `POST /api/auth/signup` → creates business (package=none) + manager user (status=pending)
- Success: green screen with "Account pending activation" message

### 4. Platform Admin (`/platform`) — super_admin only
- 6 KPI stat cards: total/active/pending/suspended businesses, credits used/remaining
- **Businesses tab**: paginated table, search, status/package filters
  - Approve (package + expiry + credits), Top-up, Extend, Suspend/Activate modals
- **Support tab**: all business-owner threads, unread badge, lazy message loading

### 5. Conversations (`/conversations`)
- Split-pane layout: conversation list (left) + chat detail (right)

### 6. Leads (`/leads`)
- Status count cards (Hot / Warm / Cold / All), filterable table

### 7. AI Usage (`/ai-usage`)
- Usage statistics, donut chart, stacked bar chart, cost card

### 8. Business Settings (`/business-settings`)
**5 tabs — all data fetched dynamically from DB:**

| Tab | What it does |
|-----|--------------|
| General Info | Business name, phone, website, address, category, tone. **Working hours: fully dynamic 7-day array** (loaded from DB, controlled inputs, saved to DB) |
| Services | Add/edit/delete service catalog — live API calls |
| FAQs | Add/edit/delete FAQs — live API calls |
| Lead Keywords | Add/delete trigger words — live API calls |
| **WhatsApp** | Connect WhatsApp number: Phone Number ID + token. Shows connection status, masked token input, disconnect button, Meta setup guide |

**Save bar behavior:**
- Only shown on **General Info** tab (other tabs save immediately per action)
- Save/Cancel disabled until actual changes made
- Shows error toast on API failure (no silent swallowing)
- Cancel re-mounts the tab and refetches from DB (true reset)

---

## Role System

| Role          | Access                                        |
|---------------|-----------------------------------------------|
| `super_admin` | `/platform` only — redirected away from business pages |
| `admin`       | Legacy admin routes, support — has `business_id` |
| `manager`     | Business dashboard, settings — scoped to own business |

### Route Guards
- **Backend**: `requireSuperAdmin` checks `role === 'super_admin'` exactly
- **Backend**: `requireAdmin` accepts `admin` OR `super_admin`
- **Frontend**: `main-layout.tsx` — if `super_admin` and not on `/platform*` → redirect to `/platform`
- **Sidebar**: "Platform Admin" link visible only when `role === 'super_admin'`

---

## Backend API Endpoints

> All endpoints except `/api/auth/*` and `/api/webhook/*` require
> `Authorization: Bearer <token>` header.

### Auth (public)
| Method | Endpoint           | Description                              |
|--------|--------------------|------------------------------------------|
| POST   | `/api/auth/signup` | Create business + manager user (pending) |
| POST   | `/api/auth/login`  | Email + password → JWT + business_name  |
| GET    | `/api/auth/me`     | Returns current user (needs token)       |
| POST   | `/api/auth/logout` | Stateless logout (needs token)           |

### Dashboard
| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/api/dashboard/stats` | KPIs, charts, hot leads        |

### Conversations
| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| GET    | `/api/conversations`               | List with pagination           |
| GET    | `/api/conversations/:id`           | Single conversation + messages |
| PATCH  | `/api/conversations/:id/status`    | Update lead status             |
| PATCH  | `/api/conversations/:id/contacted` | Toggle contacted flag          |

### Leads
| Method | Endpoint     | Description               |
|--------|--------------|---------------------------|
| GET    | `/api/leads` | Returns `conversations` key (hot/warm leads) |

### Business Settings
| Method | Endpoint                 | Description               |
|--------|--------------------------|---------------------------|
| GET    | `/api/settings/business` | Get business info         |
| PUT    | `/api/settings/business` | Update (name, phone, address, category, tone, working_hours) |
| GET    | `/api/services`          | List services             |
| POST   | `/api/services`          | Add service               |
| PUT    | `/api/services/:id`      | Update service            |
| DELETE | `/api/services/:id`      | Delete service            |
| GET    | `/api/faqs`              | List FAQs                 |
| POST   | `/api/faqs`              | Add FAQ                   |
| PUT    | `/api/faqs/:id`          | Update FAQ                |
| DELETE | `/api/faqs/:id`          | Delete FAQ                |
| GET    | `/api/keywords`          | List lead keywords        |
| POST   | `/api/keywords`          | Add keyword               |
| DELETE | `/api/keywords/:id`      | Remove keyword            |
| GET    | `/api/whatsapp`          | Get WhatsApp connection status (token masked) |
| PUT    | `/api/whatsapp`          | Save phone_number_id + token |
| DELETE | `/api/whatsapp`          | Disconnect WhatsApp       |

### Support (JWT required, no package check)
| Method | Endpoint       | Description                |
|--------|----------------|----------------------------|
| GET    | `/api/support` | Get own support thread     |
| POST   | `/api/support` | Send message to admin      |

### Super Admin Platform (JWT + super_admin role)
| Method | Endpoint                                  | Description                                      |
|--------|-------------------------------------------|--------------------------------------------------|
| GET    | `/api/super-admin/stats`                  | Global KPIs                                      |
| GET    | `/api/super-admin/businesses`             | Paginated list with search/status/pkg filter     |
| PATCH  | `/api/super-admin/businesses/:id/approve` | Approve: status, package, expiry, credits        |
| PATCH  | `/api/super-admin/businesses/:id`         | Update status / package / expiry / top-up        |
| GET    | `/api/super-admin/support`                | All threads with unread count + last message     |
| GET    | `/api/super-admin/support/:userId`        | Full message history for one thread              |
| POST   | `/api/super-admin/support/:userId`        | Admin reply to a user                            |

### Webhook (public, rate limited: 200 req/min)
| Method | Endpoint                | Description               |
|--------|-------------------------|---------------------------|
| GET    | `/api/webhook/whatsapp` | WhatsApp verify token handshake |
| POST   | `/api/webhook/whatsapp` | Incoming message — multi-tenant routing by phone_number_id |

### Rate Limiting (built-in, no extra package)
| Route                    | Limit           |
|--------------------------|-----------------|
| `POST /api/auth/login`   | 10 req / 15 min |
| `POST /api/webhook/*`    | 200 req / min   |

---

## Database Schema (MySQL)

```
users             ← role ENUM('super_admin','admin','manager')
                     status ENUM('pending','active','blocked')
                     email UNIQUE, bcrypt password, business_id FK

businesses        ← name, address, phone, website, category, city, tone
                     working_hours JSON        ← 7-day array format
                     whatsapp_phone_number_id  ← Meta phone number ID (V3)
                     whatsapp_token TEXT        ← per-business WA token (V3)
                     status ENUM('pending','active','suspended')
                     package ENUM('none','basic','pro','trial')
                     package_expiry DATETIME
                     credit_balance DECIMAL(10,2)
                     credits_used   DECIMAL(10,2)
                     plan_price DECIMAL(10,2)
                     billing_cycle ENUM('monthly','yearly')
  └── services        ← name, price, description, duration, is_active
  └── faqs            ← question, answer
  └── lead_keywords   ← keyword UNIQUE per business
  └── conversations   ← lead_status ENUM('hot','warm','cold'), is_contacted
        └── messages  ← sender ENUM('customer','bot'), response_type

support_messages  ← user_id FK, message, sender ENUM('user','admin')
super_admin_logs  ← admin_id FK, action VARCHAR(255), target_business_id FK
```

### Working Hours Format (JSON)
Stored as a 7-element array — one entry per day:
```json
[
  { "day": "Monday",    "from": "09:00", "to": "18:00", "active": true },
  { "day": "Tuesday",   "from": "09:00", "to": "18:00", "active": true },
  { "day": "Wednesday", "from": "09:00", "to": "18:00", "active": true },
  { "day": "Thursday",  "from": "09:00", "to": "18:00", "active": true },
  { "day": "Friday",    "from": "09:00", "to": "18:00", "active": true },
  { "day": "Saturday",  "from": "10:00", "to": "16:00", "active": true },
  { "day": "Sunday",    "from": "00:00", "to": "00:00", "active": false }
]
```

### Dual Status Model (V2)
- `user.status` — controls login access (`pending/active/blocked`)
- `business.status` — controls dashboard access (`pending/active/suspended`)
- Both must be `active` for business users to access dashboard
- `approveBusiness` sets BOTH in a single DB transaction

### Credits Model
- `credit_balance` — remaining credits pool
- `credits_used` — cumulative consumed (never decremented)
- Webhook: checks `credit_balance > 0` before replying; deducts 1 after delivery
- Uses `GREATEST(credit_balance - 1, 0)` to never go below zero

### Access Rules

| User status  | Business status | Package   | Dashboard access |
|--------------|-----------------|-----------|------------------|
| `pending`    | any             | any       | ❌ 403           |
| `active`     | `pending`       | any       | ❌ 403           |
| `active`     | `suspended`     | any       | ❌ 403           |
| `active`     | `active`        | `none`    | ❌ 403           |
| `active`     | `active`        | expired   | ❌ 403           |
| `active`     | `active`        | valid     | ✅ allowed       |
| `blocked`    | any             | any       | ❌ login blocked |
| `super_admin`| —               | —         | ✅ /platform only|
| `admin`      | —               | —         | ✅ always bypass |

---

## Key Services

### Rule Engine (`src/services/ruleEngine.service.js`)
No AI API — purely keyword/pattern matching:

| Priority | Rule      | Trigger Keywords                        |
|----------|-----------|-----------------------------------------|
| 1        | Greeting  | hi, hello, hey, good morning…          |
| 2        | Pricing   | price, cost, how much, fee…            |
| 3        | Hours     | hours, open, close, working, when…     |
| 4        | Location  | where, address, location, directions…  |
| 5        | Booking   | book, appointment, schedule, reserve…  |
| 6        | Services  | services, treatments, what do you…     |
| 7        | FAQ       | Word-overlap match (threshold ≥ 2 words)|
| Fallback | —         | Generic response with human handoff     |

### Lead Detector (`src/services/leadDetector.service.js`)
- **Hot**: booking, appointment, reserve, how much, price, cost, want to book…
- **Warm**: interested, considering, maybe, tell me more, services, package…
- **Cold**: hi, hello, just asking, just curious, no thanks…
- Status **never downgrades** (hot stays hot even if next message is cold)

### Webhook Message Pipeline (Multi-tenant)
```
Customer message received via WhatsApp
  → Parse payload (Cloud API format OR test format)
  → Resolve business:
      Real WA: phone_number_id → businesses.whatsapp_phone_number_id lookup
      Test:    body.business_id → direct lookup
  → Find or create Conversation for that business
  → Save customer message to DB
  → hasCredits(businessId) → if no credits: reply blocked
  → Rule Engine (per-business services/FAQs/keywords) → generate reply
  → Detect lead status → upgrade if needed
  → Save bot reply to DB
  → Update conversation last_message snapshot
  → deliverReply using business's own whatsapp_token
      (mock console.log if no token configured)
  → deductCredit(businessId)
```

---

## WhatsApp Integration

### Architecture
- **Multi-tenant**: each business has its own WhatsApp Business number
- Credentials stored per-business in DB: `whatsapp_phone_number_id` + `whatsapp_token`
- Webhook routes messages to correct business based on `phone_number_id` in payload
- Token never exposed in API responses (masked as `••••••••`)

### Setup per Business
1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App (Business type)
2. Add WhatsApp product → Add & verify a phone number
3. Copy **Phone Number ID** and **Permanent Access Token**
4. Enter in **Business Settings → WhatsApp tab** in dashboard
5. Register webhook: `https://yourdomain.com/api/webhook/whatsapp`
6. Set `WHATSAPP_VERIFY_TOKEN` in backend `.env`
7. Subscribe to `messages` webhook field

### Dev / Test Mode
- No token configured → replies logged to console (mock mode)
- Test webhook with `business_id` in payload:
```bash
curl -X POST http://localhost:5000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+923001234567",
    "name": "Test Customer",
    "message": "How much is a haircut?",
    "business_id": 2
  }'
```

---

## Registered Accounts

### Super Admin
| Email             | Password    | Role        |
|-------------------|-------------|-------------|
| `admin@gmail.com` | `Admin!123` | super_admin |

### Demo Businesses (password: `Demo@1234` for all)
| Email                          | Business               | Package | Status    | City       |
|--------------------------------|------------------------|---------|-----------|------------|
| `pizza@pizzarun.pk`            | PizzaRun Karachi       | pro     | active    | Karachi    |
| `info@alhamdpharma.pk`         | Al-Hamd Pharmacy       | basic   | active    | Lahore     |
| `admin@sunriseacademy.edu.pk`  | Sunrise Academy        | pro     | active    | Islamabad  |
| `hassan@autoparts.pk`          | Hassan Auto Parts      | trial   | active    | Lahore     |
| `hello@bloomboutique.pk`       | Bloom Boutique         | basic   | active    | Lahore     |
| `support@techfix.pk`           | TechFix Lahore         | pro     | active    | Lahore     |
| `greenvalley@farm.pk`          | Green Valley Farm      | none    | pending   | Sargodha   |
| `crystal@spakarachi.pk`        | Crystal Spa & Salon    | none    | pending   | Karachi    |
| `ops@swiftcourier.pk`          | Swift Courier Services | basic   | suspended | Karachi    |
| `info@goldenbakers.pk`         | Golden Bakers          | basic   | active    | Lahore     |

Each business has unique: services, FAQs, lead keywords, working hours, conversations.
> Note: Demo data was seeded directly into DB via phpMyAdmin. `seed-demo.js` has been removed — all data comes exclusively from the database.

---

## Setup Instructions

### 1. Database Setup (phpMyAdmin)
1. Open `http://localhost/phpmyadmin`
2. Create database `whatsapp_ai` (collation: `utf8mb4_unicode_ci`)
3. Import `backend/schema.sql`

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET
npm run dev          # http://localhost:5000
```

### 3. Run Migrations (in order)
```bash
npm run migrate:v2          # roles, business.status, indexes, super_admin promotion
npm run migrate:whatsapp    # whatsapp_phone_number_id + whatsapp_token columns
```

### 4. Frontend Setup
```bash
cd whatsapp-ai-dashboard
npm install
npm run dev          # http://localhost:3000
```

### 5. Access
- **Business login**: `http://localhost:3000/login`
- **New business signup**: `http://localhost:3000/signup`
- **Super Admin**: login as `admin@gmail.com` → auto-redirected to `/platform`

### 6. Environment Variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=whatsapp_ai
DB_USER=root
DB_PASSWORD=              # leave empty for XAMPP default

JWT_SECRET=change_this_to_a_long_random_secret_minimum_32_chars
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:3000

# WhatsApp (global defaults — per-business tokens stored in DB)
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
```

**`whatsapp-ai-dashboard/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## What Was Built — Full Session Log

| #  | Task                                                                        | Status      |
|----|-----------------------------------------------------------------------------|-------------|
| 1  | Next.js frontend (8 pages, 20+ components)                                  | ✅ Complete |
| 2  | Node.js/Express backend (REST API, rule engine, lead detector)               | ✅ Complete |
| 3  | MySQL schema with seed data + phpMyAdmin import                              | ✅ Complete |
| 4  | JWT authentication (login, protected routes, 24h expiry)                    | ✅ Complete |
| 5  | bcrypt password hashing + admin seeder script                               | ✅ Complete |
| 6  | Frontend AuthContext + `business_name` in login response (DB JOIN)          | ✅ Complete |
| 7  | Centralized API wrapper (`api.ts`) with auto Bearer token                   | ✅ Complete |
| 8  | Dashboard — real API data, `Promise.allSettled`, no dummy leads             | ✅ Complete |
| 9  | HotLeadsPanel — clean empty state, no red gradient header                   | ✅ Complete |
| 10 | Conversations, Leads, AI Usage, Business Settings pages                     | ✅ Complete |
| 11 | SaaS signup (`/signup`) — business + manager in single transaction          | ✅ Complete |
| 12 | `checkPackageAccess` middleware (user.status + business.status + package)   | ✅ Complete |
| 13 | Support chat — user GET/POST + admin GET/POST per-user thread               | ✅ Complete |
| 14 | `migrate-platform.js` + `migrate-v2.js` — safe migration scripts           | ✅ Complete |
| 15 | `seed-demo.js` — 10 Pakistani demo businesses, unique data per business     | ✅ Complete |
| 16 | Role system: `super_admin / admin / manager` with separate middlewares      | ✅ Complete |
| 17 | Super Admin routes `/api/super-admin/*` with `requireSuperAdmin`            | ✅ Complete |
| 18 | `approveBusiness` — atomic transaction (status, pkg, expiry, credits, user) | ✅ Complete |
| 19 | Platform Admin page — Approve/TopUp/Extend/Suspend modals                   | ✅ Complete |
| 20 | Sidebar — "Platform Admin" visible only to `super_admin`                    | ✅ Complete |
| 21 | Built-in rate limiter — 10 login/15min, 200 webhook/min                    | ✅ Complete |
| 22 | Credit enforcement — check before reply, deduct after delivery              | ✅ Complete |
| 23 | Topbar — real business name from DB; "Super Admin" for super_admin          | ✅ Complete |
| 24 | Dashboard greeting — "Welcome, {BusinessName}"                              | ✅ Complete |
| 25 | Super admin redirect — `main-layout.tsx` enforces `/platform` only         | ✅ Complete |
| 26 | Audit log (`super_admin_logs`) for all platform mutations                   | ✅ Complete |
| 27 | **Fixed `BIZ_ID()` bug** in settings/dashboard/conversation/webhook controllers — now uses `req.user.business_id` | ✅ Complete |
| 28 | **Business Settings — all tabs fully dynamic** from DB (no hardcoded data) | ✅ Complete |
| 29 | **Working Hours** — 7-day array format, fully controlled inputs, saved to DB | ✅ Complete |
| 30 | **Settings save bar bugs fixed** — only on General tab, error toasts, proper cancel/reset | ✅ Complete |
| 31 | **`onLoad` / `onChange` separation** — dirty state only on user edits, not initial fetch | ✅ Complete |
| 32 | **`seed-demo.js` upgraded** — per-business services/FAQs/keywords, 7-day working_hours format, fills missing data on re-run | ✅ Complete |
| 33 | **`migrate-whatsapp.js`** — adds `whatsapp_phone_number_id` + `whatsapp_token` to businesses | ✅ Complete |
| 34 | **Multi-tenant WhatsApp webhook** — routes messages by `phone_number_id` to correct business | ✅ Complete |
| 35 | **WhatsApp settings API** — `GET/PUT/DELETE /api/whatsapp` per business    | ✅ Complete |
| 36 | **WhatsApp tab** in Business Settings — connect number, masked token, disconnect, setup guide | ✅ Complete |
| 37 | **Removed `dummy-data.ts` and `seed-demo.js`** — all data 100% DB-driven; `types.ts` created for shared interfaces (`Conversation`, `HotLead`, `LeadStatus`) | ✅ Complete |
