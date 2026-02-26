'use strict';

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const authRoutes         = require('./routes/auth.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');
const conversationRoutes = require('./routes/conversation.routes');
const settingsRoutes     = require('./routes/settings.routes');
const webhookRoutes      = require('./routes/webhook.routes');
const supportRoutes      = require('./routes/support.routes');
const adminRoutes        = require('./routes/admin.routes');
const superAdminRoutes   = require('./routes/super-admin.routes');
const { listLeads }      = require('./controllers/conversation.controller');

const { authenticate, requireAdmin, requireSuperAdmin } = require('./middleware/authMiddleware');
const checkPackageAccess = require('./middleware/checkPackageAccess');
const errorHandler       = require('./middleware/errorHandler');
const logger             = require('./utils/logger.util');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials:  true,
}));

// ─── Request logging ──────────────────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting (simple in-memory, no extra packages needed) ───────────────
const rateLimitStore = new Map();

function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count   = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

// Login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  'Too many login attempts. Please wait 15 minutes and try again.',
});

// Webhook: max 200 requests per minute per IP (WhatsApp can burst)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      200,
  message:  'Too many webhook requests.',
});

// ─── Health check (public) ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    uptime:    `${Math.floor(process.uptime())}s`,
    env:       process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── Public routes ────────────────────────────────────────────────────────────
app.use('/api/auth/login',  loginLimiter);
app.use('/api/auth',        authRoutes);

app.use('/api/webhook/whatsapp', webhookLimiter);
app.use('/api/webhook',          webhookRoutes);

// ─── Support (JWT required, no package check) ─────────────────────────────────
app.use('/api/support', authenticate, supportRoutes);

// ─── Super Admin routes (JWT + super_admin role) ──────────────────────────────
app.use('/api/super-admin', authenticate, requireSuperAdmin, superAdminRoutes);

// ─── Legacy admin routes (JWT + admin OR super_admin role) ────────────────────
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// ─── Protected business routes (JWT + active package required) ────────────────
app.use('/api/dashboard',     authenticate, checkPackageAccess, dashboardRoutes);
app.use('/api/conversations', authenticate, checkPackageAccess, conversationRoutes);
app.get('/api/leads',         authenticate, checkPackageAccess, listLeads);
app.use('/api',               authenticate, checkPackageAccess, settingsRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
