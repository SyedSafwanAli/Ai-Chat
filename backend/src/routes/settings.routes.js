'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/settings.controller');

const router = Router();

// ─── Business settings ────────────────────────────────────────────────────────
// GET  /api/settings/business
// PUT  /api/settings/business
router.get ('/settings/business',  ctrl.getBusiness);
router.put ('/settings/business',  ctrl.updateBusiness);

// ─── Services ─────────────────────────────────────────────────────────────────
// GET    /api/services
// POST   /api/services
// PUT    /api/services/:id
// DELETE /api/services/:id
router.get   ('/services',      ctrl.listServices);
router.post  ('/services',      ctrl.createService);
router.put   ('/services/:id',  ctrl.updateService);
router.delete('/services/:id',  ctrl.deleteService);

// ─── FAQs ─────────────────────────────────────────────────────────────────────
// GET    /api/faqs
// POST   /api/faqs
// PUT    /api/faqs/:id
// DELETE /api/faqs/:id
router.get   ('/faqs',      ctrl.listFAQs);
router.post  ('/faqs',      ctrl.createFAQ);
router.put   ('/faqs/:id',  ctrl.updateFAQ);
router.delete('/faqs/:id',  ctrl.deleteFAQ);

// ─── Lead Keywords ────────────────────────────────────────────────────────────
// GET    /api/keywords
// POST   /api/keywords
// DELETE /api/keywords/:id
router.get   ('/keywords',      ctrl.listKeywords);
router.post  ('/keywords',      ctrl.createKeyword);
router.delete('/keywords/:id',  ctrl.deleteKeyword);

// ─── WhatsApp Connection ───────────────────────────────────────────────────────
// GET    /api/whatsapp        — get connection status
// PUT    /api/whatsapp        — save phone_number_id + token
// DELETE /api/whatsapp        — disconnect
router.get   ('/whatsapp', ctrl.getWhatsApp);
router.put   ('/whatsapp', ctrl.updateWhatsApp);
router.delete('/whatsapp', ctrl.disconnectWhatsApp);

module.exports = router;
