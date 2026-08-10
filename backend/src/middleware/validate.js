const validator = require('validator');

/**
 * Sanitize a string — strip HTML, trim whitespace
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, '');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email);
}

/**
 * Validate password strength — min 8 chars, at least one uppercase, one lowercase, one digit
 */
function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Sanitize an object's string fields recursively
 */
function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') clean[key] = sanitize(val);
    else if (Array.isArray(val)) clean[key] = val.map(v => typeof v === 'string' ? sanitize(v) : v);
    else clean[key] = val;
  }
  return clean;
}

/**
 * Middleware: sanitize all string fields in req.body
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body);
  }
  next();
};

/**
 * Validate pagination params
 */
function safePagination(page, limit, maxLimit = 100) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  return { page: p, limit: l };
}

/**
 * Validate MongoDB ObjectId
 */
function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

module.exports = { sanitize, isValidEmail, isStrongPassword, sanitizeBody, sanitizeRequest, safePagination, isValidObjectId };
