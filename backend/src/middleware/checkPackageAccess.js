'use strict';

const { pool }  = require('../config/db');
const { fail }  = require('../utils/response.util');

/**
 * Enforces that the authenticated user's business has an active package.
 *
 * Bypass: super_admin and admin roles are always allowed.
 *
 * Blocks with 403 when:
 *   - user.status !== 'active'           (pending signup or suspended account)
 *   - business.status !== 'active'       (business not approved yet)
 *   - business.package === 'none'        (no package assigned)
 *   - package_expiry < NOW()             (subscription expired)
 *
 * Must be placed AFTER authenticate middleware.
 */
async function checkPackageAccess(req, res, next) {
  try {
    // super_admin and admin bypass all package checks
    if (req.user.role === 'super_admin' || req.user.role === 'admin') return next();

    // Query fresh status from DB (avoids stale JWT data)
    const [rows] = await pool.query(
      `SELECT u.status          AS user_status,
              b.status          AS business_status,
              b.package,
              b.package_expiry
       FROM   users u
       JOIN   businesses b ON b.id = u.business_id
       WHERE  u.id = ?
       LIMIT  1`,
      [req.user.id]
    );

    if (!rows.length) {
      return fail(res, 'Account not found.', 403);
    }

    const { user_status, business_status, package: pkg, package_expiry } = rows[0];

    if (user_status !== 'active') {
      return fail(
        res,
        'Your account is pending activation. Please contact support to get started.',
        403
      );
    }

    if (business_status !== 'active') {
      return fail(
        res,
        'Your business account is not active. Please contact support.',
        403
      );
    }

    if (pkg === 'none') {
      return fail(
        res,
        'No active package found. Please contact support to activate your subscription.',
        403
      );
    }

    if (package_expiry && new Date(package_expiry) < new Date()) {
      return fail(
        res,
        'Your subscription has expired. Please contact support to renew.',
        403
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkPackageAccess;
