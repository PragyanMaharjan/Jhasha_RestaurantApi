const User = require('../models/User');
const Employee = require('../models/Employee');
const { generateToken, generateResetToken } = require('../utils/helpers');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');

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

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData: any = {
      name,
      email,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Hardcoded Admin Credentials
    if (email === 'admin@gmail.com' && password === 'admin123') {
      const adminToken = generateToken('admin-id', 'admin');
      return res.status(200).json({
        message: 'Admin login successful',
        token: adminToken,
        user: {
          _id: 'admin-id',
          name: 'Admin',
          email: 'admin@gmail.com',
          role: 'admin',
          isActive: true
        }
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    
    // Check if email exists in User collection
    if (userType === 'user') {
      user = await User.findOne({ email: email.toLowerCase() });
    } 
    // Check if email exists in Employee collection
    else if (userType === 'employee') {
      user = await Employee.findOne({ email: email.toLowerCase() });
    }
    // Check both collections
    else {
      user = await User.findOne({ email: email.toLowerCase() }) || 
             await Employee.findOne({ email: email.toLowerCase() });
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
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
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
