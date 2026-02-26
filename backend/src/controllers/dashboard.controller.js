'use strict';

const { pool }       = require('../config/db');
const MessageModel   = require('../models/message.model');
const { send }       = require('../utils/response.util');

/**
 * GET /api/dashboard/stats
 */
async function getStats(req, res, next) {
  try {
    const businessId = req.user.business_id;

    // ── 1. Total message count ───────────────────────────────────────────────
    const [msgCount] = await pool.query(
      `SELECT COUNT(m.id) AS total
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
        WHERE c.business_id = ?`,
      [businessId]
    );
    const totalMessages = Number(msgCount[0]?.total ?? 0);

    // ── 2. Lead / conversation counts (MySQL CASE instead of FILTER) ─────────
    const [leadRows] = await pool.query(
      `SELECT
          COUNT(*)                                                     AS total_conversations,
          SUM(CASE WHEN lead_status = 'hot'  THEN 1 ELSE 0 END)       AS hot_leads,
          SUM(CASE WHEN lead_status = 'warm' THEN 1 ELSE 0 END)       AS warm_leads,
          SUM(CASE WHEN lead_status = 'cold' THEN 1 ELSE 0 END)       AS cold_leads
         FROM conversations
        WHERE business_id = ?`,
      [businessId]
    );
    const {
      total_conversations,
      hot_leads,
      warm_leads,
      cold_leads,
    } = leadRows[0] ?? {};

    const totalLeads     = Number(hot_leads ?? 0) + Number(warm_leads ?? 0);
    const conversionRate = Number(total_conversations) > 0
      ? +((totalLeads / Number(total_conversations)) * 100).toFixed(1)
      : 0;

    // ── 3. Rule-based vs fallback split ──────────────────────────────────────
    const typeRows = await MessageModel.typeSummary(businessId);
    const ruleCount     = Number(typeRows.find((r) => r.response_type === 'rule')?.count     ?? 0);
    const fallbackCount = Number(typeRows.find((r) => r.response_type === 'fallback')?.count ?? 0);
    const botTotal      = ruleCount + fallbackCount || 1;
    const ruleBasedPct  = +((ruleCount     / botTotal) * 100).toFixed(1);
    const aiFallbackPct = +((fallbackCount / botTotal) * 100).toFixed(1);

    // ── 4. Messages per day — last 7 days ─────────────────────────────────────
    const messagesPerDay = await MessageModel.perDayForBusiness(businessId, 7);

    // ── 5. Leads per day — last 7 days ───────────────────────────────────────
    const [leadsPerDay] = await pool.query(
      `SELECT
          DATE_FORMAT(created_at, '%b %e') AS date,
          COUNT(*)                          AS leads
         FROM conversations
        WHERE business_id = ?
          AND lead_status IN ('hot','warm')
          AND created_at >= NOW() - INTERVAL 7 DAY
        GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%b %e')
        ORDER BY DATE(created_at) ASC`,
      [businessId]
    );

    return send(res, {
      totalMessages,
      totalConversations: Number(total_conversations ?? 0),
      totalLeads,
      hotLeads:  Number(hot_leads  ?? 0),
      warmLeads: Number(warm_leads ?? 0),
      coldLeads: Number(cold_leads ?? 0),
      conversionRate,
      ruleBasedPct,
      aiFallbackPct,
      aiUsagePct: 0,
      messagesPerDay,
      leadsPerDay,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
