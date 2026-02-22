const User = require('../models/User');
const Order = require('../models/Order');

/**
 * Get all users with pagination and search
 * @route GET /api/admin/users
 * @description Retrieves all users with optional pagination and search (Admin only)
 * @param {Request} req - Express request object with query params (page, limit, search)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns paginated list of users
 * @access Private (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const query: any = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details by ID
 * @route GET /api/admin/users/:id
 * @description Retrieves detailed information about a specific user (Admin only)
 * @param {Request} req - Express request object with user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns user object with order count
 * @throws {404} If user not found
 * @access Private (Admin only)
 */
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user orders count
    const ordersCount = await Order.countDocuments({ userId: user._id });

    res.status(200).json({
      user,
      ordersCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 * @route PUT /api/admin/users/status
 * @description Activates or deactivates a user account (Admin only)
 * @param {Request} req - Express request object with userId and isActive
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns updated user object
 * @throws {404} If user not found
 * @access Private (Admin only)
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { userId, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User status updated',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user information
 * @route PUT /api/admin/users/:id
 * @description Updates user profile information (Admin only)
 * @param {Request} req - Express request object with user ID and update data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns updated user object
 * @throws {404} If user not found
 * @throws {400} If email already in use
 * @access Private (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already used by another user
    if (email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updateData: any = { name, email, phone };

    // Handle profile image if uploaded
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:id
 * @description Permanently deletes a user account (Admin only)
 * @param {Request} req - Express request object with user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns success message
 * @throws {404} If user not found
 * @throws {400} If trying to delete admin account
 * @access Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard stats (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['placed', 'confirmed', 'preparing'] }
    });

    res.status(200).json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      pendingOrders
    });
  } catch (error) {
    next(error);
  }
};

export {};
