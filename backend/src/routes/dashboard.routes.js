'use strict';

const { Router } = require('express');
const { getStats } = require('../controllers/dashboard.controller');

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', getStats);

module.exports = router;
