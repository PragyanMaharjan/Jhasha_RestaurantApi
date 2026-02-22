const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const orderTrackingController = require('../controllers/orderTrackingController');

/**
 * Order Tracking Routes
 * Provides real-time order status and delivery tracking
 */

// @route   GET /api/tracking/order/:orderId
// @desc    Get detailed tracking information for an order
// @access  Private (Customer or Admin)
router.get('/order/:orderId', verifyToken, orderTrackingController.getOrderTracking);

// @route   PUT /api/tracking/order/:orderId/status
// @desc    Update order status and trigger notifications
// @access  Private (Admin only)
router.put('/order/:orderId/status', verifyToken, verifyAdmin, orderTrackingController.updateOrderStatus);

// @route   GET /api/tracking/active-deliveries
// @desc    Get all active deliveries
// @access  Private (Admin only)
router.get('/active-deliveries', verifyToken, verifyAdmin, orderTrackingController.getActiveDeliveries);

module.exports = router;

export {};
