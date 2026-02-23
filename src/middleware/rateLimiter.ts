/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and API abuse
 * 
 * To use this middleware, install the required package:
 * npm install express-rate-limit
 * 
 * Then uncomment this file and apply to routes in app.ts
 */

// const rateLimit = require('express-rate-limit');

// // General API rate limiter
// const apiLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// // Strict rate limiter for authentication endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again after 15 minutes.',
//   },
//   skipSuccessfulRequests: true, // Don't count successful requests
// });

// // Moderate rate limiter for password reset
// const passwordResetLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 3, // Limit each IP to 3 requests per hour
//   message: {
//     error: 'Too many password reset attempts, please try again after 1 hour.',
//   },
// });

// module.exports = {
//   apiLimiter,
//   authLimiter,
//   passwordResetLimiter,
// };

/**
 * USAGE in app.ts:
 * 
 * const { apiLimiter, authLimiter, passwordResetLimiter } = require('./middleware/rateLimiter');
 * 
 * // Apply to all API routes
 * app.use('/api/', apiLimiter);
 * 
 * // Apply strict limiter to auth routes
 * app.use('/api/auth/login', authLimiter);
 * app.use('/api/auth/register', authLimiter);
 * app.use('/api/auth/forgot-password', passwordResetLimiter);
 */

// Placeholder export for TypeScript compatibility
module.exports = {};
export {};
