'use strict';

/**
 * Package plan configuration.
 * Prices are in PKR (Pakistani Rupees).
 * Credits are added to credit_balance on successful payment.
 * durationDays: how many days the package is valid for.
 */
module.exports = {
  basic: {
    name:         'Basic',
    price:        4999,       // PKR
    credits:      2000,
    durationDays: 30,
    features: [
      '2,000 AI credits / month',
      'WhatsApp bot integration',
      'Lead detection & tracking',
      'FAQs, Services & Keywords',
      'Quick Replies & Reports',
      'Email support',
    ],
  },
  pro: {
    name:         'Pro',
    price:        9999,       // PKR
    credits:      5000,
    durationDays: 30,
    features: [
      '5,000 AI credits / month',
      'Everything in Basic',
      'Priority support',
      'Advanced analytics',
      'Bot Overview dashboard',
      'Dedicated account manager',
    ],
  },
};
