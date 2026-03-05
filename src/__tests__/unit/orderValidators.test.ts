import { validationResult } from 'express-validator';
import {
  createOrderValidation,
  updateOrderStatusValidation,
  orderIdValidation,
  createPaymentIntentValidation
} from '../../validators/orderValidators';

const validateRequest = async (validations: any[], body: any, params: any = {}) => {
  const req: any = { body, params };
  const res: any = {};
  
  for (const validation of validations) {
    await validation.run(req);
  }
  
  return validationResult(req);
};

describe('Order Validators', () => {
  const validMongoId = '507f1f77bcf86cd799439011';

  describe('createOrderValidation', () => {
    it('should pass with valid order data', async () => {
      const validData = {
        items: [
          { foodId: validMongoId, quantity: 2, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street, Apartment 4B',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678',
        paymentMethod: 'cash_on_delivery',
        notes: 'Please ring the doorbell'
      };

      const result = await validateRequest(createOrderValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when items array is empty', async () => {
      const invalidData = {
        items: [],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('at least one item'))).toBe(true);
    });

    it('should fail with invalid foodId in items', async () => {
      const invalidData = {
        items: [
          { foodId: 'invalid-id', quantity: 2, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Invalid food ID'))).toBe(true);
    });

    it('should fail when quantity is zero', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 0, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 1 and 50'))).toBe(true);
    });

    it('should fail when quantity exceeds 50', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 51, price: 250 }
        ],
        totalAmount: 5000,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 1 and 50'))).toBe(true);
    });

    it('should pass with multiple items', async () => {
      const validData = {
        items: [
          { foodId: validMongoId, quantity: 2, price: 250 },
          { foodId: '507f1f77bcf86cd799439012', quantity: 3, price: 300 }
        ],
        totalAmount: 1000,
        deliveryAddress: '456 Oak Avenue, Suite 10',
        deliveryCity: 'Lalitpur',
        deliveryZipCode: '44700',
        phoneNumber: '+977-9823456789'
      };

      const result = await validateRequest(createOrderValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when delivery address is too short', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: 'Short',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 10 and 200'))).toBe(true);
    });

    it('should fail when delivery city is missing', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('city is required'))).toBe(true);
    });

    it('should fail with invalid zip code format', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: 'ABCD',
        phoneNumber: '+977-9812345678'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('valid zip code'))).toBe(true);
    });

    it('should fail when phone number is missing', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Phone number is required'))).toBe(true);
    });

    it('should accept valid payment methods', async () => {
      const paymentMethods = ['online', 'cash_on_delivery'];

      for (const paymentMethod of paymentMethods) {
        const data = {
          items: [
            { foodId: validMongoId, quantity: 2, price: 250 }
          ],
          totalAmount: 500,
          deliveryAddress: '123 Main Street',
          deliveryCity: 'Kathmandu',
          deliveryZipCode: '44600',
          phoneNumber: '+977-9812345678',
          paymentMethod
        };
        const result = await validateRequest(createOrderValidation, data);
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should fail with invalid payment method', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678',
        paymentMethod: 'credit_card'
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Invalid payment method'))).toBe(true);
    });

    it('should accept optional notes', async () => {
      const validData = {
        items: [
          { foodId: validMongoId, quantity: 2, price: 250 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678',
        notes: 'Please call when you arrive'
      };

      const result = await validateRequest(createOrderValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when notes exceed 500 characters', async () => {
      const invalidData = {
        items: [
          { foodId: validMongoId, quantity: 2 }
        ],
        totalAmount: 500,
        deliveryAddress: '123 Main Street',
        deliveryCity: 'Kathmandu',
        deliveryZipCode: '44600',
        phoneNumber: '+977-9812345678',
        notes: 'A'.repeat(501)
      };

      const result = await validateRequest(createOrderValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('not exceed 500'))).toBe(true);
    });
  });

  describe('updateOrderStatusValidation', () => {
    it('should pass with valid status update', async () => {
      const validData = {
        orderStatus: 'confirmed'
      };

      const result = await validateRequest(updateOrderStatusValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid order ID', async () => {
      const validData = {
        orderStatus: 'confirmed'
      };

      const result = await validateRequest(updateOrderStatusValidation, validData, { id: 'invalid-id' });
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid order ID');
    });

    it('should accept all valid order statuses', async () => {
      const statuses = [
        'placed', 'confirmed', 'preparing', 'ready', 
        'out_for_delivery', 'delivered', 'cancelled'
      ];

      for (const orderStatus of statuses) {
        const data = { orderStatus };
        const result = await validateRequest(updateOrderStatusValidation, data, { id: validMongoId });
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should fail with invalid order status', async () => {
      const invalidData = {
        orderStatus: 'shipped'
      };

      const result = await validateRequest(updateOrderStatusValidation, invalidData, { id: validMongoId });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Invalid order status'))).toBe(true);
    });

    it('should fail when order status is missing', async () => {
      const invalidData = {};

      const result = await validateRequest(updateOrderStatusValidation, invalidData, { id: validMongoId });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('status is required'))).toBe(true);
    });
  });

  describe('orderIdValidation', () => {
    it('should pass with valid MongoDB ID', async () => {
      const result = await validateRequest(orderIdValidation, {}, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid MongoDB ID', async () => {
      const result = await validateRequest(orderIdValidation, {}, { id: 'invalid-id-123' });
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid order ID');
    });

    it('should fail with empty ID', async () => {
      const result = await validateRequest(orderIdValidation, {}, { id: '' });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('createPaymentIntentValidation', () => {
    it('should pass with valid payment intent data', async () => {
      const validData = {
        orderId: validMongoId,
        amount: 1500
      };

      const result = await validateRequest(createPaymentIntentValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid order ID', async () => {
      const invalidData = {
        orderId: 'invalid-id',
        amount: 1500
      };

      const result = await validateRequest(createPaymentIntentValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid order ID');
    });

    it('should fail with negative amount', async () => {
      const invalidData = {
        orderId: validMongoId,
        amount: -100
      };

      const result = await validateRequest(createPaymentIntentValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('positive number'))).toBe(true);
    });

    it('should accept zero amount', async () => {
      const validData = {
        orderId: validMongoId,
        amount: 0
      };

      const result = await validateRequest(createPaymentIntentValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept decimal amounts', async () => {
      const validData = {
        orderId: validMongoId,
        amount: 1234.56
      };

      const result = await validateRequest(createPaymentIntentValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });
  });
});
