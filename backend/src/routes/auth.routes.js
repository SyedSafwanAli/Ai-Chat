'use strict';

const router = require('express').Router();
const { signup, login, me, logout, changePassword } = require('../controllers/auth.controller');
const { authenticate }              = require('../middleware/authMiddleware');

// POST /api/auth/signup — public
router.post('/signup', signup);

// POST /api/auth/login  — public
router.post('/login', login);

// GET  /api/auth/me     — protected
router.get('/me', authenticate, me);

// POST /api/auth/logout — protected (stateless, just confirms)
router.post('/logout', authenticate, logout);

// PUT /api/auth/password — change own password (protected)
router.put('/password', authenticate, changePassword);

module.exports = router;
