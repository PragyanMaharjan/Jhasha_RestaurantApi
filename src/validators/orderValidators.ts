import { body, param } from 'express-validator';

/**
 * Validation rules for creating an order
 */
export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.foodId')
    .isMongoId()
    .withMessage('Invalid food ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50'),
  
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Delivery address must be between 10 and 200 characters'),
  
  body('deliveryCity')
    .trim()
    .notEmpty()
    .withMessage('Delivery city is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('deliveryZipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required')
    .matches(/^[0-9]{4,10}$/)
    .withMessage('Please provide a valid zip code'),
  
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('paymentMethod')
    .optional()
    .isIn(['online', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

/**
 * Validation rules for updating order status
 */
export const updateOrderStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('orderStatus')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
];

/**
 * Validation rules for order ID parameter
 */
export const orderIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID')
];

/**
 * Validation rules for payment intent
 */
export const createPaymentIntentValidation = [
  body('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
];
