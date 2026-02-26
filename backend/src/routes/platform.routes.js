'use strict';

const router = require('express').Router();
const {
  getPlatformStats,
  listBusinesses,
  updateBusiness,
  getPlatformSupport,
  getThreadMessages,
  replyToSupport,
} = require('../controllers/platform.controller');

// ── Stats ──────────────────────────────────────────────────────────────────────
// GET  /api/admin/platform/stats
router.get('/stats', getPlatformStats);

// ── Businesses ─────────────────────────────────────────────────────────────────
// GET   /api/admin/platform/businesses        — paginated list with filters
// PATCH /api/admin/platform/businesses/:id    — update status / package / credits
router.get  ('/businesses',       listBusinesses);
router.patch('/businesses/:id',   updateBusiness);

// ── Support (admin ↔ business-owner only — no customer data) ──────────────────
// GET  /api/admin/platform/support            — all thread metadata + unread count
// GET  /api/admin/platform/support/:userId    — full message history for one thread
// POST /api/admin/platform/support/:userId    — admin reply
router.get ('/support',           getPlatformSupport);
router.get ('/support/:userId',   getThreadMessages);
router.post('/support/:userId',   replyToSupport);

module.exports = router;
