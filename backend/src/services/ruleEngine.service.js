'use strict';

/**
 * ─── Rule Engine ─────────────────────────────────────────────────────────────
 *
 * Pure rule-based response system — no AI API required.
 *
 * Processing order (by priority):
 *   1. Greeting detection
 *   2. Pricing enquiry
 *   3. Working hours enquiry
 *   4. Location / address enquiry
 *   5. Booking / appointment request
 *   6. Services list request
 *   7. FAQ keyword matching (word-overlap scoring)
 *   8. Fallback
 */

const ServiceModel      = require('../models/service.model');
const FAQModel          = require('../models/faq.model');
const BusinessModel     = require('../models/business.model');

// ─── Keyword maps ─────────────────────────────────────────────────────────────

const RULES = [
  {
    name: 'greeting',
    priority: 1,
    keywords: [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'howdy', 'greetings', 'السلام', 'مرحبا', 'اهلا', 'صباح', 'مساء',
    ],
  },
  {
    name: 'pricing',
    priority: 2,
    keywords: [
      'price', 'cost', 'how much', 'pricing', 'rate', 'charges', 'fee',
      'expensive', 'affordable', 'cheap', 'what does it cost', 'rates',
      'كم', 'سعر', 'تكلفة',
    ],
  },
  {
    name: 'hours',
    priority: 3,
    keywords: [
      'hours', 'open', 'close', 'closing', 'working hours', 'what time',
      'when do you', 'available', 'timing', 'schedule', 'are you open',
      'مواعيد', 'وقت', 'دوام',
    ],
  },
  {
    name: 'location',
    priority: 4,
    keywords: [
      'address', 'location', 'where', 'directions', 'find you', 'located',
      'place', 'map', 'how to get', 'عنوان', 'موقع', 'وين', 'فين',
    ],
  },
  {
    name: 'booking',
    priority: 5,
    keywords: [
      'book', 'appointment', 'reserve', 'reservation', 'booking', 'slot',
      'schedule me', 'can i come', 'want to visit', 'حجز', 'موعد',
    ],
  },
  {
    name: 'services',
    priority: 6,
    keywords: [
      'services', 'what do you offer', 'menu', 'packages', 'treatments',
      'what do you do', 'list', 'options', 'خدمات', 'عروض', 'باقات',
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function matchesRule(message, keywords) {
  return keywords.some((kw) => message.includes(kw));
}

function fmtTime(t) {
  if (!t) return '?';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Handler functions ────────────────────────────────────────────────────────

async function handleGreeting(business) {
  const greets = [
    `Hello! 👋 Welcome to *${business.name}*! How can we help you today?`,
    `Hi there! 😊 Thanks for reaching out to *${business.name}*. What can we assist you with?`,
    `Hey! 🌟 Great to hear from you! How can *${business.name}* help you today?`,
  ];
  return greets[Math.floor(Math.random() * greets.length)];
}

async function handlePricing(businessId, business) {
  const services = await ServiceModel.findActive(businessId);

  if (!services.length) {
    return `Please contact us directly at *${business.phone}* for pricing information.`;
  }

  const list = services
    .map((s) => `• *${s.name}* — ${s.price} _(${s.duration})_`)
    .join('\n');

  return (
    `Here are our current prices:\n\n${list}\n\n` +
    `💬 Would you like to book any of these? Reply with *"book"* and let us know your preferred date! 📅`
  );
}

async function handleHours(business) {
  const wh = business.working_hours || {};
  const ms = wh.monday_saturday || {};
  const sun = wh.sunday || {};

  return (
    `*${business.name}* Working Hours:\n\n` +
    `📅 *Monday – Saturday:* ${fmtTime(ms.open)} – ${fmtTime(ms.close)}\n` +
    `📅 *Sunday:* ${fmtTime(sun.open)} – ${fmtTime(sun.close)}\n\n` +
    `We look forward to seeing you! ✨`
  );
}

async function handleLocation(business) {
  return (
    `📍 You can find *${business.name}* at:\n\n` +
    `${business.address}\n\n` +
    `📞 Call us: *${business.phone}*\n` +
    (business.website ? `🌐 Website: ${business.website}\n\n` : '\n') +
    `Need directions? Let us know and we'll help guide you! 🗺️`
  );
}

async function handleBooking(business) {
  return (
    `We'd love to schedule an appointment for you! 📅\n\n` +
    `To confirm your booking, please tell us:\n` +
    `1️⃣ Which service you need\n` +
    `2️⃣ Your preferred *date and time*\n` +
    `3️⃣ Your *name*\n\n` +
    `Or call us directly at *${business.phone}* during working hours.\n` +
    `We'll confirm your appointment within 30 minutes! ✅`
  );
}

async function handleServices(businessId, business) {
  const services = await ServiceModel.findActive(businessId);

  if (!services.length) {
    return `Please contact us at *${business.phone}* to learn about our services.`;
  }

  const list = services
    .map((s) => `✨ *${s.name}* — ${s.price} | ${s.duration}`)
    .join('\n');

  return (
    `Here's what we offer at *${business.name}*:\n\n${list}\n\n` +
    `Reply with *"price"* for details or *"book"* to make an appointment! 💫`
  );
}

/**
 * FAQ matching — scores each FAQ by the number of message words
 * that appear in the question. Returns the answer of the best match
 * if the score meets the threshold.
 */
async function matchFAQ(message, businessId) {
  const faqs = await FAQModel.findAll(businessId);

  let bestMatch = null;
  let bestScore = 0;
  const THRESHOLD = 2; // at least 2 significant words must overlap

  const msgWords = message
    .split(/\s+/)
    .filter((w) => w.length > 3);

  for (const faq of faqs) {
    const questionWords = faq.question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const score = msgWords.filter((w) => questionWords.includes(w)).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore >= THRESHOLD ? bestMatch.answer : null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Process an incoming customer message and return a rule-based reply.
 *
 * @param {string} message    - Raw customer message text
 * @param {number} businessId - Business ID (single-business: always 1)
 * @returns {{ reply: string, type: 'rule'|'fallback', ruleName: string }}
 */
async function processMessage(message, businessId) {
  const lower = message.toLowerCase().trim();

  // Load business once (used by multiple handlers)
  const business = await BusinessModel.findById(businessId);

  // Walk rules in priority order
  const sorted = [...RULES].sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (!matchesRule(lower, rule.keywords)) continue;

    let reply;
    switch (rule.name) {
      case 'greeting': reply = await handleGreeting(business);               break;
      case 'pricing':  reply = await handlePricing(businessId, business);    break;
      case 'hours':    reply = await handleHours(business);                  break;
      case 'location': reply = await handleLocation(business);               break;
      case 'booking':  reply = await handleBooking(business);                break;
      case 'services': reply = await handleServices(businessId, business);   break;
      default:         reply = null;
    }

    if (reply) {
      return { reply, type: 'rule', ruleName: rule.name };
    }
  }

  // FAQ matching
  const faqAnswer = await matchFAQ(lower, businessId);
  if (faqAnswer) {
    return { reply: faqAnswer, type: 'rule', ruleName: 'faq' };
  }

  // Fallback
  const fallback =
    `Thank you for contacting *${business?.name || 'us'}*! 🙏\n\n` +
    `Our team will get back to you shortly.\n` +
    `For immediate assistance, please call *${business?.phone || 'us'}* during working hours.`;

  return { reply: fallback, type: 'fallback', ruleName: 'fallback' };
}

module.exports = { processMessage };
