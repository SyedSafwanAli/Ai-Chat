'use strict';

/**
 * Uniform JSON response helpers.
 * Every API response follows the same envelope:
 *
 *  success: true
 *  {
 *    success:   true,
 *    message:   "Success",
 *    data:      { ... },
 *    timestamp: "2024-02-21T10:30:00.000Z"
 *  }
 *
 *  success: false
 *  {
 *    success:   false,
 *    message:   "Not found",
 *    errors:    null | [...],
 *    timestamp: "..."
 *  }
 */

function send(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success:   true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function fail(res, message = 'An error occurred', statusCode = 400, errors = null) {
  return res.status(statusCode).json({
    success:   false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { send, fail };
