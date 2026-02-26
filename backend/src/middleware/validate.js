'use strict';

/**
 * Lightweight request validation middleware factory.
 * Usage:  router.post('/path', validate(['field1','field2']), handler)
 *
 * @param {string[]} requiredFields - Body fields that must be present and non-empty
 */
function validate(requiredFields = []) {
  return (req, res, next) => {
    const missing = requiredFields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
        missing,
      });
    }

    next();
  };
}

module.exports = { validate };
