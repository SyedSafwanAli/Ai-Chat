'use strict';

const router = require('express').Router();
const {
  getPlatformStats,
  listBusinesses,
  createBusiness,
  approveBusiness,
  updateBusiness,
  getPlatformSupport,
  getThreadMessages,
  replyToSupport,
  getPackagePlans,
  createPackagePlan,
  updatePackagePlan,
  deletePackagePlan,
  getCreditTransactions,
  getAuditLogs,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getPlatformAnalytics,
} = require('../controllers/platform.controller');

// ── Stats ─────────────────────────────────────────────────────────────────────
// GET  /api/super-admin/stats
router.get('/stats', getPlatformStats);

// ── Businesses ────────────────────────────────────────────────────────────────
// GET   /api/super-admin/businesses
// POST  /api/super-admin/businesses           ← manual create
// PATCH /api/super-admin/businesses/:id/approve
// PATCH /api/super-admin/businesses/:id
router.get  ('/businesses',              listBusinesses);
router.post ('/businesses',              createBusiness);
router.patch('/businesses/:id/approve', approveBusiness);
router.patch('/businesses/:id',          updateBusiness);

// ── Package Plans ─────────────────────────────────────────────────────────────
// GET    /api/super-admin/packages
// POST   /api/super-admin/packages          ← create new plan
// PUT    /api/super-admin/packages/:name    ← edit existing plan
// DELETE /api/super-admin/packages/:name    ← delete plan
router.get   ('/packages',        getPackagePlans);
router.post  ('/packages',        createPackagePlan);
router.put   ('/packages/:name',  updatePackagePlan);
router.delete('/packages/:name',  deletePackagePlan);

// ── Credit Transactions ───────────────────────────────────────────────────────
// GET /api/super-admin/credit-transactions?page&limit&type
router.get('/credit-transactions', getCreditTransactions);

// ── Audit Logs ────────────────────────────────────────────────────────────────
// GET /api/super-admin/audit-logs?page&limit&search&from&to
router.get('/audit-logs', getAuditLogs);

// ── Announcements ─────────────────────────────────────────────────────────────
// GET    /api/super-admin/announcements
// POST   /api/super-admin/announcements
// DELETE /api/super-admin/announcements/:id
router.get   ('/announcements',      getAnnouncements);
router.post  ('/announcements',      createAnnouncement);
router.delete('/announcements/:id',  deleteAnnouncement);

// ── Analytics ─────────────────────────────────────────────────────────────────
// GET /api/super-admin/analytics
router.get('/analytics', getPlatformAnalytics);

// ── Support ───────────────────────────────────────────────────────────────────
// GET  /api/super-admin/support
// GET  /api/super-admin/support/:userId
// POST /api/super-admin/support/:userId
router.get ('/support',          getPlatformSupport);
router.get ('/support/:userId',  getThreadMessages);
router.post('/support/:userId',  replyToSupport);

module.exports = router;
