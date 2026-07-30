const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Food = require('../models/Food');
const Coupon = require('../models/Coupon');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.prepareOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, notes, couponCode } = req.body;
    const userId = req.user.userId;

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: 'Shipping address is incomplete' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Food.findOne({ _id: item.product._id, isAvailable: true });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not available: ${item.product.name || item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        foodId: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const deliveryFee = subtotal > 5000 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    let totalAmount = subtotal + deliveryFee + tax;
    let couponData = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
        usageLimit: { $gt: 0 }
      });

      if (coupon) {
        const alreadyUsed = coupon.oneTimeUse
          ? await Order.exists({ userId, 'coupon.code': coupon.code, paymentStatus: 'completed' })
          : false;

        if (!alreadyUsed) {
          const discount = coupon.type === 'percentage'
            ? Math.round((subtotal * coupon.value) / 100)
            : coupon.value;
          couponData = {
            code: coupon.code,
            discountAmount: discount
          };
          totalAmount = Math.max(0, totalAmount - discount);
        }
      }
    }

    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      deliveryAddress: shippingAddress.address,
      deliveryCity: shippingAddress.city,
      deliveryZipCode: shippingAddress.postalCode,
      phoneNumber: shippingAddress.phone,
      paymentMethod: paymentMethod || 'online',
      notes: notes || '',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      coupon: couponData
    });

    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.verifyCoupon = async (req, res, next) => {
  try {
    const { couponCode, cartTotal } = req.body;
    if (!couponCode || cartTotal == null) {
      return res.status(400).json({ success: false, message: 'Coupon code and cart total are required' });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      usageLimit: { $gt: 0 }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: `Minimum order value of Rs. ${coupon.minOrderValue} required` });
    }

    const alreadyUsed = coupon.oneTimeUse
      ? await Order.exists({ userId: req.user.userId, 'coupon.code': coupon.code, paymentStatus: 'completed' })
      : false;

    if (alreadyUsed) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    let discount = coupon.type === 'percentage'
      ? Math.round((cartTotal * coupon.value) / 100)
      : coupon.value;

    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    res.status(200).json({ success: true, data: { code: coupon.code, discount, newTotal: Math.max(0, cartTotal - discount) } });
  } catch (error) {
    next(error);
  }
};

exports.confirmOrderInternal = async (orderId, paymentDetails: any = {}, session = null) => {
  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;

  if (!order || order.paymentStatus === 'completed') return order;

  for (const item of order.items) {
    const updatedFood = await Food.findOneAndUpdate(
      { _id: item.foodId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, totalOrders: 1 } },
      { session, new: true }
    );
    if (!updatedFood) {
      throw new Error(`Insufficient stock for item ${item.foodId}`);
    }
  }

  order.paymentStatus = 'completed';
  order.orderStatus = 'confirmed';
  order.transactionId = paymentDetails.transactionId || order.transactionId;
  order.updatedAt = new Date();
  if (session) {
    await order.save({ session });
    await Cart.findOneAndUpdate({ user: order.userId }, { $set: { items: [] } }, { session });
  } else {
    await order.save();
    await Cart.findOneAndUpdate({ user: order.userId }, { $set: { items: [] } });
  }

  return order;
};

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
      return res.status(400).json({ message: 'This order cannot be cancelled at its current stage' });
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
