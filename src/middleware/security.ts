const rateLimit = require('express-rate-limit');

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
};

const requestSanitizer = (req, res, next) => {
  const sanitize = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(/\0/g, '').trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (value && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        if (key.startsWith('$') || key.startsWith('__')) return;
        sanitized[key] = sanitize(child);
      });
      return sanitized;
    }
    return value;
  };

  if (req.body) req.body = sanitize(req.body) as typeof req.body;
  if (req.query) req.query = sanitize(req.query) as typeof req.query;
  if (req.params) req.params = sanitize(req.params) as typeof req.params;
  next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const tokenFromHeader = req.get('X-CSRF-Token');
  const tokenFromCookie = req.cookies?.['csrf-token'];
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ success: false, message: 'CSRF token missing or invalid' });
  }

  next();
};

module.exports = {
  securityHeaders,
  requestSanitizer,
  authLimiter,
  generalLimiter,
  csrfProtection,
};

export {};
