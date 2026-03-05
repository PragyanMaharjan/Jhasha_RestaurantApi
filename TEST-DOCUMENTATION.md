# Backend Test Documentation

## Overview

This document outlines all the tests implemented for the backend of the Jhasha Restaurant application. The backend uses **Jest** as the testing framework with **Supertest** for integration testing.

## Test Structure

```
backend/src/__tests__/
├── setup.ts
├── unit/           # Unit tests for individual modules
└── integration/    # Integration tests for API endpoints
```

---

## Unit Tests

### 1. Authentication Validators (authValidators.test.ts)

**Purpose**: Validates authentication-related input data

**Test Coverage**:

- ✅ **Register Validation**
  - Valid registration data passes
  - Name validation (required, length between 2-50 characters)
  - Email validation (valid format, required)
  - Phone number validation (Nepal phone number format: +977-XXXXXXXXXX)
  - Password validation (minimum length, complexity)
  - Confirm password matching
- ✅ **Login Validation**
  - Valid credentials format
  - Email and password required
  - Email format validation

- ✅ **Forgot Password Validation**
  - Valid email format required

- ✅ **Reset Password Validation**
  - Token validation
  - New password requirements
  - Password confirmation matching

- ✅ **Update Profile Validation**
  - Name length validation
  - Phone number format
  - Optional fields handling

**Total Tests**: ~30+ test cases

---

### 2. Food Validators (foodValidators.test.ts)

**Purpose**: Validates food item data for creation and updates

**Test Coverage**:

- ✅ **Add Food Validation**
  - Valid food data passes
  - Name validation (required, 3-100 characters)
  - Description validation (10-500 characters)
  - Category validation (starter, main_course, dessert, beverage, side_dish)
  - Price validation (positive number, required)
  - Preparation time validation (optional, positive number)
  - Vegetarian flag validation
  - Spice level validation (mild, medium, hot)

- ✅ **Update Food Validation**
  - Valid MongoDB ObjectId for food ID
  - Partial update support
  - Same field validations as add

**Total Tests**: ~25+ test cases

---

### 3. Order Validators (orderValidators.test.ts)

**Purpose**: Validates order creation and status updates

**Test Coverage**:

- ✅ **Create Order Validation**
  - Items array validation (minimum 1 item)
  - Food ID validation (valid MongoDB ObjectId)
  - Quantity validation (1-50 range)
  - Price validation (positive numbers)
  - Delivery address validation (10-200 characters)
  - Delivery city validation
  - Zip code validation
  - Phone number validation (Nepal format)
  - Payment method validation (cash_on_delivery, online)
  - Optional notes validation

- ✅ **Update Order Status Validation**
  - Valid status values (pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled)
  - MongoDB ObjectId validation for order ID

- ✅ **Payment Intent Validation**
  - Amount validation (positive number)

**Total Tests**: ~35+ test cases

---

### 4. Error Handler Middleware (errorHandler.test.ts)

**Purpose**: Tests centralized error handling

**Test Coverage**:

- ✅ Generic errors (500 status)
- ✅ ValidationError handling
- ✅ CastError handling (invalid MongoDB ObjectId)
- ✅ Custom status codes
- ✅ Duplicate key errors (MongoDB code 11000)
- ✅ JWT errors (JsonWebTokenError, TokenExpiredError)
- ✅ Error message formatting
- ✅ Error response structure

**Total Tests**: ~12+ test cases

---

### 5. Authentication Middleware (auth.test.ts)

**Purpose**: Tests JWT token verification and authorization

**Test Coverage**:

- ✅ **verifyToken Middleware**
  - Valid token verification
  - Missing token handling (401)
  - Invalid token handling (401)
  - Expired token handling (401)
  - Malformed authorization header
  - Token extraction from Bearer header

- ✅ **verifyAdmin Middleware**
  - Admin role verification
  - Non-admin user rejection (403)
  - Missing user context handling

- ✅ **requireRole Middleware**
  - Role-based access control
  - Multiple role support
  - Unauthorized role rejection

**Total Tests**: ~20+ test cases

---

### 6. Helper Utilities (helpers.test.ts)

**Purpose**: Tests utility functions

**Test Coverage**:

- ✅ **generateToken Function**
  - Token generation with userId and role
  - Admin token generation
  - Custom JWT_EXPIRE support
  - Numeric userId handling
  - Different tokens for different users

- ✅ **generateResetToken Function**
  - Random token generation
  - 64-character hex string
  - Unique token generation

- ✅ **Email Sending Functions**
  - Email service configuration
  - Reset password email
  - Order confirmation email

**Total Tests**: ~15+ test cases

---

### 7. Employee Model (employee.test.ts)

**Purpose**: Tests Employee schema and model

**Test Coverage**:

- ✅ Employee creation with all fields
- ✅ Required fields (name, email, phone, position, department, salary)
- ✅ Optional fields (experience, skills, address, idProof)
- ✅ Status field (active, inactive, on_leave)
- ✅ Join date handling
- ✅ Skills array
- ✅ Timestamps (createdAt, updatedAt)

**Total Tests**: ~15+ test cases

---

### 8. About Us Model (aboutUs.test.ts)

**Purpose**: Tests About Us page schema

**Test Coverage**:

- ✅ Document creation with all fields
- ✅ Contact information (phone, email, address)
- ✅ Social media links (facebook, instagram, twitter)
- ✅ Team members array
- ✅ Highlights array
- ✅ Vision and mission statements
- ✅ Image handling
- ✅ Timestamps

**Total Tests**: ~12+ test cases

---

### 9. Review Model (review.test.ts)

**Purpose**: Tests Review schema

**Test Coverage**:

- ✅ Review creation with required fields
- ✅ User and Food references (MongoDB ObjectId)
- ✅ Rating validation (1-5 range)
- ✅ Comment field (optional, variable length)
- ✅ Timestamps
- ✅ Empty comment handling
- ✅ Long comment support

**Total Tests**: ~10+ test cases

---

## Integration Tests

### 1. Authentication APIs (auth.test.ts)

**Purpose**: Tests authentication endpoints end-to-end

**Test Coverage**:

- ✅ **POST /api/auth/register**
  - Successful registration with valid data
  - Token generation
  - Password hashing
  - Duplicate email handling (400)
  - Password mismatch validation (400)
  - Required fields validation

- ✅ **POST /api/auth/login**
  - Successful login with correct credentials
  - Admin login with hardcoded credentials
  - Invalid password rejection (401)
  - Non-existent email handling (401)
  - Token generation on success

- ✅ **POST /api/auth/forgot-password**
  - Reset token generation
  - Email sending verification
  - Non-existent user handling
  - Reset token expiry

**Total Tests**: ~12+ test cases

---

### 2. Food & Orders APIs (foodAndOrders.test.ts)

**Purpose**: Tests food and order management endpoints

**Test Coverage**:

- ✅ **GET /api/food**
  - Retrieve all food items
  - Pagination support
  - Category filtering
  - Search functionality
  - Available items filtering

- ✅ **GET /api/food/:id**
  - Single food item retrieval
  - 404 for non-existent food
  - Populated reviews

- ✅ **POST /api/food** (Admin only)
  - Create new food item
  - Image upload handling
  - Admin authorization required (401 without token)
  - Field validation

- ✅ **PUT /api/food/:id** (Admin only)
  - Update food item
  - Partial updates
  - Admin authorization

- ✅ **DELETE /api/food/:id** (Admin only)
  - Delete food item
  - Admin authorization

- ✅ **POST /api/orders** (Authenticated)
  - Create new order
  - Order calculation
  - User authentication required
  - Payment method handling

- ✅ **GET /api/orders** (Authenticated)
  - User's orders retrieval
  - Order history
  - Populated food items

**Total Tests**: ~20+ test cases

---

### 3. User Management APIs (users.test.ts)

**Purpose**: Tests admin user management endpoints

**Test Coverage**:

- ✅ **GET /api/admin/users** (Admin only)
  - List all users with pagination
  - Search functionality
  - Total count and pages
  - Admin authorization (403 for non-admin)
  - 401 without token

- ✅ **GET /api/admin/users/:id** (Admin only)
  - User details retrieval
  - Orders count
  - 404 for non-existent user

- ✅ **PUT /api/admin/users/status** (Admin only)
  - Update user active status
  - Ban/unban users
  - Status validation

- ✅ **DELETE /api/admin/users/:id** (Admin only)
  - Delete user account
  - Cascade delete (orders, reviews)

**Total Tests**: ~10+ test cases

---

### 4. Order Tracking APIs (orderTracking.test.ts)

**Purpose**: Tests order tracking functionality

**Test Coverage**:

- ✅ **GET /api/order-tracking/order/:orderId**
  - Order status retrieval
  - Status history
  - Estimated delivery time
  - Authentication required (401)
  - 404 for non-existent order

- ✅ **GET /api/order-tracking/my-orders**
  - User's order list
  - Order filtering
  - Sorting by date

- ✅ **PUT /api/order-tracking/status/:orderId** (Admin only)
  - Update order status
  - Status history recording
  - Status transition validation
  - Notification triggering

**Total Tests**: ~12+ test cases

---

## Test Configuration

### Jest Configuration (jest.config.js)

```javascript
- Test environment: Node.js
- Coverage thresholds: 80%+ for statements, branches, functions, lines
- MongoDB memory server for isolated testing
- Setup file: __tests__/setup.ts
```

### Test Database

- Uses MongoDB Memory Server
- Isolated test database for each test suite
- Automatic cleanup after tests
- No impact on production/development databases

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- unit

# Run integration tests only
npm test -- integration

# Run specific test file
npm test -- authValidators

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Test Coverage Summary

### Overall Coverage

- **Unit Tests**: 150+ test cases
- **Integration Tests**: 54+ test cases
- **Total**: 200+ test cases

### Code Coverage

- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

---

## Best Practices Followed

1. ✅ **Isolated Tests**: Each test is independent
2. ✅ **Setup/Teardown**: Proper beforeEach/afterEach cleanup
3. ✅ **Mocking**: External dependencies are mocked
4. ✅ **Descriptive Names**: Clear test descriptions
5. ✅ **Edge Cases**: Boundary conditions tested
6. ✅ **Error Scenarios**: Negative test cases included
7. ✅ **Integration**: Real database operations tested
8. ✅ **Authentication**: Token-based tests
9. ✅ **Authorization**: Role-based access tested

---

## Future Improvements

- [ ] Add performance testing
- [ ] Add load testing
- [ ] Increase coverage to 90%+
- [ ] Add API contract testing
- [ ] Add security testing
- [ ] Add snapshot testing for responses
