const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  initiateEsewaPayment,
  verifyPayment,
  esewaSuccess,
  esewaFailure
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/esewa/initiate', verifyToken, initiateEsewaPayment);
router.get('/verify/:orderId', verifyToken, verifyPayment);
router.post('/esewa/success', esewaSuccess);
router.get('/esewa/success', esewaSuccess);
router.post('/esewa/failure', esewaFailure);
router.get('/esewa/failure', esewaFailure);

module.exports = router;

export {};
