const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const orderTrackingController = require('../controllers/orderTrackingController');
import { validate } from '../middleware/validate';
import { orderTrackingIdValidation, updateOrderTrackingStatusValidation } from '../validators/orderTrackingValidators';

/**
 * Order Tracking Routes
 * Provides real-time order status and delivery tracking
 */

// @route   GET /api/order-tracking/order/:orderId
// @desc    Get detailed tracking information for an order
// @access  Private (Customer or Admin)
router.get('/order/:orderId', verifyToken, orderTrackingIdValidation, validate, orderTrackingController.getOrderTracking);

// @route   PUT /api/order-tracking/order/:orderId/status
// @desc    Update order status and trigger notifications
// @access  Private (Admin only)
router.put('/order/:orderId/status', verifyToken, verifyAdmin, updateOrderTrackingStatusValidation, validate, orderTrackingController.updateOrderStatus);

// @route   GET /api/order-tracking/active-deliveries
// @desc    Get all active deliveries
// @access  Private (Admin only)
router.get('/active-deliveries', verifyToken, verifyAdmin, orderTrackingController.getActiveDeliveries);

module.exports = router;

export {};
