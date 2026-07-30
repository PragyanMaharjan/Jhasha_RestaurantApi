require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const {
  securityHeaders,
  requestSanitizer,
  authLimiter,
  generalLimiter,
  csrfProtection,
} = require('./middleware/security');
const { loginLimiter } = require('./middleware/rateLimit');
const auditLogger = require('./middleware/auditLogger');

const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSanitizer);
app.use(generalLimiter);
app.use(auditLogger);
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Jhasha Restaurant API Docs',
}));

// CSRF bootstrap
app.get('/api/csrf-token', (req, res) => {
  const token = require('crypto').randomBytes(24).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: false,
    maxAge: 15 * 60 * 1000,
  });
  res.status(200).json({ success: true, csrfToken: token });
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api', csrfProtection);

// Routes
app.use('/api', require('./routes/compatibilityRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/order-tracking', require('./routes/orderTracking'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/about', require('./routes/aboutUsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
export {};
