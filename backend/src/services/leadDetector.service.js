'use strict';

/**
 * ─── Lead Detector Service ────────────────────────────────────────────────────
 *
 * Classifies incoming messages into lead statuses:
 *   hot  → strong purchase / booking intent
 *   warm → research / enquiry intent
 *   cold → general / non-commercial message
 *
 * Status hierarchy: hot > warm > cold
 * Status is NEVER downgraded within a conversation.
 */

const KeywordModel = require('../models/keyword.model');

// ─── Static keyword lists (hardcoded defaults) ────────────────────────────────

const HOT_KEYWORDS = [
  // Booking / appointment intent
  'book', 'booking', 'appointment', 'reserve', 'reservation', 'schedule',
  'can i come', 'want to visit', 'want to book', 'i want to', 'i need',
  'i\'d like to', 'i would like',
  // Purchase / budget signals
  'budget', 'visit', 'interested', 'when can i', 'how do i book',
  'bridal', 'wedding', 'special occasion', 'event',
  // Arabic signals
  'حجز', 'موعد', 'أريد', 'ابي',
];

const WARM_KEYWORDS = [
  // Research / comparison signals
  'price', 'cost', 'how much', 'pricing', 'rate', 'charges',
  'services', 'what do you offer', 'packages', 'treatments',
  'hours', 'open', 'location', 'where are you', 'address',
  'do you have', 'can you do', 'do you do', 'do you offer',
  'available', 'tell me more', 'more info', 'details',
  // Arabic signals
  'سعر', 'كم', 'خدمات',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Numeric rank so we can compare without strings. */
const RANK = { hot: 3, warm: 2, cold: 1 };

function rankOf(status) {
  return RANK[status] ?? 1;
}

/**
 * Determine lead status purely from message text and custom DB keywords.
 *
 * @param {string}   message          Raw customer message
 * @param {string[]} customKeywords   Keywords from lead_keywords table
 * @returns {'hot'|'warm'|'cold'}
 */
function classifyMessage(message, customKeywords = []) {
  const lower = message.toLowerCase();

  // Check custom keywords first (business-defined hot signals)
  const customHit = customKeywords.some((kw) => lower.includes(kw.toLowerCase()));
  if (customHit) return 'hot';

  // Check static hot keywords
  const isHot = HOT_KEYWORDS.some((kw) => lower.includes(kw));
  if (isHot) return 'hot';

  // Check static warm keywords
  const isWarm = WARM_KEYWORDS.some((kw) => lower.includes(kw));
  if (isWarm) return 'warm';

  return 'cold';
}

/**
 * Escalate lead status — never downgrade an existing conversation.
 *
 * @param {string} currentStatus   Existing lead_status in DB
 * @param {string} detectedStatus  Newly detected status
 * @returns {string} The resolved status (highest of the two)
 */
function escalateStatus(currentStatus, detectedStatus) {
  return rankOf(detectedStatus) > rankOf(currentStatus)
    ? detectedStatus
    : currentStatus;
}

/**
 * Main entry point.
 * Loads custom keywords from DB, classifies the message, and returns
 * the escalated lead status.
 *
 * @param {string} message          Customer message text
 * @param {number} businessId       Business ID
 * @param {string} currentStatus    Existing lead_status for the conversation
 * @returns {Promise<{ status: string, changed: boolean }>}
 */
async function detectLeadStatus(message, businessId, currentStatus = 'cold') {
  const customKeywords = await KeywordModel.findAllStrings(businessId);
  const detected       = classifyMessage(message, customKeywords);
  const resolved       = escalateStatus(currentStatus, detected);
  const changed        = resolved !== currentStatus;

  return { status: resolved, changed, detected };
}

module.exports = { detectLeadStatus, classifyMessage, escalateStatus };
