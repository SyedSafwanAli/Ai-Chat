'use strict';

const { pool }       = require('../config/db');
const { send, fail } = require('../utils/response.util');
const { getAllThreads, replyToUser } = require('./support.controller');

// ─── Business / User management ───────────────────────────────────────────────

/**
 * GET /api/admin/businesses/pending
 * Lists all businesses whose manager account is still pending activation.
 */
async function listPending(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT b.id AS business_id, b.name AS business_name,
              b.package, b.package_expiry, b.created_at AS registered_at,
              u.id AS user_id, u.email, u.status AS user_status
       FROM   businesses b
       JOIN   users u ON u.business_id = b.id AND u.role = 'manager'
       WHERE  u.status = 'pending'
       ORDER  BY b.created_at DESC`
    );
    return send(res, { businesses: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/businesses/:id/activate
 * Body: { package } — 'basic' | 'pro' | 'trial'  (defaults to 'basic')
 *
 * Sets business package + 30-day expiry, and activates all manager users
 * linked to that business.
 */
async function activate(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const bizId  = parseInt(req.params.id, 10);
    const pkg    = ['basic', 'pro', 'trial'].includes(req.body.package)
      ? req.body.package
      : 'basic';

    // Verify business exists
    const [biz] = await conn.query(
      'SELECT id FROM businesses WHERE id = ? LIMIT 1',
      [bizId]
    );
    if (!biz.length) {
      return fail(res, 'Business not found.', 404);
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE businesses
       SET    package = ?, package_expiry = DATE_ADD(NOW(), INTERVAL 30 DAY)
       WHERE  id = ?`,
      [pkg, bizId]
    );

    await conn.query(
      `UPDATE users
       SET    status = 'active'
       WHERE  business_id = ? AND role = 'manager'`,
      [bizId]
    );

    await conn.commit();

    return send(res, { business_id: bizId, package: pkg }, 'Business activated successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/**
 * PATCH /api/admin/businesses/:id/suspend
 * Sets package='none' and blocks all manager users for that business.
 */
async function suspend(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const bizId = parseInt(req.params.id, 10);

    const [biz] = await conn.query(
      'SELECT id FROM businesses WHERE id = ? LIMIT 1',
      [bizId]
    );
    if (!biz.length) {
      return fail(res, 'Business not found.', 404);
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE businesses
       SET    package = 'none', package_expiry = NULL
       WHERE  id = ?`,
      [bizId]
    );

    await conn.query(
      `UPDATE users
       SET    status = 'blocked'
       WHERE  business_id = ? AND role = 'manager'`,
      [bizId]
    );

    await conn.commit();

    return send(res, { business_id: bizId }, 'Business suspended successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// Re-export support handlers for the admin router
module.exports = { listPending, activate, suspend, getAllThreads, replyToUser };
