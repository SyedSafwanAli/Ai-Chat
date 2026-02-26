'use strict';

const { Router } = require('express');
const {
  verifyWebhook,
  handleIncomingMessage,
} = require('../controllers/webhook.controller');

const router = Router();

/**
 * GET /api/webhook/whatsapp
 * WhatsApp Cloud API sends a GET to verify the endpoint.
 * Query params: hub.mode, hub.verify_token, hub.challenge
 */
router.get('/whatsapp', verifyWebhook);

/**
 * POST /api/webhook/whatsapp
 * Receives incoming messages from WhatsApp Cloud API.
 *
 * Also accepts simplified test payload:
 *   { "from": "+966501234567", "name": "Test User", "message": "Hello" }
 */
router.post('/whatsapp', handleIncomingMessage);

module.exports = router;
