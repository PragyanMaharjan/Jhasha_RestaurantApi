const User = require('../models/User');
const Employee = require('../models/Employee');
const { generateToken, generateResetToken } = require('../utils/helpers');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validatePasswordPolicy } = require('../utils/passwordPolicy');
const { generateTwoFactorSecret, buildOtpAuthUrl, evaluateTwoFactorLogin, verifyTwoFactorCode } = require('../utils/twoFactor');

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const getClientKey = (req: any) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.ip || 'unknown';
  return `${ip}`.replace(/[^a-zA-Z0-9._:-]/g, '');
};

const normalizeEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) {
    return normalized;
  }

  if (['gmail.com', 'googlemail.com'].includes(domain)) {
    const withoutPlus = localPart.split('+')[0];
    const withoutDots = withoutPlus.replace(/\./g, '');
    return `${withoutDots}@gmail.com`;
  }

  return normalized;
};

const buildEmailQuery = (email) => {
  const raw = String(email || '').trim().toLowerCase();
  const canonical = normalizeEmail(raw);

  if (raw === canonical) {
    return { email: raw };
  }

  return { email: { $in: [raw, canonical] } };
};

const isLockedOut = (req: any) => {
  const key = getClientKey(req);
  const state = loginAttempts.get(key);
  if (!state) return false;
  if (Date.now() - state.lastAttempt < LOCKOUT_WINDOW_MS) {
    return state.count >= MAX_LOGIN_ATTEMPTS;
  }
  loginAttempts.delete(key);
  return false;
};

const recordFailedLogin = (req: any) => {
  const key = getClientKey(req);
  const state = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
  state.count += 1;
  state.lastAttempt = Date.now();
  loginAttempts.set(key, state);
};

const clearLoginAttempts = (req: any) => {
  loginAttempts.delete(getClientKey(req));
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @description Creates a new user account with the provided information
 * @param {Request} req - Express request object containing user registration data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns JWT token and user object
 * @throws {400} If passwords don't match or email already exists
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordPolicy = validatePasswordPolicy(password);
    if (!passwordPolicy.isValid) {
      return res.status(400).json({ success: false, message: passwordPolicy.errors.join(' ') });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData: any = {
      name,
      email: normalizedEmail,
      phone,
      password
    };

    // Add profile image if uploaded
    if (req.file) {
      userData.profileImage = req.file.path;
    }

    user = new User(userData);

    await user.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * @route POST /api/auth/login
 * @description Authenticates user and returns JWT token
 * @param {Request} req - Express request object containing email and password
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns JWT token and user object
 * @throws {400} If email or password is missing
 * @throws {401} If credentials are invalid or account is inactive
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (isLockedOut(req)) {
      return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026!Secure';

    if (String(email).toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      clearLoginAttempts(req);
      const adminToken = generateToken('admin-id', 'admin');
      return res.status(200).json({
        message: 'Admin login successful',
        token: adminToken,
        user: {
          _id: 'admin-id',
          name: 'Admin',
          email: adminEmail,
          role: 'admin',
          isActive: true
        }
      });
    }

    const emailQuery = buildEmailQuery(email);
    const user = await User.findOne(emailQuery);
    if (!user) {
      recordFailedLogin(req);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      recordFailedLogin(req);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const twoFactorResult = evaluateTwoFactorLogin(user, twoFactorCode);
    if (twoFactorResult.required) {
      return res.status(401).json({ success: false, message: twoFactorResult.message });
    }

    clearLoginAttempts(req);
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @description Generates reset token and sends password reset email
 * @param {Request} req - Express request object containing user email
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns success message if email exists, error if not
 * @throws {400} If email is missing or not found
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, userType = 'user' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    let user;
    const emailQuery = buildEmailQuery(email);
    
    // Check if email exists in User collection
    if (userType === 'user') {
      user = await User.findOne(emailQuery);
    } 
    // Check if email exists in Employee collection
    else if (userType === 'employee') {
      user = await Employee.findOne(emailQuery);
    }
    // Check both collections
    else {
      user = await User.findOne(emailQuery) || 
             await Employee.findOne(emailQuery);
    }

    if (!user) {
      // Return error message indicating email doesn't exist
      return res.status(404).json({ 
        success: false,
        message: 'No account found with that email address. Please check and try again.' 
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Update user/employee with reset token
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      res.status(200).json({ 
        success: true,
        message: 'Password reset link has been sent to your email. Please check your inbox.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      
      // If email sending fails, remove the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send reset email. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again later.' 
    });
  }
};

/**
 * Reset user password
 * @route POST /api/auth/reset-password
 * @description Resets user password using valid reset token
 * @param {Request} req - Express request object containing reset token and new password
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns success message
 * @throws {400} If passwords don't match or token is invalid/expired
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user profile
 * @route GET /api/auth/profile
 * @description Retrieves the profile of the authenticated user
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns user profile object
 * @throws {404} If user not found
 * @access Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // Handle hardcoded admin
    if (req.user.userId === 'admin-id') {
      return res.status(200).json({
        user: {
          _id: 'admin-id',
          name: 'Admin',
          email: 'admin@gmail.com',
          role: 'admin',
          isActive: true,
          phone: '+977-9800000000',
          address: 'Kathmandu, Nepal',
          city: 'Kathmandu',
          zipCode: '44600'
        }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * @route PUT /api/auth/profile
 * @description Updates user profile information
 * @param {Request} req - Express request object with profile data and optional image
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns updated user object
 * @throws {404} If user not found
 * @access Private
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, address, city, zipCode } = req.body;

    // Handle hardcoded admin
    if (req.user.userId === 'admin-id') {
      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          _id: 'admin-id',
          name: name || 'Admin',
          email: 'admin@gmail.com',
          role: 'admin',
          isActive: true,
          phone: phone || '+977-9800000000',
          address: address || 'Kathmandu, Nepal',
          city: city || 'Kathmandu',
          zipCode: zipCode || '44600'
        }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (city) user.city = city;
    if (zipCode) user.zipCode = zipCode;

    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 * @description Updates the user's password after verifying the current password
 * @param {Request} req - Express request object with currentPassword and newPassword
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns success message
 * @throws {400} If passwords don't match
 * @throws {401} If current password is incorrect
 * @throws {404} If user not found
 */
exports.setupTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId || userId === 'admin-id') {
      return res.status(403).json({ success: false, message: 'Two-factor setup is only available for regular users' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = generateTwoFactorSecret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      secret,
      otpauthUrl: buildOtpAuthUrl(secret, user.email),
      message: 'Scan the QR code with your authenticator app to complete setup.'
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;
    if (!userId || userId === 'admin-id') {
      return res.status(403).json({ success: false, message: 'Two-factor verification is only available for regular users' });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Two-factor setup has not been completed' });
    }

    if (!code || !verifyTwoFactorCode(user.twoFactorSecret, code)) {
      return res.status(401).json({ success: false, message: 'Invalid two-factor code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const passwordPolicy = validatePasswordPolicy(newPassword);
    if (!passwordPolicy.isValid) {
      return res.status(400).json({ success: false, message: passwordPolicy.errors.join(' ') });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'The current password you entered is incorrect' });
    }

    const recentHashes = user.passwordHistory || [];
    for (const previousHash of recentHashes.slice(-5)) {
      const isReused = await bcrypt.compare(newPassword, previousHash);
      if (isReused) {
        return res.status(400).json({ success: false, message: 'Please choose a password that has not been used recently.' });
      }
    }

    user.passwordHistory = [...(user.passwordHistory || []), user.password];
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }
    user.lastPasswordChange = new Date();
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export {};
