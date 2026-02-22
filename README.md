# Backend - Restaurant API

## 🏗️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5.2.2
- **Database:** MongoDB with Mongoose 7.0.0
- **Authentication:** JWT (jsonwebtoken 9.0.0) + bcryptjs 2.4.3
- **Validation:** express-validator 7.0.0
- **Payment:** Stripe 12.0.0
- **File Upload:** Multer 1.4.5
- **Email:** Nodemailer 6.9.8
- **Testing:** Jest 29.7.0 + Supertest 6.3.3
- **Linting:** ESLint with TypeScript support

## 📁 Project Structure

```
backend/
├── src/
│   ├── __tests__/              # Test files
│   │   ├── setup.ts           # Test configuration
│   │   └── integration/       # Integration tests
│   │       ├── auth.test.ts
│   │       ├── foodAndOrders.test.ts
│   │       └── users.test.ts
│   ├── controllers/           # Business logic
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   ├── foodController.ts
│   │   ├── orderController.ts
│   │   └── orderTrackingController.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts           # JWT authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── upload.ts         # File upload
│   │   └── validate.ts       # Validation middleware
│   ├── models/               # Mongoose schemas
│   │   ├── Food.ts
│   │   ├── Order.ts
│   │   ├── Review.ts
│   │   └── User.ts
│   ├── routes/               # API routes
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── foodRoutes.ts
│   │   ├── orderRoutes.ts
│   │   └── orderTracking.ts
│   ├── validators/           # Input validation
│   │   ├── adminValidators.ts
│   │   ├── authValidators.ts
│   │   ├── foodValidators.ts
│   │   └── orderValidators.ts
│   ├── utils/                # Helper functions
│   │   ├── emailService.ts
│   │   └── helpers.ts
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── uploads/                 # File storage
├── .env                     # Environment variables
├── jest.config.js          # Jest configuration
├── tsconfig.json           # TypeScript config
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone and navigate to backend**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Variables**

   Create a `.env` file in the backend directory:

   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/restaurant

   # JWT
   JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
   JWT_EXPIRE=7d

   # Frontend
   FRONTEND_URL=http://localhost:3000

   # Stripe
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

   # Email (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   EMAIL_FROM=noreply@restaurant.com
   ```

   **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in `EMAIL_PASSWORD`

4. **Run the server**

   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Suites

- **auth.test.ts:** Registration, login, profile management (25+ tests)
- **foodAndOrders.test.ts:** Food CRUD, orders, reviews (30+ tests)
- **users.test.ts:** User management, admin operations (10+ tests)

**Total:** 65+ integration tests with >80% code coverage

## 🔒 Authentication & Authorization

### JWT Authentication

- Token expires in 7 days (configurable)
- Token sent in Authorization header: `Bearer <token>`
- Password hashed using bcrypt with salt rounds = 10

### Middleware

```typescript
// Protect routes
router.get("/profile", protect, getUserProfile);

// Admin only
router.delete("/users/:id", protect, admin, deleteUser);
```

### Roles

- **user:** Regular customers (default)
- **admin:** Full access to admin endpoints

## 📊 Database Models

### User Model

```typescript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: 'user' | 'admin',
  profileImage: String,
  isActive: Boolean,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date
}
```

### Food Model

```typescript
{
  name: String,
  description: String,
  category: 'starter' | 'main_course' | 'dessert' | 'beverage' | 'side_dish',
  price: Number,
  image: String,
  preparationTime: Number,
  isVegetarian: Boolean,
  spiceLevel: 'mild' | 'medium' | 'hot',
  rating: Number,
  isAvailable: Boolean,
  createdAt: Date
}
```

### Order Model

```typescript
{
  userId: ObjectId (ref: User),
  items: [{
    foodId: ObjectId (ref: Food),
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  deliveryAddress: String,
  deliveryCity: String,
  deliveryZipCode: String,
  phoneNumber: String,
  orderStatus: 'placed' | 'confirmed' | 'preparing' | 'ready' |
               'out_for_delivery' | 'delivered' | 'cancelled',
  paymentMethod: 'online' | 'cash_on_delivery',
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
  stripePaymentIntentId: String,
  notes: String,
  statusHistory: [{
    status: String,
    timestamp: Date
  }],
  createdAt: Date
}
```

## 🛣️ API Routes

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /profile` - Get user profile (Protected)
- `PUT /profile` - Update profile (Protected)

### Food (`/api/food`)

- `GET /` - Get all food items
- `GET /:id` - Get food by ID
- `POST /` - Add food (Admin)
- `PUT /:id` - Update food (Admin)
- `DELETE /:id` - Delete food (Admin)

### Orders (`/api/orders`)

- `POST /` - Create order (Protected)
- `GET /` - Get user orders (Protected)
- `GET /admin/all` - Get all orders (Admin)
- `GET /:id` - Get order by ID (Protected)
- `PUT /:id/status` - Update order status (Admin)
- `PUT /:id/cancel` - Cancel order (Protected)
- `POST /payment-intent` - Create Stripe payment (Protected)

### Admin (`/api/admin`)

- `GET /users` - Get all users (Admin)
- `GET /users/:id` - Get user by ID (Admin)
- `PUT /users/status` - Update user status (Admin)
- `PUT /users/:id` - Update user (Admin)
- `DELETE /users/:id` - Delete user (Admin)
- `GET /stats` - Get dashboard statistics (Admin)

### Order Tracking (`/api/tracking`)

- `GET /order/:orderId` - Get order tracking (Protected)

## ✅ Input Validation

All endpoints use **express-validator** for input validation:

### Example: Register Validation

```typescript
registerValidation: [
  body("name").trim().notEmpty().isLength({ min: 2, max: 50 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").matches(/^\+?[1-9]\d{1,14}$/),
  body("password").isLength({ min: 6, max: 128 }),
  body("confirmPassword").custom(
    (value, { req }) => value === req.body.password,
  ),
];
```

### Validation Response

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## 📝 Code Quality

### ESLint Configuration

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**Rules:**

- TypeScript strict mode
- Max line length: 120 characters
- Semicolons required
- 2-space indentation
- No unused variables (warning)
- No explicit any (warning)

### Documentation Standards

All controller functions include JSDoc comments:

```typescript
/**
 * Register a new user
 * @route POST /api/auth/register
 * @description Creates a new user account with hashed password
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware
 * @returns {Promise<void>} JSON with user data and JWT token
 * @throws {400} Validation errors or duplicate email
 * @access Public
 */
```

## 🔧 Utilities

### Email Service

```typescript
// Send email
await sendEmail({
  to: "user@example.com",
  subject: "Welcome",
  text: "Welcome to our restaurant!",
  html: "<h1>Welcome</h1>",
});
```

### File Upload

- Uses Multer for image uploads
- Stored in `uploads/` directory
- Accepts: JPG, JPEG, PNG, WebP
- Max size: 5MB
- Accessible at: `http://localhost:5000/uploads/filename.jpg`

## 🐛 Error Handling

Centralized error handler middleware catches all errors:

```typescript
// Custom error
throw new Error("Resource not found");

// Async errors
asyncHandler(async (req, res, next) => {
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
});
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Configure MongoDB Atlas
- [ ] Set up Stripe production keys
- [ ] Configure SMTP for emails
- [ ] Set CORS_ORIGIN to your domain
- [ ] Change default admin password

### Recommended Platforms

- **Heroku:** Easy deployment with MongoDB Atlas
- **Railway:** Modern platform with auto-deploys
- **DigitalOcean:** App Platform or Droplet
- **AWS:** EC2 or Elastic Beanstalk

## 📈 Performance Tips

- Enable MongoDB indexes on frequently queried fields
- Use pagination for large result sets
- Implement caching for static data
- Compress responses with compression middleware
- Use CDN for uploaded images

## 🔐 Security Best Practices

✅ **Implemented:**

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Rate limiting ready
- XSS protection via validation
- MongoDB injection protection

⚠️ **Production Recommendations:**

- Enable rate limiting
- Add helmet.js for security headers
- Use HTTPS only
- Implement CSRF protection
- Add request logging (Morgan)
- Set up monitoring (PM2, New Relic)

## 🐳 Docker Support (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📞 Support

For issues or questions:

1. Check API documentation in `/docs/API_DOCUMENTATION.md`
2. Review test files for usage examples
3. Check environment variables are correctly set

---

**Built with TypeScript + Express + MongoDB**
