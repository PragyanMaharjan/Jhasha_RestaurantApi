import { validationResult } from 'express-validator';
import {
  addFoodValidation,
  updateFoodValidation
} from '../../validators/foodValidators';

const validateRequest = async (validations: any[], body: any, params: any = {}) => {
  const req: any = { body, params };
  const res: any = {};
  
  for (const validation of validations) {
    await validation.run(req);
  }
  
  return validationResult(req);
};

describe('Food Validators', () => {
  describe('addFoodValidation', () => {
    it('should pass with valid food data', async () => {
      const validData = {
        name: 'Chicken Curry',
        description: 'Delicious chicken curry with spices and herbs',
        category: 'main_course',
        price: 250,
        preparationTime: 30,
        isVegetarian: false,
        spiceLevel: 'medium'
      };

      const result = await validateRequest(addFoodValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when name is missing', async () => {
      const invalidData = {
        description: 'Delicious dish',
        category: 'main_course',
        price: 250
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Food name is required');
    });

    it('should fail when description is too short', async () => {
      const invalidData = {
        name: 'Pizza',
        description: 'Good',
        category: 'main_course',
        price: 250
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 10 and 500'))).toBe(true);
    });

    it('should fail with invalid category', async () => {
      const invalidData = {
        name: 'Pizza',
        description: 'Delicious pizza with cheese and toppings',
        category: 'invalid_category',
        price: 250
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Invalid category'))).toBe(true);
    });

    it('should accept all valid categories', async () => {
      const categories = ['starter', 'main_course', 'dessert', 'beverage', 'side_dish'];

      for (const category of categories) {
        const data = {
          name: 'Test Food',
          description: 'Test food description for validation',
          category,
          price: 100
        };
        const result = await validateRequest(addFoodValidation, data);
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should fail with negative price', async () => {
      const invalidData = {
        name: 'Pizza',
        description: 'Delicious pizza with cheese',
        category: 'main_course',
        price: -50
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('positive number'))).toBe(true);
    });

    it('should accept zero price', async () => {
      const validData = {
        name: 'Free Sample',
        description: 'Free food sample for customers',
        category: 'starter',
        price: 0
      };

      const result = await validateRequest(addFoodValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when preparation time exceeds limit', async () => {
      const invalidData = {
        name: 'Slow Cooked Dish',
        description: 'Very slowly cooked special dish',
        category: 'main_course',
        price: 500,
        preparationTime: 400
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 1 and 300'))).toBe(true);
    });

    it('should accept valid spice levels', async () => {
      const spiceLevels = ['mild', 'medium', 'hot'];

      for (const spiceLevel of spiceLevels) {
        const data = {
          name: 'Spicy Dish',
          description: 'Spicy food with various spice levels',
          category: 'main_course',
          price: 200,
          spiceLevel
        };
        const result = await validateRequest(addFoodValidation, data);
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should fail with invalid spice level', async () => {
      const invalidData = {
        name: 'Curry',
        description: 'Spicy curry with vegetables',
        category: 'main_course',
        price: 200,
        spiceLevel: 'super_hot'
      };

      const result = await validateRequest(addFoodValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('mild, medium, or hot'))).toBe(true);
    });

    it('should accept optional fields as undefined', async () => {
      const validData = {
        name: 'Simple Dish',
        description: 'A simple dish without extra options',
        category: 'main_course',
        price: 150
        // preparationTime, isVegetarian, spiceLevel not provided
      };

      const result = await validateRequest(addFoodValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('updateFoodValidation', () => {
    const validMongoId = '507f1f77bcf86cd799439011';

    it('should pass with valid update data', async () => {
      const validData = {
        name: 'Updated Food Name',
        price: 300,
        isAvailable: true
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid MongoDB ID', async () => {
      const validData = {
        name: 'Updated Food'
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: 'invalid-id' });
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid food ID');
    });

    it('should pass with partial update', async () => {
      const validData = {
        price: 350
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with empty body (no updates)', async () => {
      const result = await validateRequest(updateFoodValidation, {}, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid name length', async () => {
      const invalidData = {
        name: 'A'
      };

      const result = await validateRequest(updateFoodValidation, invalidData, { id: validMongoId });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 2 and 100'))).toBe(true);
    });

    it('should fail with invalid category', async () => {
      const invalidData = {
        category: 'snacks'
      };

      const result = await validateRequest(updateFoodValidation, invalidData, { id: validMongoId });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('Invalid category'))).toBe(true);
    });

    it('should accept isAvailable boolean', async () => {
      const validData = {
        isAvailable: false
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should accept isVegetarian boolean', async () => {
      const validData = {
        isVegetarian: true
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const validData = {
        name: 'Special Dish',
        description: 'Updated description for the special dish',
        price: 450,
        preparationTime: 45,
        isAvailable: true,
        isVegetarian: false,
        spiceLevel: 'hot'
      };

      const result = await validateRequest(updateFoodValidation, validData, { id: validMongoId });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with preparation time out of range', async () => {
      const invalidData = {
        preparationTime: 0
      };

      const result = await validateRequest(updateFoodValidation, invalidData, { id: validMongoId });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e: any) => e.msg.includes('between 1 and 300'))).toBe(true);
    });
  });
});
