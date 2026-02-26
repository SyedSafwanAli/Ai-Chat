'use strict';

const logger = require('../utils/logger.util');

/**
 * Central error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    logger.error(`[Error] ${req.method} ${req.originalUrl}`, err.stack || err.message);
  } else {
    logger.error(`[Error] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  // ── MySQL error codes ──────────────────────────────────────────────────────
  // Duplicate entry (e.g. unique email or unique keyword)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry — this record already exists.',
    });
  }

  // Foreign key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference — related record does not exist.',
    });
  }

  // ── JWT / Auth errors ──────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // ── JSON parse error (malformed body) ─────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
    });
  }

  const status  = err.status || err.statusCode || 500;
  const message = status < 500
    ? err.message
    : 'An internal server error occurred. Please try again.';

  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
