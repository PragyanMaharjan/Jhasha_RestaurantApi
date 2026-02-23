/**
 * Request Logger Middleware
 * Logs HTTP requests for debugging and monitoring
 * 
 * To use this middleware, install the required package:
 * npm install morgan
 * 
 * Then uncomment this file and apply in app.ts
 */

// const morgan = require('morgan');
// const fs = require('fs');
// const path = require('path');

// // Create logs directory if it doesn't exist
// const logsDir = path.join(__dirname, '../../logs');
// if (!fs.existsSync(logsDir)) {
//   fs.mkdirSync(logsDir, { recursive: true });
// }

// // Create a write stream for access logs
// const accessLogStream = fs.createWriteStream(
//   path.join(logsDir, 'access.log'),
//   { flags: 'a' } // Append mode
// );

// // Define custom token for response time in ms
// morgan.token('response-time-ms', (req, res) => {
//   if (!req._startAt || !res._startAt) {
//     return '0';
//   }
//   const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
//              (res._startAt[1] - req._startAt[1]) * 1e-6;
//   return ms.toFixed(3);
// });

// /**
//  * Development logger - detailed console output
//  */
// const devLogger = morgan('dev');

// /**
//  * Production logger - combined format to file
//  */
// const prodLogger = morgan('combined', {
//   stream: accessLogStream,
//   skip: (req, res) => res.statusCode < 400, // Only log errors in production
// });

// /**
//  * Custom logger with additional info
//  */
// const customLogger = morgan((tokens, req, res) => {
//   return [
//     tokens.method(req, res),
//     tokens.url(req, res),
//     tokens.status(req, res),
//     tokens['response-time-ms'](req, res), 'ms',
//     '-',
//     tokens['remote-addr'](req, res),
//   ].join(' ');
// });

// /**
//  * Get appropriate logger based on environment
//  */
// const getLogger = () => {
//   if (process.env.NODE_ENV === 'production') {
//     return prodLogger;
//   } else if (process.env.NODE_ENV === 'test') {
//     return (req, res, next) => next(); // No logging in tests
//   }
//   return devLogger;
// };

// module.exports = getLogger();

/**
 * USAGE in app.ts (apply before routes):
 * 
 * const logger = require('./middleware/logger');
 * app.use(logger);
 */

// Placeholder export for TypeScript compatibility
module.exports = (req: any, res: any, next: any) => next();
export {};
