const jwt = require('jsonwebtoken');
const { verifyToken, verifyAdmin, requireRole } = require('../../middleware/auth');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: null
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify valid token and call next', () => {
      const mockDecoded = { userId: '123', role: 'user' };
      mockRequest.headers.authorization = 'Bearer valid-token';
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockDecoded);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', () => {
      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No token provided' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers.authorization = '';

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No token provided' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers.authorization = 'Bearer invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Invalid token' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      mockRequest.headers.authorization = 'Bearer expired-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Invalid token' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      mockRequest.headers.authorization = 'InvalidFormat';

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should verify admin token', () => {
      const mockDecoded = { userId: 'admin123', role: 'admin' };
      mockRequest.headers.authorization = 'Bearer admin-token';
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockRequest.user.role).toBe('admin');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should attach decoded user data to request', () => {
      const mockDecoded = { 
        userId: 'user456', 
        role: 'user', 
        email: 'test@example.com' 
      };
      mockRequest.headers.authorization = 'Bearer user-token';
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      verifyToken(mockRequest, mockResponse, nextFunction);

      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockRequest.user.email).toBe('test@example.com');
    });
  });

  describe('verifyAdmin', () => {
    it('should call next for admin user', () => {
      mockRequest.user = { userId: '123', role: 'admin' };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin user', () => {
      mockRequest.user = { userId: '123', role: 'user' };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Admin access required' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 for employee role', () => {
      mockRequest.user = { userId: '123', role: 'employee' };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 for customer role', () => {
      mockRequest.user = { userId: '123', role: 'customer' };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when role is undefined', () => {
      mockRequest.user = { userId: '123' };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when role is null', () => {
      mockRequest.user = { userId: '123', role: null };

      verifyAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRole', () => {
    it('should allow user with correct single role', () => {
      mockRequest.user = { userId: '123', role: 'admin' };
      const middleware = requireRole(['admin']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow user with one of multiple allowed roles', () => {
      mockRequest.user = { userId: '123', role: 'employee' };
      const middleware = requireRole(['admin', 'employee']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny user without correct role', () => {
      mockRequest.user = { userId: '123', role: 'user' };
      const middleware = requireRole(['admin']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny when user is not defined', () => {
      mockRequest.user = null;
      const middleware = requireRole(['admin']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny when user role is not in allowed roles', () => {
      mockRequest.user = { userId: '123', role: 'customer' };
      const middleware = requireRole(['admin', 'employee']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle empty allowed roles array', () => {
      mockRequest.user = { userId: '123', role: 'admin' };
      const middleware = requireRole([]);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for role matching', () => {
      mockRequest.user = { userId: '123', role: 'Admin' };
      const middleware = requireRole(['admin']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should allow admin in admin-only middleware', () => {
      mockRequest.user = { userId: 'admin1', role: 'admin' };
      const middleware = requireRole(['admin']);

      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should create reusable middleware function', () => {
      const adminOrEmployee = requireRole(['admin', 'employee']);
      
      mockRequest.user = { userId: '1', role: 'admin' };
      adminOrEmployee(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      nextFunction.mockClear();
      mockRequest.user = { userId: '2', role: 'employee' };
      adminOrEmployee(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });
});
