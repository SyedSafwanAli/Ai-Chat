# WhatsApp AI Automation System — Project Summary

## Overview

A full-stack **Multi-tenant SaaS WhatsApp Automation System** for small businesses in Pakistan.
Businesses can connect their WhatsApp number, let an AI bot answer customer queries automatically,
track leads, manage conversations, and configure everything from a clean dashboard.

- **Frontend**: Next.js 14 admin dashboard (`whatsapp-ai-dashboard/`)
- **Backend**: Node.js + Express REST API (`backend/`)
- **Database**: MySQL via phpMyAdmin (XAMPP)
- **GitHub**: https://github.com/SyedSafwanAli/Ai-Chat

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts, Lucide Icons |
| Backend  | Node.js, Express.js, mysql2, bcryptjs, jsonwebtoken, helmet, cors, morgan, dotenv |
| Database | MySQL (XAMPP / phpMyAdmin) |
| Auth     | JWT (24h expiry), bcrypt (10 rounds), Bearer token |

---

## Project Structure

```
Ai Chat/
├── backend/
│   ├── database_complete.sql        ← ⭐ Import this for full setup (schema + all demo data)
│   ├── schema.sql                   ← Schema only (no demo data)
│   ├── server.js                    ← Entry point, graceful shutdown
│   ├── .env.example                 ← Environment variables template
│   ├── scripts/
│   │   ├── create-admin.js          ← One-time super admin seeder
│   │   ├── migrate-platform.js      ← V1 migration
│   │   ├── migrate-v2.js            ← V2 migration (roles, status, indexes)
│   │   └── migrate-whatsapp.js      ← V3 migration (whatsapp columns)
│   └── src/
│       ├── app.js                   ← Express app, CORS, rate limiter
│       ├── config/db.js             ← MySQL connection pool
│       ├── controllers/
│       │   ├── auth.controller.js         ← signup, login, me, logout, changePassword
│       │   ├── conversation.controller.js ← list, get, updateStatus, markContacted, sendReply, listLeads
│       │   ├── dashboard.controller.js    ← KPIs + charts per business
│       │   ├── settings.controller.js     ← business info, services, FAQs, keywords, WhatsApp
│       │   ├── platform.controller.js     ← Super Admin business management
│       │   ├── support.controller.js      ← user + admin support messages
│       │   └── webhook.controller.js      ← Multi-tenant WhatsApp routing
│       ├── middleware/
│       │   ├── authMiddleware.js          ← authenticate, requireAdmin, requireSuperAdmin
│       │   ├── checkPackageAccess.js      ← dual status gate
│       │   └── errorHandler.js
│       ├── models/
│       │   ├── user.model.js              ← findByEmail (JOINs business_name)
│       │   ├── business.model.js          ← findById, update (incl. working_hours)
│       │   ├── conversation.model.js      ← CRUD + markContacted
│       │   ├── faq.model.js
│       │   ├── keyword.model.js
│       │   ├── message.model.js
│       │   └── service.model.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── conversation.routes.js
│       │   ├── settings.routes.js
│       │   ├── super-admin.routes.js
│       │   ├── support.routes.js
│       │   └── webhook.routes.js
│       └── services/
│           ├── ruleEngine.service.js      ← Keyword-based auto-reply
│           └── leadDetector.service.js    ← Hot/Warm/Cold classifier
│
└── whatsapp-ai-dashboard/
    └── src/
        ├── app/
        │   ├── page.tsx                   ← Dashboard
        │   ├── login/page.tsx             ← Login
        │   ├── signup/page.tsx            ← Business registration
        │   ├── conversations/page.tsx     ← Full chat UI with send reply
        │   ├── leads/page.tsx             ← Leads table with filters
        │   ├── ai-usage/page.tsx          ← AI stats + charts
        │   ├── business-settings/page.tsx ← 5-tab settings
        │   ├── support/page.tsx           ← Business support chat
        │   ├── account/page.tsx           ← Profile + password change
        │   └── platform/page.tsx          ← Super Admin panel
        ├── components/
        │   ├── layout/
        │   │   ├── sidebar.tsx            ← Role-aware nav (7 links for business users)
        │   │   ├── topbar.tsx             ← Search, user dropdown, help, bell
        │   │   └── main-layout.tsx        ← Auth guard + role redirect
        │   ├── dashboard/                 ← KPI cards, charts, conversations table, hot leads
        │   ├── business-settings/         ← 5 tab components
        │   ├── ai-usage/                  ← Stats + pie chart
        │   └── ui/                        ← Badge, Button, Card, Input
        ├── contexts/AuthContext.tsx       ← Global auth state
        └── lib/
            ├── api.ts                     ← Fetch wrapper (auto JWT)
            ├── types.ts                   ← Shared TS interfaces
            └── utils.ts                   ← cn() helper
```

---

## All Pages — Detailed Features

### 1. Dashboard (`/`)

**What it shows:**
- **4 KPI Cards**: Total Messages, Total Leads, Conversion Rate (leads/messages %), Rule-Based %
- **Messages Chart**: Area chart showing messages per day for last 7 days (from DB)
- **Leads Chart**: Bar chart showing leads per day for last 7 days (from DB)
- **Conversations Table**: Last 20 conversations — customer name, last message, lead status badge, time ago. Searchable, filterable by Hot/Warm/Cold, paginated (Next/Prev)
- **Hot Leads Panel**: Right side — shows top 5 hot leads with name, message preview, "Mark as Contacted" button
  - Button saves to DB (PATCH API), shows "Saving…" during request, persists on reload
  - "View All Leads →" button navigates to `/leads`
- Greeting: **"Welcome, {BusinessName}"** from logged-in user's JWT
- Uses `Promise.allSettled` — if one API fails, others still load

---

### 2. Login (`/login`)

**What it does:**
- Split-panel layout: blue gradient with branding left, form right
- Email + password fields
- Password show/hide toggle (Eye icon)
- Error message display (red box)
- Loading spinner on submit
- Redirects to dashboard if already logged in
- Link: "Don't have an account? Sign up" → `/signup`
- Login rate limited: max 10 attempts per 15 minutes per IP

---

### 3. Signup (`/signup`)

**What it does:**
- Fields: Business Name, Email, Password, Confirm Password
- Password validation: min 8 chars, must match confirm
- On submit: creates a business row + manager user (both in one DB transaction)
  - Business starts with `package='none'`, `status='pending'`
  - User starts with `status='pending'`
- Success screen: green checkmark + "Account pending activation — contact support" message
- Super Admin must approve the account from the Platform Admin panel before they can login

---

### 4. Conversations (`/conversations`)

**What it does — Full Chat UI:**
- **Left panel** — conversation list:
  - Search by customer name or message
  - Filter tabs: All / Hot / Warm / Cold
  - Each item shows: initials avatar, customer name, last message (truncated), time ago, lead status badge
  - Clicking a conversation loads its messages on the right
  - Active conversation highlighted with blue left border
- **Right panel** — chat detail:
  - Header: customer avatar, name, phone, lead status badge, phone call link
  - **"Set Status" dropdown**: Click to change lead status (Hot / Warm / Cold) — saves to DB immediately, badge updates in both panels
  - **Full message history**: Loads from `GET /api/conversations/:id` — shows all messages in chat bubble format
    - Customer messages: white bubble, left side
    - Bot/AI replies: blue bubble, right side with "AI" badge
    - Manual replies (sent from dashboard): blue bubble with "Manual" violet badge
  - **Send Reply**: Input field + Send button (or press Enter)
    - Saves message to DB via `POST /api/conversations/:id/reply`
    - Optimistically adds message to chat immediately
    - Shows "Sending…" during request, reverts on failure
  - Auto-scrolls to latest message when conversation loads or new message sent
  - Status indicator: "AI Auto-Reply is active · Manual replies tagged as Manual"
- Deep link support: `/conversations?id=X` opens that specific conversation directly (from Leads page)

---

### 5. Leads (`/leads`)

**What it shows:**
- **4 Count Cards**: Total Leads, Hot Leads, Warm Leads, Cold Leads (live counts from DB)
- **Leads Table**:
  - Columns: Lead (avatar + name + phone), Last Message, Status badge, Platform, Last Contact time
  - Search by customer name
  - Filter by status (All / Hot / Warm / Cold dropdown)
  - On row hover: 3 action buttons appear
    - 📞 Call → opens phone dialer
    - 💬 Message → (visual)
    - ↗ View → navigates to `/conversations?id=X` to open that specific conversation
  - Count shown in footer: "X leads shown"
- All data from `/api/leads` (hot + warm conversations from DB)

---

### 6. AI Usage (`/ai-usage`)

**What it shows:**
- **4 Stat Cards**: Total Messages handled, Rule-Based Responses count, AI Fallback count, Estimated Cost
- **Donut Chart**: Visual split of Rule-Based vs AI Fallback percentage
- **Daily Breakdown Bar Chart**: Stacked bars showing rule-based vs fallback per day (7 days)
- **AI Configuration Card**: Shows current bot settings — mode, rules count, FAQ matching method, lead detection method, fallback behavior
- All data from `/api/dashboard/stats`

---

### 7. Business Settings (`/business-settings`)

**5 fully functional tabs:**

#### Tab 1 — General Info
- Business name, phone, website, address, category, AI tone (Professional/Friendly/Casual)
- **Working Hours**: 7-day table (Mon–Sun) — each day has From/To time pickers + Active checkbox
  - Days with active=false are greyed out and time inputs disabled
  - Saved as JSON array in DB
- **Sticky Save Bar** (bottom): only shows on this tab
  - Save/Cancel buttons disabled until user actually edits something
  - Cancel: re-mounts component from DB (true reset, not just state reset)
  - Error toast if API fails (no silent swallowing)

#### Tab 2 — Services
- List of business services with name, price, duration, description
- Add new service (inline form)
- Edit existing service (inline edit mode)
- Delete service (with confirmation)
- Each action saves immediately to DB via API (no save bar needed)

#### Tab 3 — FAQs
- Accordion-style FAQ list (click to expand answer)
- Add new FAQ (question + answer form)
- Edit existing FAQ (inline edit)
- Delete FAQ
- Each action saves immediately to DB

#### Tab 4 — Lead Keywords
- Tag-style display of trigger words
- Type a keyword + press Enter or comma to add
- Click × on any tag to delete
- Keywords are used by the AI bot to detect leads in customer messages

#### Tab 5 — WhatsApp
- Connection status indicator (green dot if connected, grey if not)
- Phone Number ID input field (from Meta Developer Console)
- Access Token input with show/hide toggle (masked with ••••••)
- Connect / Update Credentials / Disconnect buttons
- 8-step Meta setup guide (expandable)
- Token never returned in API response (only `token_set: true/false`)

---

### 8. Support (`/support`)

**What it does:**
- Business users can send messages to the WA AI support team
- Chat-style UI:
  - User messages: blue bubble, right side with initials avatar
  - Admin replies: white bubble, left side with LifeBuoy icon
  - Timestamps + double-checkmark on user messages
  - Auto-scrolls to latest message
- Input + Send button (Enter key supported)
- "Sending…" state during API call
- Error toast if send fails
- Empty state when no messages yet
- Green "Online" indicator in header
- Connected to same backend as Platform Admin support tab

---

### 9. Account (`/account`)

**What it shows:**
- **Profile Card**:
  - Large initials avatar (blue circle)
  - Business name, email, role badge (colour-coded: super_admin=violet, admin=blue, manager=green)
  - Info grid: Email, Role, Business name, Status
- **Change Password Form**:
  - Current Password, New Password, Confirm New Password fields
  - Show/hide toggle on each field
  - Inline validation: "min 8 chars", "passwords don't match" shown immediately
  - Submit validates on frontend, then calls `PUT /api/auth/password`
  - Backend verifies current password with bcrypt before updating
  - Success toast (green) / error toast (red) after API response
  - Form clears on success

---

### 10. Platform Admin (`/platform`) — super_admin only

**What it does:**
- Only accessible to `super_admin` role — all other users redirected away
- **6 KPI Cards**: Total Businesses, Active, Pending Approval, Suspended, Total Credits Used, Total Credits Remaining

#### Businesses Tab
- Paginated table of all businesses (10 per page)
- Search by name/email
- Filter by status (All/Active/Pending/Suspended) and package (All/Basic/Pro/Trial/None)
- Columns: Business name+email, Package badge, Expiry date, Credits (used/remaining), Status badge, Actions
- **Action buttons per row**:
  - **Approve** (for pending): modal — set package (basic/pro/trial), expiry date, starting credits → activates both business + user in one transaction + logs action
  - **Top-up Credits**: modal — add credits to a business
  - **Extend Package**: modal — change package type + expiry date
  - **Suspend / Activate**: toggle button — one-click status change

#### Support Tab
- Left: all business support threads — name, last message preview, unread count badge
- Right: full message history for selected thread
- Admin can type and send a reply to any business
- Unread badge clears when thread is opened
- Messages auto-scroll to bottom

---

## Sidebar Navigation

**For Business Users (manager/admin role):**
1. Dashboard → `/`
2. Conversations → `/conversations`
3. Leads → `/leads`
4. AI Usage → `/ai-usage`
5. Business Settings → `/business-settings`
6. Support → `/support`
7. Account → `/account`

**WhatsApp status badge** shown at top (green dot = connected)

**For Super Admin:**
- Only: Platform Admin → `/platform`

**Sidebar features:**
- Collapsible (toggle button at bottom)
- Collapsed state: icons only with hover tooltips
- Active page highlighted in blue
- User info (initials + email + role) at bottom
- Logout button

---

## Topbar Features

- **Page title + description** (left)
- **Search bar** (center): type and press Enter → navigates to `/conversations` with search query
- **Bell icon**: navigates to `/leads` page
- **Help icon** (LifeBuoy): navigates to `/support` page
- **User profile button** (right): shows business name + role
  - Click opens dropdown menu:
    - Email + business name display
    - "Account & Password" → `/account`
    - "Support" → `/support`
    - "Logout" (red)
  - Dropdown closes on outside click
  - Role label: Manager / Admin / Super Admin (no hardcoded "Owner")

---

## Role System

| Role          | Access |
|---------------|--------|
| `super_admin` | `/platform` only — auto-redirected if tries to access business pages |
| `admin`       | All business routes, bypass package check |
| `manager`     | Business dashboard — scoped to own business only |

**Both `user.status = active` AND `business.status = active` AND valid package required for dashboard access.**

---

## Backend API — Complete List

> All endpoints require `Authorization: Bearer <token>` except `/api/auth/signup`, `/api/auth/login`, `/api/webhook/*`

### Auth
| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| POST   | `/api/auth/signup`    | Create business + manager (pending) |
| POST   | `/api/auth/login`     | Login → returns JWT + business_name |
| GET    | `/api/auth/me`        | Get current user from token |
| POST   | `/api/auth/logout`    | Stateless logout confirm |
| PUT    | `/api/auth/password`  | Change own password (verifies current first) |

### Dashboard
| Method | Endpoint               | Description |
|--------|------------------------|-------------|
| GET    | `/api/dashboard/stats` | KPIs, charts, hot leads — scoped to logged-in business |

### Conversations
| Method | Endpoint                           | Description |
|--------|------------------------------------|-------------|
| GET    | `/api/conversations`               | List with search + status filter + pagination |
| GET    | `/api/conversations/:id`           | Single conversation + full message history |
| PATCH  | `/api/conversations/:id/status`    | Update lead status (hot/warm/cold) — never downgrades |
| PATCH  | `/api/conversations/:id/contacted` | Toggle is_contacted flag |
| POST   | `/api/conversations/:id/reply`     | Send manual reply from dashboard — saves to DB as response_type='manual' |

### Leads
| Method | Endpoint     | Description |
|--------|--------------|-------------|
| GET    | `/api/leads` | Hot + warm conversations only (filtered, paginated) |

### Business Settings
| Method | Endpoint                 | Description |
|--------|--------------------------|-------------|
| GET    | `/api/settings/business` | Get business info |
| PUT    | `/api/settings/business` | Update (name, phone, address, category, tone, working_hours JSON) |
| GET    | `/api/services`          | List all services |
| POST   | `/api/services`          | Add service |
| PUT    | `/api/services/:id`      | Update service |
| DELETE | `/api/services/:id`      | Delete service |
| GET    | `/api/faqs`              | List all FAQs |
| POST   | `/api/faqs`              | Add FAQ |
| PUT    | `/api/faqs/:id`          | Update FAQ |
| DELETE | `/api/faqs/:id`          | Delete FAQ |
| GET    | `/api/keywords`          | List lead keywords |
| POST   | `/api/keywords`          | Add keyword |
| DELETE | `/api/keywords/:id`      | Delete keyword |
| GET    | `/api/whatsapp`          | Connection status (token masked — only returns token_set: bool) |
| PUT    | `/api/whatsapp`          | Save phone_number_id + token |
| DELETE | `/api/whatsapp`          | Disconnect (nulls both fields) |

### Support
| Method | Endpoint       | Description |
|--------|----------------|-------------|
| GET    | `/api/support` | Get own support thread messages |
| POST   | `/api/support` | Send message to admin |

### Super Admin
| Method | Endpoint                                  | Description |
|--------|-------------------------------------------|-------------|
| GET    | `/api/super-admin/stats`                  | Global platform KPIs |
| GET    | `/api/super-admin/businesses`             | All businesses (search, filter, pagination) |
| PATCH  | `/api/super-admin/businesses/:id/approve` | Approve business (package + expiry + credits + activate user) |
| PATCH  | `/api/super-admin/businesses/:id`         | Top-up / extend / suspend / activate |
| GET    | `/api/super-admin/support`                | All support threads with unread counts |
| GET    | `/api/super-admin/support/:userId`        | Full thread for one business |
| POST   | `/api/super-admin/support/:userId`        | Admin reply to business |

### Webhook
| Method | Endpoint                | Description |
|--------|-------------------------|-------------|
| GET    | `/api/webhook/whatsapp` | Meta verify token handshake |
| POST   | `/api/webhook/whatsapp` | Incoming message — routes to correct business by phone_number_id |

### Rate Limits (built-in, no extra packages)
| Route               | Limit |
|---------------------|-------|
| POST `/api/auth/login` | 10 req / 15 min |
| POST `/api/webhook/*`  | 200 req / min |

---

## Database Schema

```
businesses
  ├── id, name, address, phone, website, category, city
  ├── tone ENUM(professional, friendly, casual)
  ├── working_hours JSON          ← 7-day array [{day, from, to, active}]
  ├── whatsapp_phone_number_id    ← Meta phone number ID
  ├── whatsapp_token TEXT         ← per-business WhatsApp token (secret)
  ├── status ENUM(pending, active, suspended)
  ├── package ENUM(none, basic, pro, trial)
  ├── package_expiry DATETIME
  ├── credit_balance DECIMAL      ← remaining credits
  ├── credits_used DECIMAL        ← cumulative (never decremented)
  ├── plan_price, billing_cycle
  │
  ├── services      (name, price, description, duration, is_active)
  ├── faqs          (question, answer)
  ├── lead_keywords (keyword — UNIQUE per business)
  └── conversations (customer_name, customer_phone, lead_status, is_contacted, last_message)
        └── messages (sender: customer|bot, message, response_type: rule|fallback|manual)

users
  ├── email UNIQUE, password (bcrypt 10 rounds)
  ├── role ENUM(super_admin, admin, manager)
  ├── status ENUM(pending, active, blocked)
  └── business_id FK → businesses

support_messages  (user_id FK, message, sender: user|admin)
super_admin_logs  (admin_id FK, action, target_business_id FK)
```

### Working Hours JSON Format
```json
[
  { "day": "Monday",    "from": "09:00", "to": "18:00", "active": true  },
  { "day": "Tuesday",   "from": "09:00", "to": "18:00", "active": true  },
  { "day": "Wednesday", "from": "09:00", "to": "18:00", "active": true  },
  { "day": "Thursday",  "from": "09:00", "to": "18:00", "active": true  },
  { "day": "Friday",    "from": "09:00", "to": "18:00", "active": true  },
  { "day": "Saturday",  "from": "10:00", "to": "16:00", "active": true  },
  { "day": "Sunday",    "from": "00:00", "to": "00:00", "active": false }
]
```

### Access Control Matrix
| User status | Business status | Package    | Access |
|-------------|-----------------|------------|--------|
| pending     | any             | any        | ❌ 403 |
| active      | pending         | any        | ❌ 403 |
| active      | suspended       | any        | ❌ 403 |
| active      | active          | none       | ❌ 403 |
| active      | active          | expired    | ❌ 403 |
| active      | active          | valid      | ✅     |
| blocked     | any             | any        | ❌ Login blocked |
| super_admin | —               | —          | ✅ /platform only |
| admin       | —               | —          | ✅ Bypass all checks |

---

## AI Bot — How It Works

### Rule Engine (no external AI API)
Purely keyword/pattern matching — zero cost per message:

| Priority | Rule     | Triggers |
|----------|----------|----------|
| 1 | Greeting  | hi, hello, hey, assalam, good morning… |
| 2 | Pricing   | price, cost, how much, fee, kitna… |
| 3 | Hours     | hours, open, close, working, when… |
| 4 | Location  | where, address, location, directions… |
| 5 | Booking   | book, appointment, schedule, reserve… |
| 6 | Services  | services, treatments, what do you… |
| 7 | FAQ Match | Word-overlap with stored FAQs (threshold ≥ 2 words) |
| — | Fallback  | Generic response + human handoff message |

The bot uses the business's own **services, FAQs, and keywords** from DB for every reply.

### Lead Detector
Classifies each conversation automatically:
- **Hot** 🔴: booking, appointment, how much, price, want to book, reserve, order…
- **Warm** 🟡: interested, considering, maybe, tell me more, services, package…
- **Cold** ⚪: hi, hello, just asking, just curious, no thanks…
- Lead status **never downgrades** — if hot, stays hot even if next message is cold

### Webhook Message Pipeline
```
Customer sends WhatsApp message
  ↓
Parse payload (Meta Cloud API format OR test format)
  ↓
Resolve business:
  Real WA  → phone_number_id from metadata → lookup businesses table
  Test     → body.business_id → direct lookup
  ↓
Find or create conversation for (business_id, customer_phone)
  ↓
Save customer message to DB
  ↓
Check credit_balance > 0 → if no credits: stop (reply blocked)
  ↓
Rule Engine → generate reply text (uses business's own services/FAQs/keywords)
  ↓
Lead Detector → classify/upgrade lead status
  ↓
Save bot reply to DB (response_type = rule | fallback)
  ↓
Update conversation.last_message snapshot
  ↓
deliverReply() → POST to Meta API using business's own whatsapp_token
  (if no token → console.log mock, no error)
  ↓
deductCredit(businessId) → credit_balance - 1, credits_used + 1
```

---

## WhatsApp Integration (Multi-tenant)

Each business has its **own WhatsApp Business number** — fully isolated:

| Field | Where stored |
|-------|-------------|
| `whatsapp_phone_number_id` | `businesses` table |
| `whatsapp_token` | `businesses` table (never exposed in API) |

### Setup Steps (per business)
1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App (Business type)
2. Add WhatsApp product → Add & verify a phone number
3. Copy **Phone Number ID** and **Permanent Access Token**
4. In dashboard: Business Settings → WhatsApp tab → Enter credentials → Connect
5. Register webhook URL: `https://yourdomain.com/api/webhook/whatsapp`
6. Set `WHATSAPP_VERIFY_TOKEN` in backend `.env`
7. Subscribe to `messages` webhook field on Meta

### Test Without WhatsApp
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

## Demo Accounts

### Super Admin
| Email | Password | Access |
|-------|----------|--------|
| `admin@gmail.com` | `Admin!123` | Platform Admin only |

### Demo Businesses — Password: `Demo@1234` for all

| Email | Business | Package | Status | City |
|-------|----------|---------|--------|------|
| `pizza@pizzarun.pk` | PizzaRun Karachi | pro | active | Karachi |
| `info@alhamdpharma.pk` | Al-Hamd Pharmacy | basic | active | Lahore |
| `admin@sunriseacademy.edu.pk` | Sunrise Academy | pro | active | Islamabad |
| `hassan@autoparts.pk` | Hassan Auto Parts | trial | active | Lahore |
| `hello@bloomboutique.pk` | Bloom Boutique | basic | active | Lahore |
| `support@techfix.pk` | TechFix Lahore | pro | active | Lahore |
| `greenvalley@farm.pk` | Green Valley Farm | none | pending | Sargodha |
| `crystal@spakarachi.pk` | Crystal Spa & Salon | none | pending | Karachi |
| `ops@swiftcourier.pk` | Swift Courier Services | basic | suspended | Karachi |
| `info@goldenbakers.pk` | Golden Bakers | basic | active | Lahore |

Each active business has: unique services, FAQs, lead keywords, working hours, and sample conversations with message history.

---

## Setup Instructions

### Quick Setup (Recommended)
1. **Database**: phpMyAdmin → Create `whatsapp_ai` DB → Import `backend/database_complete.sql`
   - This creates all tables + super admin + 10 demo businesses in one step
2. **Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env — set JWT_SECRET (any long random string)
   npm run dev       # runs on http://localhost:5000
   ```
3. **Frontend**:
   ```bash
   cd whatsapp-ai-dashboard
   npm install
   npm run dev       # runs on http://localhost:3000
   ```
4. Open `http://localhost:3000/login` — login with any demo account

### Environment Variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=whatsapp_ai
DB_USER=root
DB_PASSWORD=                    # leave empty for XAMPP default

JWT_SECRET=your_long_random_secret_minimum_32_characters
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:3000

# WhatsApp (per-business tokens stored in DB)
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
```

**`whatsapp-ai-dashboard/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Complete Feature Log

| # | Feature | Description |
|---|---------|-------------|
| 1 | Next.js frontend | 10 pages, 25+ components, App Router, Tailwind CSS |
| 2 | Express backend | REST API, middleware chain, graceful shutdown |
| 3 | MySQL schema | 8 tables, foreign keys, indexes, JSON columns |
| 4 | JWT auth | Login → token, 24h expiry, Bearer header auto-attached |
| 5 | bcrypt passwords | 10 rounds hashing, changePassword endpoint |
| 6 | AuthContext | Global user state, business_name from DB JOIN on login |
| 7 | api.ts wrapper | Centralized fetch, auto JWT, throws ApiError on failure |
| 8 | Dashboard KPIs | 4 real-time cards from DB — messages, leads, conversion, rule % |
| 9 | Dashboard charts | Messages/day + leads/day area and bar charts (Recharts) |
| 10 | Conversations table | Search, filter, pagination, lead status badge |
| 11 | Hot Leads Panel | Top 5 hot leads, Mark as Contacted (saves to DB), View All Leads navigation |
| 12 | Full Conversations page | Real message history, chat bubbles, send manual reply, set lead status dropdown |
| 13 | Manual Reply | POST /conversations/:id/reply → saves as response_type='manual', shows "Manual" badge |
| 14 | Lead status dropdown | Set Hot/Warm/Cold per conversation — live update, saves to DB |
| 15 | Leads page | Count cards, searchable/filterable table, View button → opens conversation |
| 16 | AI Usage page | Stats, donut chart, stacked bar chart, bot configuration display |
| 17 | Business Settings | 5-tab settings page — all data from DB |
| 18 | General Info tab | Name, phone, website, address, category, tone — save bar with dirty state detection |
| 19 | Working Hours | 7-day controlled inputs, time pickers, active toggle, saved as JSON |
| 20 | Services tab | Add/edit/delete services — instant DB save per action |
| 21 | FAQs tab | Accordion display, add/edit/delete — instant DB save |
| 22 | Lead Keywords tab | Tag input, add/delete keywords — instant DB save |
| 23 | WhatsApp tab | Connect per-business number, masked token, disconnect, Meta setup guide |
| 24 | Support page | Business → admin chat, send/receive messages, auto-scroll, empty state |
| 25 | Account page | Profile info card, change password form with validation and toasts |
| 26 | Signup flow | Business + user created in one transaction, pending until admin approves |
| 27 | Platform Admin | Super admin panel — KPIs, paginated business table, search + filters |
| 28 | Approve business | Modal: set package + expiry + credits, activates both business+user atomically |
| 29 | Top-up / Extend | Add credits or change package expiry for any business |
| 30 | Suspend / Activate | One-click business status toggle |
| 31 | Admin Support tab | All threads, unread badges, send replies — full chat UI |
| 32 | Role system | super_admin / admin / manager — separate middleware, auto-redirect |
| 33 | Package access gate | checkPackageAccess: both statuses + package + expiry checked fresh from DB |
| 34 | Rate limiting | Built-in, no packages — 10/15min login, 200/min webhook |
| 35 | Credit system | credit_balance check before reply, deduct after, never below 0 |
| 36 | Audit logs | super_admin_logs — every platform action recorded with admin_id + target |
| 37 | Rule engine | 7-priority keyword matching, uses business's own services/FAQs/keywords |
| 38 | Lead detector | Hot/Warm/Cold auto-classification, never downgrades |
| 39 | Multi-tenant webhook | Routes by phone_number_id → correct business, per-business token for delivery |
| 40 | WhatsApp mock mode | No token = console.log, no crash — safe for development |
| 41 | Topbar | Functional search, user dropdown (account/support/logout), help → support |
| 42 | Sidebar | 7 links for business users, collapsible, tooltips when collapsed |
| 43 | Hydration fix | suppressHydrationWarning on body — fixes browser extension conflicts |
| 44 | database_complete.sql | Single file: full schema + super admin + 10 demo businesses + all data |
