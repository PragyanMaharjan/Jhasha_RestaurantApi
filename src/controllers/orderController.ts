const Order = require('../models/Order');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a new order
 * @route POST /api/orders
 * @description Creates a new order for the authenticated user
 * @param {Request} req - Express request object with order details
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns created order object
 * @access Private
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, deliveryAddress, deliveryCity, deliveryZipCode, phoneNumber, paymentMethod, notes } = req.body;

    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      deliveryAddress,
      deliveryCity,
      deliveryZipCode,
      phoneNumber,
      paymentMethod,
      notes
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders for authenticated user
 * @route GET /api/orders
 * @description Retrieves all orders belonging to the authenticated user
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns array of user orders
 * @access Private
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.foodId')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders
 * @route GET /api/orders/admin/all
 * @description Retrieves all orders in the system with user details (Admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns array of all orders
 * @access Private (Admin only)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('items.foodId')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @description Retrieves a specific order by ID
 * @param {Request} req - Express request object with order ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns order object
 * @throws {404} If order not found
 * @throws {403} If user is not owner or admin
 * @access Private
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.foodId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is owner or admin
    if (order.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

// Create payment intent (Stripe)
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        orderId: orderId
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * @route PUT /api/orders/:id/status
 * @description Updates the status of an order (Admin only)
 * @param {Request} req - Express request object with order ID and new status
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns updated order object
 * @throws {404} If order not found
 * @access Private (Admin only)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.orderStatus !== 'placed') {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }

    order.orderStatus = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export {};
