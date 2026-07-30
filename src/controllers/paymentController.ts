const mongoose = require('mongoose');
const Order = require('../models/Order');
const { generateEsewaFormData, verifyEsewaPayment, generateTransactionUUID } = require('../utils/esewa');
const { confirmOrderInternal } = require('./orderController');

exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    const transactionUUID = generateTransactionUUID();
    const protocol = req.protocol;
    const host = req.get('host');
    const backendCallbackUrl = `${protocol}://${host}/api/payments/esewa`;

    const esewaData = generateEsewaFormData({
      totalAmount: order.totalAmount,
      transactionUUID,
      productCode: 'EPAYTEST',
      successUrl: `${backendCallbackUrl}/success`,
      failureUrl: `${backendCallbackUrl}/failure`
    });

    order.paymentStatus = 'processing';
    order.transactionId = transactionUUID;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        esewaUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        formData: esewaData,
        transactionUUID
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Unable to verify payment' });
  }
};

exports.esewaSuccess = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const responseData = req.query;
    let decodedData = responseData;

    if (responseData.data) {
      const buff = Buffer.from(responseData.data, 'base64');
      decodedData = JSON.parse(buff.toString('utf-8'));
    }

    const isValidSignature = verifyEsewaPayment(decodedData);
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }

    const order = await Order.findOne({ 'transactionId': decodedData.transaction_uuid }).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    await confirmOrderInternal(order._id, { transactionId: decodedData.transaction_uuid }, session);
    await session.commitTransaction();
    session.endSession();

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Esewa success callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`);
  }
};

exports.esewaFailure = async (req, res) => {
  try {
    const responseData = req.query;
    let transactionUUID = responseData.transaction_uuid;

    if (responseData.data) {
      const buff = Buffer.from(responseData.data, 'base64');
      const decoded = JSON.parse(buff.toString('utf-8'));
      transactionUUID = decoded.transaction_uuid;
    }

    if (transactionUUID) {
      await Order.findOneAndUpdate(
        { transactionId: transactionUUID },
        { paymentStatus: 'failed' }
      );
    }

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`);
  } catch (error) {
    console.error('Esewa failure callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`);
  }
};

export {};
