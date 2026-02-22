import { body, param, query } from 'express-validator';

/**
 * Validation rules for adding food
 */
export const addFoodValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Food name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Food name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['starter', 'main_course', 'dessert', 'beverage', 'side_dish'])
    .withMessage('Invalid category'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Preparation time must be between 1 and 300 minutes'),
  
  body('isVegetarian')
    .optional()
    .isBoolean()
    .withMessage('isVegetarian must be a boolean value'),
  
  body('spiceLevel')
    .optional()
    .isIn(['mild', 'medium', 'hot'])
    .withMessage('Spice level must be mild, medium, or hot')
];

/**
 * Validation rules for updating food
 */
export const updateFoodValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid food ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Food name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .optional()
    .isIn(['starter', 'main_course', 'dessert', 'beverage', 'side_dish'])
    .withMessage('Invalid category'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Preparation time must be between 1 and 300 minutes'),
  
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean value'),
  
  body('isVegetarian')
    .optional()
    .isBoolean()
    .withMessage('isVegetarian must be a boolean value'),
  
  body('spiceLevel')
    .optional()
    .isIn(['mild', 'medium', 'hot'])
    .withMessage('Spice level must be mild, medium, or hot')
];

/**
 * Validation rules for food ID parameter
 */
export const foodIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid food ID')
];

/**
 * Validation rules for food query parameters
 */
export const foodQueryValidation = [
  query('category')
    .optional()
    .isIn(['starter', 'main_course', 'dessert', 'beverage', 'side_dish'])
    .withMessage('Invalid category'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
];
