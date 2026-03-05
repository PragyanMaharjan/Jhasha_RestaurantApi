import { NextFunction, Request, Response } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors || {}).map((e: any) => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format' 
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists` 
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

export {};
