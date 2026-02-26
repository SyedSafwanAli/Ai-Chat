'use strict';

const router = require('express').Router();
const {
  getPlatformStats,
  listBusinesses,
  approveBusiness,
  updateBusiness,
  getPlatformSupport,
  getThreadMessages,
  replyToSupport,
} = require('../controllers/platform.controller');

// ── Stats ─────────────────────────────────────────────────────────────────────
// GET  /api/super-admin/stats
router.get('/stats', getPlatformStats);

// ── Businesses ────────────────────────────────────────────────────────────────
// GET   /api/super-admin/businesses
// PATCH /api/super-admin/businesses/:id/approve   ← new: full approval flow
// PATCH /api/super-admin/businesses/:id
router.get  ('/businesses',              listBusinesses);
router.patch('/businesses/:id/approve', approveBusiness);
router.patch('/businesses/:id',          updateBusiness);

// ── Support ───────────────────────────────────────────────────────────────────
// GET  /api/super-admin/support
// GET  /api/super-admin/support/:userId
// POST /api/super-admin/support/:userId
router.get ('/support',          getPlatformSupport);
router.get ('/support/:userId',  getThreadMessages);
router.post('/support/:userId',  replyToSupport);

module.exports = router;
