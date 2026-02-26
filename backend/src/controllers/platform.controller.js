'use strict';

/**
 * Super Admin Platform Controller
 *
 * Privacy rules:
 *  - No customer conversations or messages are exposed
 *  - Only aggregate AI credit usage & business metadata
 *  - Support channel is exclusively super_admin ↔ business-owner (manager)
 *
 * Audit trail: every mutating action is logged to super_admin_logs.
 */

const { pool }       = require('../config/db');
const { send, fail } = require('../utils/response.util');

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function audit(adminId, action, targetBusinessId = null) {
  try {
    await pool.query(
      'INSERT INTO super_admin_logs (admin_id, action, target_business_id) VALUES (?, ?, ?)',
      [adminId, action, targetBusinessId || null]
    );
  } catch (err) {
    console.error('[platform:audit]', err.message);
  }
}

// ─── GET /api/super-admin/stats ───────────────────────────────────────────────

async function getPlatformStats(req, res, next) {
  try {
    const [[counts]] = await pool.query(
      `SELECT
         COUNT(*)  AS totalBusinesses,
         SUM(CASE WHEN b.status = 'active'
                   AND b.package != 'none'
                   AND (b.package_expiry IS NULL OR b.package_expiry > NOW())
              THEN 1 ELSE 0 END)                                    AS activeBusinesses,
         SUM(CASE WHEN b.status = 'pending'   THEN 1 ELSE 0 END)   AS pendingBusinesses,
         SUM(CASE WHEN b.status = 'suspended' THEN 1 ELSE 0 END)   AS suspendedBusinesses,
         COALESCE(SUM(b.credits_used),   0)                         AS totalCreditsUsed,
         COALESCE(SUM(b.credit_balance), 0)                         AS totalCreditsRemaining
       FROM businesses b`
    );

    return send(res, {
      totalBusinesses:       Number(counts.totalBusinesses),
      activeBusinesses:      Number(counts.activeBusinesses),
      pendingBusinesses:     Number(counts.pendingBusinesses),
      suspendedBusinesses:   Number(counts.suspendedBusinesses),
      totalCreditsUsed:      parseFloat(counts.totalCreditsUsed)      || 0,
      totalCreditsRemaining: parseFloat(counts.totalCreditsRemaining) || 0,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/super-admin/businesses ──────────────────────────────────────────

async function listBusinesses(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)    || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = req.query.status  || '';
    const pkg    = req.query.package || '';

    const conditions = [];
    const params     = [];

    if (search) {
      conditions.push('(b.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (['active','pending','suspended'].includes(status)) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (pkg && ['none','basic','pro','trial'].includes(pkg)) {
      conditions.push('b.package = ?');
      params.push(pkg);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM   businesses b
       LEFT JOIN users u ON u.business_id = b.id AND u.role = 'manager'
       ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT
         b.id,
         b.name           AS business_name,
         b.status,
         b.package,
         b.package_expiry,
         b.credits_used   AS total_credits_used,
         b.credit_balance AS credits_remaining,
         b.phone,
         b.category,
         b.city,
         b.plan_price,
         b.billing_cycle,
         b.created_at,
         u.id             AS user_id,
         u.email          AS owner_email,
         u.status         AS user_status
       FROM businesses b
       LEFT JOIN users u ON u.business_id = b.id AND u.role = 'manager'
       ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return send(res, {
      businesses: rows,
      pagination: {
        total:      Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/super-admin/businesses/:id/approve ───────────────────────────

/**
 * Full approval in one transaction:
 *   - business.status → active
 *   - business.package, package_expiry set
 *   - credit_balance += top_up_credits
 *   - user.status → active
 * Body: { package, package_expiry?, top_up_credits? }
 */
async function approveBusiness(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const bizId = parseInt(req.params.id, 10);
    const { package: pkg, package_expiry, top_up_credits } = req.body;

    if (!pkg || !['basic','pro','trial'].includes(pkg)) {
      return fail(res, 'A valid package (basic / pro / trial) is required for approval.', 400);
    }

    const [[biz]] = await conn.query(
      'SELECT id, name, credit_balance FROM businesses WHERE id = ? LIMIT 1', [bizId]
    );
    if (!biz) return fail(res, 'Business not found.', 404);

    await conn.beginTransaction();

    const credits = parseFloat(top_up_credits) || 0;
    const prevBal = parseFloat(biz.credit_balance) || 0;

    await conn.query(
      `UPDATE businesses
       SET status = 'active', package = ?, package_expiry = ?,
           credit_balance = credit_balance + ?
       WHERE id = ?`,
      [pkg, package_expiry || null, credits, bizId]
    );

    await conn.query(
      "UPDATE users SET status = 'active' WHERE business_id = ? AND role = 'manager'",
      [bizId]
    );

    await conn.commit();

    await audit(
      req.user.id,
      `APPROVED #${bizId} (${biz.name}) pkg=${pkg} expiry=${package_expiry || 'none'} credits+${credits.toFixed(2)} (${prevBal.toFixed(2)}→${(prevBal + credits).toFixed(2)})`,
      bizId
    );

    const [[updated]] = await pool.query(
      `SELECT b.id, b.name AS business_name, b.status, b.package, b.package_expiry,
              b.credits_used AS total_credits_used, b.credit_balance AS credits_remaining,
              b.phone, b.category, b.city, b.plan_price, b.billing_cycle,
              u.email AS owner_email, u.status AS user_status
       FROM businesses b
       LEFT JOIN users u ON u.business_id = b.id AND u.role = 'manager'
       WHERE b.id = ? LIMIT 1`,
      [bizId]
    );

    return send(res, { business: updated }, 'Business approved and activated.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// ─── PATCH /api/super-admin/businesses/:id ────────────────────────────────────

/**
 * General update: status / package / expiry / top-up / extra info fields.
 * Body (any combination): { status, package, package_expiry, top_up,
 *                            phone, category, city, plan_price, billing_cycle }
 */
async function updateBusiness(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const bizId = parseInt(req.params.id, 10);
    const {
      status, package: pkg, package_expiry, top_up,
      phone, category, city, plan_price, billing_cycle,
    } = req.body;

    const [[biz]] = await conn.query(
      'SELECT id, name, credit_balance FROM businesses WHERE id = ? LIMIT 1', [bizId]
    );
    if (!biz) return fail(res, 'Business not found.', 404);

    await conn.beginTransaction();

    const bizUpdates = [];
    const bizParams  = [];
    const auditParts = [];

    if (pkg && ['none','basic','pro','trial'].includes(pkg)) {
      bizUpdates.push('package = ?');
      bizParams.push(pkg);
      auditParts.push(`PACKAGE→${pkg}`);
    }
    if (package_expiry !== undefined) {
      bizUpdates.push('package_expiry = ?');
      bizParams.push(package_expiry || null);
      auditParts.push(`EXPIRY→${package_expiry || 'removed'}`);
    }
    if (top_up !== undefined) {
      const amount = parseFloat(top_up);
      if (isNaN(amount) || amount <= 0) return fail(res, 'top_up must be a positive number.', 400);
      const prev = parseFloat(biz.credit_balance) || 0;
      bizUpdates.push('credit_balance = credit_balance + ?');
      bizParams.push(amount);
      auditParts.push(`TOPUP+${amount.toFixed(2)} (${prev.toFixed(2)}→${(prev + amount).toFixed(2)})`);
    }
    if (phone     !== undefined) { bizUpdates.push('phone = ?');          bizParams.push(phone || null); }
    if (category  !== undefined) { bizUpdates.push('category = ?');       bizParams.push(category || null); }
    if (city      !== undefined) { bizUpdates.push('city = ?');           bizParams.push(city || null); }
    if (plan_price !== undefined) { bizUpdates.push('plan_price = ?');    bizParams.push(parseFloat(plan_price) || 0); }
    if (billing_cycle && ['monthly','yearly'].includes(billing_cycle)) {
      bizUpdates.push('billing_cycle = ?');
      bizParams.push(billing_cycle);
    }

    if (bizUpdates.length) {
      await conn.query(
        `UPDATE businesses SET ${bizUpdates.join(', ')} WHERE id = ?`,
        [...bizParams, bizId]
      );
    }

    // Status — keeps business.status and user.status in sync
    if (status === 'active') {
      await conn.query("UPDATE businesses SET status = 'active'    WHERE id = ?", [bizId]);
      await conn.query("UPDATE users SET status = 'active'         WHERE business_id = ? AND role = 'manager'", [bizId]);
      auditParts.push('STATUS→active');
    } else if (status === 'suspended') {
      await conn.query("UPDATE businesses SET status = 'suspended' WHERE id = ?", [bizId]);
      await conn.query("UPDATE users SET status = 'blocked'        WHERE business_id = ? AND role = 'manager'", [bizId]);
      auditParts.push('STATUS→suspended');
    } else if (status === 'pending') {
      await conn.query("UPDATE businesses SET status = 'pending'   WHERE id = ?", [bizId]);
      await conn.query("UPDATE users SET status = 'pending'        WHERE business_id = ? AND role = 'manager'", [bizId]);
      auditParts.push('STATUS→pending');
    }

    await conn.commit();

    if (auditParts.length) {
      await audit(req.user.id, `[${auditParts.join(' | ')}] on #${bizId} (${biz.name})`, bizId);
    }

    const [[updated]] = await pool.query(
      `SELECT b.id, b.name AS business_name, b.status, b.package, b.package_expiry,
              b.credits_used AS total_credits_used, b.credit_balance AS credits_remaining,
              b.phone, b.category, b.city, b.plan_price, b.billing_cycle,
              u.email AS owner_email, u.status AS user_status
       FROM businesses b
       LEFT JOIN users u ON u.business_id = b.id AND u.role = 'manager'
       WHERE b.id = ? LIMIT 1`,
      [bizId]
    );

    return send(res, { business: updated }, 'Business updated successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// ─── GET /api/super-admin/support ─────────────────────────────────────────────

async function getPlatformSupport(req, res, next) {
  try {
    const [threads] = await pool.query(
      `SELECT
         u.id            AS user_id,
         u.email,
         b.name          AS business_name,
         (SELECT message    FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT sender     FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_sender,
         (SELECT created_at FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*)   FROM support_messages
          WHERE  user_id = u.id AND sender = 'user'
          AND    created_at > COALESCE(
            (SELECT MAX(created_at) FROM support_messages WHERE user_id = u.id AND sender = 'admin'),
            '1970-01-01 00:00:00'
          )) AS unread_count
       FROM users u
       JOIN businesses b ON b.id = u.business_id
       WHERE u.role = 'manager'
         AND EXISTS (SELECT 1 FROM support_messages WHERE user_id = u.id)
       ORDER BY last_message_at DESC`
    );

    return send(res, { threads });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/super-admin/support/:userId ─────────────────────────────────────

async function getThreadMessages(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);

    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'manager' LIMIT 1", [userId]
    );
    if (!userRows.length) return fail(res, 'User not found.', 404);

    const [messages] = await pool.query(
      `SELECT id, user_id, message, sender, created_at
       FROM   support_messages
       WHERE  user_id = ?
       ORDER  BY created_at ASC`,
      [userId]
    );

    return send(res, { messages });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/super-admin/support/:userId ────────────────────────────────────

async function replyToSupport(req, res, next) {
  try {
    const userId  = parseInt(req.params.userId, 10);
    const message = (req.body.message || '').trim();

    if (!message) return fail(res, 'Message is required.', 400);

    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!userRows.length) return fail(res, 'User not found.', 404);

    const [result] = await pool.query(
      "INSERT INTO support_messages (user_id, message, sender) VALUES (?, ?, 'admin')",
      [userId, message]
    );

    return send(res, {
      id: result.insertId, user_id: userId,
      message, sender: 'admin',
      created_at: new Date().toISOString(),
    }, 'Reply sent.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPlatformStats,
  listBusinesses,
  approveBusiness,
  updateBusiness,
  getPlatformSupport,
  getThreadMessages,
  replyToSupport,
};
