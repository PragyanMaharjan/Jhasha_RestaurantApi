import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
const errorHandler = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let err: any, req: any, res: any, next: any;

  beforeEach(() => {
    err = new Error('Test error');
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('should be a middleware function', () => {
    expect(typeof errorHandler).toBe('function');
  });

  test('should handle generic errors', () => {
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should return 500 status for generic errors', () => {
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('should return error message in response', () => {
    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0]?.[0];
    expect(jsonCall).toHaveProperty('message');
  });

  test('should handle ValidationError type errors', () => {
    err.name = 'ValidationError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should handle CastError type errors', () => {
    err.name = 'CastError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should handle errors with status property', () => {
    err.status = 404;
    err.message = 'Not Found';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should return 500 status for unknown status', () => {
    err.status = undefined;
    err.message = 'Test error';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('should handle duplicate key errors', () => {
    err.code = 11000;
    err.keyValue = { email: 'test@example.com' };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should handle JWT errors', () => {
    err.name = 'JsonWebTokenError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should handle JWT expiration errors', () => {
    err.name = 'TokenExpiredError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should handle errors with custom message', () => {
    err.message = 'Custom error message';

    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0]?.[0];
    expect(jsonCall.message).toBe('Custom error message');
  });

  test('should include success: false in response', () => {
    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0]?.[0];
    expect(jsonCall).toHaveProperty('success', false);
  });

  test('should handle error with response when called', () => {
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('should return JSON response with message', () => {
    err.message = 'Test error message';

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalled();
    const jsonCall = res.json.mock.calls[0]?.[0];
    expect(jsonCall).toHaveProperty('message');
  });

  test('should handle errors with undefined message', () => {
    err.message = undefined;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
  });

  test('should set default status to 500 when no status provided', () => {
    err.status = undefined;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('should handle errors with details property', () => {
    err.details = { field: 'email', issue: 'already exists' };

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  test('should handle validation field errors', () => {
    err.errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Too short' }
    ];

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
  });

  test('should not call next middleware', () => {
    errorHandler(err, req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  test('should handle multiple errors', () => {
    errorHandler(err, req, res, next);

    err = new Error('Another error');
    res.status.mockClear();
    res.json.mockClear();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
  });

  test('should handle errors with stack trace in development', () => {
    process.env.NODE_ENV = 'development';

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalled();

    delete process.env.NODE_ENV;
  });

  test('should handle authorization errors', () => {
    err.message = 'Unauthorized';
    err.status = 401;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should handle access denied errors', () => {
    err.message = 'Access Denied';
    err.status = 403;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should handle not found errors', () => {
    err.message = 'Resource not found';
    err.status = 404;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should handle conflict errors', () => {
    err.message = 'Resource conflict';
    err.status = 409;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('should handle server errors', () => {
    err.message = 'Internal server error';
    err.status = 500;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
