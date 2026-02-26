'use strict';

const router = require('express').Router();
const { getMyMessages, sendMessage } = require('../controllers/support.controller');

// GET  /api/support      — fetch own thread
// POST /api/support      — send message to admin
router.get ('/', getMyMessages);
router.post('/', sendMessage);

module.exports = router;
