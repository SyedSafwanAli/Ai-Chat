'use strict';

const jwt    = require('jsonwebtoken');
const { fail } = require('../utils/response.util');

/**
 * Express middleware — verifies JWT in Authorization: Bearer <token> header.
 * On success, attaches decoded payload to req.user and calls next().
 * On failure, responds with 401.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 'Authentication required. Please log in.', 401);
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 'Session expired. Please log in again.', 401);
    }
    return fail(res, 'Invalid token. Please log in again.', 401);
  }
}

/**
 * Express middleware — allows ONLY super_admin role.
 * Must be placed AFTER authenticate.
 */
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return fail(res, 'Super Admin access required.', 403);
  }
  next();
}

/**
 * Express middleware — allows admin OR super_admin (backward compat).
 * Must be placed AFTER authenticate.
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return fail(res, 'Admin access required.', 403);
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireSuperAdmin };
