import { validationResult } from 'express-validator';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation
} from '../../validators/authValidators';

const validateRequest = async (validations: any[], body: any) => {
  const req: any = { body };
  const res: any = {};
  
  for (const validation of validations) {
    await validation.run(req);
  }
  
  return validationResult(req);
};

describe('Auth Validators', () => {
  describe('registerValidation', () => {
    it('should pass with valid registration data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when name is missing', async () => {
      const invalidData = {
        email: 'john@example.com',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Name is required');
    });

    it('should fail when name is too short', async () => {
      const invalidData = {
        name: 'A',
        email: 'john@example.com',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 2 and 50 characters');
    });

    it('should fail when email is invalid', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('valid email'))).toBe(true);
    });

    it('should fail when phone number is invalid', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Nepal phone number'))).toBe(true);
    });

    it('should fail when password is too short', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+977-9812345678',
        password: '12345',
        confirmPassword: '12345'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('at least 6 characters'))).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'DifferentPassword'
      };

      const result = await validateRequest(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('do not match'))).toBe(true);
    });

    it('should accept Nepal phone with spaces', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+977 9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should trim whitespace from name and email', async () => {
      const dataWithSpaces = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        phone: '+977-9812345678',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const result = await validateRequest(registerValidation, dataWithSpaces);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('loginValidation', () => {
    it('should pass with valid login credentials', async () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const result = await validateRequest(loginValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when email is missing', async () => {
      const invalidData = {
        password: 'password123'
      };

      const result = await validateRequest(loginValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Email is required');
    });

    it('should fail when password is missing', async () => {
      const invalidData = {
        email: 'user@example.com'
      };

      const result = await validateRequest(loginValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Password is required'))).toBe(true);
    });

    it('should fail with invalid email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      };

      const result = await validateRequest(loginValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('valid email'))).toBe(true);
    });
  });

  describe('forgotPasswordValidation', () => {
    it('should pass with valid email', async () => {
      const validData = {
        email: 'user@example.com'
      };

      const result = await validateRequest(forgotPasswordValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when email is missing', async () => {
      const invalidData = {};

      const result = await validateRequest(forgotPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Email is required');
    });

    it('should fail with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email'
      };

      const result = await validateRequest(forgotPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('valid email');
    });

    it('should trim whitespace from email', async () => {
      const dataWithSpaces = {
        email: '  user@example.com  '
      };

      const result = await validateRequest(forgotPasswordValidation, dataWithSpaces);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('resetPasswordValidation', () => {
    it('should pass with valid reset data', async () => {
      const validData = {
        resetToken: 'valid-reset-token-123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      const result = await validateRequest(resetPasswordValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when reset token is missing', async () => {
      const invalidData = {
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      const result = await validateRequest(resetPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Reset token is required'))).toBe(true);
    });

    it('should fail when new password is too short', async () => {
      const invalidData = {
        resetToken: 'valid-token',
        newPassword: '12345',
        confirmPassword: '12345'
      };

      const result = await validateRequest(resetPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('at least 6 characters'))).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const invalidData = {
        resetToken: 'valid-token',
        newPassword: 'Password123',
        confirmPassword: 'DifferentPassword'
      };

      const result = await validateRequest(resetPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('do not match'))).toBe(true);
    });

    it('should fail when confirmPassword is missing', async () => {
      const invalidData = {
        resetToken: 'valid-token',
        newPassword: 'Password123'
      };

      const result = await validateRequest(resetPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('confirm your password'))).toBe(true);
    });
  });

  describe('updateProfileValidation', () => {
    it('should pass with valid profile update data', async () => {
      const validData = {
        name: 'Updated Name',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Kathmandu',
        zipCode: '44600'
      };

      const result = await validateRequest(updateProfileValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with partial data (optional fields)', async () => {
      const validData = {
        name: 'Updated Name'
      };

      const result = await validateRequest(updateProfileValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with empty body (all optional)', async () => {
      const validData = {};

      const result = await validateRequest(updateProfileValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when name is too short', async () => {
      const invalidData = {
        name: 'A'
      };

      const result = await validateRequest(updateProfileValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 2 and 50 characters');
    });

    it('should fail when phone is invalid', async () => {
      const invalidData = {
        phone: 'invalid-phone'
      };

      const result = await validateRequest(updateProfileValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('valid phone number');
    });

    it('should fail when address is too long', async () => {
      const invalidData = {
        address: 'A'.repeat(201)
      };

      const result = await validateRequest(updateProfileValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('not exceed 200 characters');
    });

    it('should fail when city is too long', async () => {
      const invalidData = {
        city: 'A'.repeat(51)
      };

      const result = await validateRequest(updateProfileValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('not exceed 50 characters');
    });

    it('should fail when zipCode is invalid', async () => {
      const invalidData = {
        zipCode: 'ABC123'
      };

      const result = await validateRequest(updateProfileValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('valid zip code');
    });

    it('should accept various phone formats', async () => {
      const validFormats = [
        '+1234567890',
        '(123)456-7890',
        '123-456-7890',
        '1234567890'
      ];

      for (const phone of validFormats) {
        const data = { phone };
        const result = await validateRequest(updateProfileValidation, data);
        expect(result.isEmpty()).toBe(true);
      }
    });
  });
});
