/**
 * Security Middleware
 * Implements various security best practices
 * 
 * To use this middleware, install the required packages:
 * npm install helmet express-mongo-sanitize xss-clean hpp
 * 
 * Then uncomment this file and apply in app.ts
 */

// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const hpp = require('hpp');

// /**
//  * Security headers middleware using Helmet
//  * Protects against common web vulnerabilities
//  */
// const securityHeaders = helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", 'data:', 'https:'],
//     },
//   },
//   crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
// });

// /**
//  * NoSQL injection prevention
//  * Sanitizes user input to prevent MongoDB operator injection
//  */
// const noSqlInjectionPrevention = mongoSanitize({
//   replaceWith: '_', // Replace prohibited characters with underscore
// });

// /**
//  * XSS (Cross-Site Scripting) protection
//  * Sanitizes user input to prevent XSS attacks
//  */
// const xssProtection = xss();

// /**
//  * HTTP Parameter Pollution protection
//  * Prevents parameter pollution attacks
//  */
// const parameterPollutionProtection = hpp({
//   whitelist: ['category', 'rating', 'price', 'orderStatus'], // Allow duplicate params for these fields
// });

// module.exports = {
//   securityHeaders,
//   noSqlInjectionPrevention,
//   xssProtection,
//   parameterPollutionProtection,
// };

/**
 * USAGE in app.ts (apply before routes):
 * 
 * const {
 *   securityHeaders,
 *   noSqlInjectionPrevention,
 *   xssProtection,
 *   parameterPollutionProtection
 * } = require('./middleware/security');
 * 
 * // Apply security middleware
 * app.use(securityHeaders);
 * app.use(noSqlInjectionPrevention);
 * app.use(xssProtection);
 * app.use(parameterPollutionProtection);
 */

// Placeholder export for TypeScript compatibility
module.exports = {};
export {};
