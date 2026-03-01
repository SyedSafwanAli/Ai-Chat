'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/authMiddleware');
const { createPayment, paymentWebhook, getBillingInfo } = require('../controllers/payments.controller');

// ── Public (called by Easypaisa server, no JWT) ────────────────────────────────
// POST /api/payments/webhook
router.post('/webhook', paymentWebhook);

// ── Authenticated (no package check — user may be upgrading from no package) ──
// GET  /api/payments/billing-info
// POST /api/payments/create
router.get ('/billing-info', authenticate, getBillingInfo);
router.post('/create',       authenticate, createPayment);

module.exports = router;
