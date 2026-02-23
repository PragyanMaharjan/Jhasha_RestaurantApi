import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 * Checks for validation errors and returns 400 with error details if found
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return the first error message instead of generic "Validation failed"
    const firstError = errors.array()[0];
    return res.status(400).json({
      message: firstError.msg
    });
  }
  
  next();
};
