import { body, param, query } from 'express-validator';

/**
 * Validation rules for user query parameters
 */
export const getUsersQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
];

/**
 * Validation rules for user ID parameter
 */
export const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
];

/**
 * Validation rules for updating user status
 */
export const updateUserStatusValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation rules for updating user (admin)
 */
export const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('zipCode')
    .optional()
    .trim()
    .matches(/^[0-9]{4,10}$/)
    .withMessage('Please provide a valid zip code')
];
