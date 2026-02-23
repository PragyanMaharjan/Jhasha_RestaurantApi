import { param, body } from 'express-validator';

export const orderTrackingIdValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),
];

export const updateOrderTrackingStatusValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string'),
];
