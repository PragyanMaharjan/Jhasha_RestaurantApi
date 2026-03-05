const jwt = require('jsonwebtoken');
const cryptoModule = require('crypto');
const helpers = require('../../utils/helpers');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('nodemailer');

describe('Helpers Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '24h';
  });

  describe('generateToken', () => {
    it('should generate a token with userId and role', () => {
      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = helpers.generateToken('user123', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: 'user' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe(mockToken);
    });

    it('should generate token for admin role', () => {
      const mockToken = 'admin-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = helpers.generateToken('admin123', 'admin');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'admin123', role: 'admin' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe(mockToken);
    });

    it('should use custom JWT_EXPIRE if provided', () => {
      process.env.JWT_EXPIRE = '7d';
      const mockToken = 'long-lived-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      helpers.generateToken('user123', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: 'user' },
        'test-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle numeric userId', () => {
      const mockToken = 'numeric-user-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = helpers.generateToken(12345, 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 12345, role: 'user' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe(mockToken);
    });

    it('should generate different tokens for different users', () => {
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2');

      const token1 = helpers.generateToken('user1', 'user');
      const token2 = helpers.generateToken('user2', 'user');

      expect(token1).toBe('token1');
      expect(token2).toBe('token2');
    });
  });

  describe('generateResetToken', () => {
    it('should generate a random reset token', () => {
      const mockBytes = Buffer.from('mockedrandomdata');
      const mockHex = mockBytes.toString('hex');
      
      (cryptoModule.randomBytes as jest.Mock).mockReturnValue(mockBytes);

      const token = helpers.generateResetToken();

      expect(cryptoModule.randomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe(mockHex);
    });

    it('should generate 64 character hex string', () => {
      const mockBytes = Buffer.alloc(32);
      for (let i = 0; i < 32; i++) {
        mockBytes[i] = i;
      }
      
      (cryptoModule.randomBytes as jest.Mock).mockReturnValue(mockBytes);

      const token = helpers.generateResetToken();

      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens on multiple calls', () => {
      const mockBytes1 = Buffer.from('randomdata1');
      const mockBytes2 = Buffer.from('randomdata2');
      
      (cryptoModule.randomBytes as jest.Mock)
        .mockReturnValueOnce(mockBytes1)
        .mockReturnValueOnce(mockBytes2);

      const token1 = helpers.generateResetToken();
      const token2 = helpers.generateResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('sendEmail', () => {
    let mockTransporter: any;
    let nodemailer: any;

    beforeEach(() => {
      nodemailer = require('nodemailer');
      mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
      };
      nodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);

      process.env.EMAIL_HOST = 'smtp.example.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASSWORD = 'test-password';
    });

    it('should send email with correct parameters', async () => {
      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const htmlContent = '<p>Test content</p>';

      await helpers.sendEmail(to, subject, htmlContent);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: '587',
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password'
        }
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      });
    });

    it('should return sendMail result', async () => {
      const mockResult = { messageId: 'test-message-id-123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await helpers.sendEmail(
        'user@example.com',
        'Welcome',
        '<h1>Welcome</h1>'
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        helpers.sendEmail('user@example.com', 'Test', '<p>Test</p>')
      ).rejects.toThrow('SMTP connection failed');
    });

    it('should send password reset email', async () => {
      const resetLink = 'https://example.com/reset?token=abc123';
      const htmlContent = `<p>Click <a href="${resetLink}">here</a> to reset</p>`;

      await helpers.sendEmail(
        'user@example.com',
        'Password Reset',
        htmlContent
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Password Reset',
          to: 'user@example.com'
        })
      );
    });

    it('should send verification email', async () => {
      await helpers.sendEmail(
        'newuser@example.com',
        'Email Verification',
        '<p>Verify your email</p>'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Email Verification'
        })
      );
    });

    it('should handle multiple recipients', async () => {
      const recipients = 'user1@example.com, user2@example.com';

      await helpers.sendEmail(
        recipients,
        'Bulk Email',
        '<p>Message</p>'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipients
        })
      );
    });
  });
});
