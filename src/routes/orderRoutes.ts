const express = require('express');
const { createOrder, prepareOrder, verifyCoupon, getUserOrders, getAllOrders, getOrderById, createPaymentIntent, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
import { validate } from '../middleware/validate';
import {
  createOrderValidation,
  updateOrderStatusValidation,
  orderIdValidation,
  createPaymentIntentValidation
} from '../validators/orderValidators';

const router = express.Router();

router.post('/prepare', verifyToken, prepareOrder);
router.post('/verify-coupon', verifyToken, verifyCoupon);
router.post('/', verifyToken, createOrderValidation, validate, createOrder);
router.get('/admin/all', verifyToken, verifyAdmin, getAllOrders);
router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, orderIdValidation, validate, getOrderById);
router.post('/payment/create-intent', verifyToken, createPaymentIntentValidation, validate, createPaymentIntent);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatusValidation, validate, updateOrderStatus);
router.put('/:id/cancel', verifyToken, orderIdValidation, validate, cancelOrder);
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(403).json({ success: false, message: 'Forbidden action' });
  }
  next();
});

module.exports = router;

export {};
