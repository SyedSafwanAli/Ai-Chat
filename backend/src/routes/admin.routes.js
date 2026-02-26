'use strict';

const router = require('express').Router();
const {
  listPending,
  activate,
  suspend,
  getAllThreads,
  replyToUser,
} = require('../controllers/admin.controller');
const platformRoutes = require('./platform.routes');

// ─── Business activation ──────────────────────────────────────────────────────
// GET    /api/admin/businesses/pending       — list pending signups
// PATCH  /api/admin/businesses/:id/activate  — activate + assign package
// PATCH  /api/admin/businesses/:id/suspend   — suspend + block users
router.get  ('/businesses/pending',          listPending);
router.patch('/businesses/:id/activate',     activate);
router.patch('/businesses/:id/suspend',      suspend);

// ─── Admin support ────────────────────────────────────────────────────────────
// GET    /api/admin/support                  — all support messages (all users)
// POST   /api/admin/support/:userId          — reply to a specific user
router.get  ('/support',          getAllThreads);
router.post ('/support/:userId',  replyToUser);

// ─── Super Admin Platform ─────────────────────────────────────────────────────
// All /api/admin/platform/* routes
router.use('/platform', platformRoutes);

module.exports = router;
