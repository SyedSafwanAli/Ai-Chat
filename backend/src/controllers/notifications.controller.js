'use strict';

const { pool } = require('../config/db');
const { send } = require('../utils/response.util');

/**
 * GET /api/notifications
 * Role-aware notification counts:
 *  - super_admin : pending businesses + unread support threads
 *  - business user: uncontacted hot leads + unread admin replies in support
 */
async function getNotifications(req, res, next) {
  try {
    const items = [];
    let total = 0;

    if (req.user.role === 'super_admin') {
      // Pending businesses awaiting approval
      const [[{ pending }]] = await pool.query(
        "SELECT COUNT(*) AS pending FROM businesses WHERE status = 'pending'"
      );

      // Unread support threads = threads where last message is from 'user' (admin hasn't replied yet)
      const [[{ unread_threads }]] = await pool.query(
        `SELECT COUNT(*) AS unread_threads
         FROM (
           SELECT sender
           FROM support_messages
           WHERE id IN (SELECT MAX(id) FROM support_messages GROUP BY user_id)
         ) latest
         WHERE sender = 'user'`
      );

      const p = Number(pending);
      const u = Number(unread_threads);

      if (p > 0) {
        items.push({
          type:  'pending_businesses',
          count: p,
          label: `${p} business${p > 1 ? 'es' : ''} awaiting approval`,
          href:  '/platform/businesses',
        });
      }
      if (u > 0) {
        items.push({
          type:  'unread_support',
          count: u,
          label: `${u} unanswered support thread${u > 1 ? 's' : ''}`,
          href:  '/platform/support',
        });
      }
      total = p + u;

    } else {
      // Business user
      const bizId = req.user.business_id;
      const userId = req.user.id;

      // Uncontacted hot leads
      const [[{ hot_leads }]] = await pool.query(
        `SELECT COUNT(*) AS hot_leads
         FROM conversations
         WHERE business_id = ? AND lead_status = 'hot' AND contacted = 0`,
        [bizId]
      );

      // Admin replies in support that arrived after user's last message
      const [[{ unread_support }]] = await pool.query(
        `SELECT COUNT(*) AS unread_support
         FROM support_messages
         WHERE user_id = ? AND sender = 'admin'
           AND created_at > COALESCE(
             (SELECT MAX(created_at) FROM support_messages sm2
              WHERE sm2.user_id = ? AND sm2.sender = 'user'),
             '1970-01-01'
           )`,
        [userId, userId]
      );

      const h = Number(hot_leads);
      const s = Number(unread_support);

      if (h > 0) {
        items.push({
          type:  'hot_leads',
          count: h,
          label: `${h} uncontacted hot lead${h > 1 ? 's' : ''}`,
          href:  '/leads',
        });
      }
      if (s > 0) {
        items.push({
          type:  'unread_support',
          count: s,
          label: `${s} new admin repl${s > 1 ? 'ies' : 'y'} in support`,
          href:  '/support',
        });
      }
      total = h + s;
    }

    return send(res, { items, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications };
