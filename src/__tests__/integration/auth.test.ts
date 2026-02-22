import request from 'supertest';
import app from '../../app';
import User from '../../models/User';
const crypto = require('crypto');

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail if passwords do not match', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
        confirmPassword: 'different',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('do not match');
    });

    it('should fail if email is already registered', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
        confirmPassword: 'password123',
      };

      await User.create({
        ...userData,
        password: 'hashedPassword',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already registered');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
      });
      await user.save();
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should login admin with hardcoded credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@gmail.com',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.user.role).toBe('admin');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
      });
      await user.save();
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toContain('sent');

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.resetPasswordToken).toBeDefined();
      expect(user?.resetPasswordExpire).toBeDefined();
    });

    it('should return success even for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'notfound@example.com' })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;
    let user: any;

    beforeEach(async () => {
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'oldpassword',
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: new Date(Date.now() + 60 * 60 * 1000),
      });
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.message).toContain('reset');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpire).toBeUndefined();
    });

    it('should fail if passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'different',
        })
        .expect(400);

      expect(response.body.message).toContain('do not match');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: 'invalidtoken',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with expired token', async () => {
      const expiredUser = await User.findById(user._id);
      if (expiredUser) {
        expiredUser.resetPasswordExpire = new Date(Date.now() - 1000);
        await expiredUser.save();
      }

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.message).toContain('expired');
    });
  });
});
