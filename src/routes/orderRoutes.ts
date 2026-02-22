const express = require('express');
const { createOrder, getUserOrders, getAllOrders, getOrderById, createPaymentIntent, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
import { validate } from '../middleware/validate';
import {
  createOrderValidation,
  updateOrderStatusValidation,
  orderIdValidation,
  createPaymentIntentValidation
} from '../validators/orderValidators';

const router = express.Router();

router.post('/', verifyToken, createOrderValidation, validate, createOrder);
router.get('/admin/all', verifyToken, verifyAdmin, getAllOrders);
router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, orderIdValidation, validate, getOrderById);
router.post('/payment/create-intent', verifyToken, createPaymentIntentValidation, validate, createPaymentIntent);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatusValidation, validate, updateOrderStatus);
router.put('/:id/cancel', verifyToken, orderIdValidation, validate, cancelOrder);

module.exports = router;

export {};
