import request from 'supertest';
import app from '../../app';
import Food from '../../models/Food';
import Order from '../../models/Order';
import User from '../../models/User';

describe('Food & Order Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testFood: any;
  let testUser: any;

  beforeEach(async () => {
    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmail.com',
        password: 'admin123',
      });
    adminToken = adminLoginRes.body.token;

    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
    });
    await testUser.save();

    // Login as user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });
    userToken = userLoginRes.body.token;

    // Create test food
    testFood = new Food({
      name: 'Test Pizza',
      description: 'Delicious test pizza',
      price: 15.99,
      category: 'main_course',
      image: 'test-image.jpg',
      isVegetarian: true,
      spiceLevel: 'mild',
    });
    await testFood.save();
  });

  describe('Food Management', () => {
    describe('GET /api/food', () => {
      it('should get all food items', async () => {
        const response = await request(app)
          .get('/api/food')
          .expect(200);

        expect(response.body.foods).toBeDefined();
        expect(Array.isArray(response.body.foods)).toBe(true);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get('/api/food?category=main_course')
          .expect(200);

        expect(response.body.foods.length).toBeGreaterThan(0);
        expect(response.body.foods[0].category).toBe('main_course');
      });

      it('should search food by name', async () => {
        const response = await request(app)
          .get('/api/food?search=Pizza')
          .expect(200);

        expect(response.body.foods.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/food/:id', () => {
      it('should get single food item', async () => {
        const response = await request(app)
          .get(`/api/food/${testFood._id}`)
          .expect(200);

        expect(response.body.food.name).toBe('Test Pizza');
      });

      it('should return 404 for non-existent food', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const response = await request(app)
          .get(`/api/food/${fakeId}`)
          .expect(404);
      });
    });

    describe('POST /api/food', () => {
      it('should create new food item as admin', async () => {
        const newFood = {
          name: 'New Burger',
          description: 'Tasty burger',
          price: 12.99,
          category: 'main_course',
          isVegetarian: false,
          spiceLevel: 'medium',
        };

        const response = await request(app)
          .post('/api/food')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('name', newFood.name)
          .field('description', newFood.description)
          .field('price', newFood.price.toString())
          .field('category', newFood.category)
          .field('isVegetarian', newFood.isVegetarian.toString())
          .field('spiceLevel', newFood.spiceLevel)
          .attach('image', Buffer.from('test'), 'test.jpg')
          .expect(201);

        expect(response.body.food.name).toBe(newFood.name);
      });

      it('should fail without admin token', async () => {
        const response = await request(app)
          .post('/api/food')
          .send({
            name: 'New Food',
            price: 10,
          })
          .expect(401);
      });
    });

    describe('PUT /api/food/:id', () => {
      it('should update food item as admin', async () => {
        const response = await request(app)
          .put(`/api/food/${testFood._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .field('name', 'Updated Pizza')
          .field('price', '19.99')
          .expect(200);

        expect(response.body.food.name).toBe('Updated Pizza');
        expect(response.body.food.price).toBe(19.99);
      });
    });

    describe('DELETE /api/food/:id', () => {
      it('should delete food item as admin', async () => {
        const response = await request(app)
          .delete(`/api/food/${testFood._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const deletedFood = await Food.findById(testFood._id);
        expect(deletedFood).toBeNull();
      });
    });
  });

  describe('Order Management', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = new Order({
        userId: testUser._id,
        items: [
          {
            foodId: testFood._id,
            quantity: 2,
            price: testFood.price,
          },
        ],
        totalAmount: testFood.price * 2 + 50 + (testFood.price * 2 * 0.05),
        deliveryAddress: '123 Test St',
        deliveryCity: 'Test City',
        deliveryZipCode: '12345',
        phoneNumber: '+1234567890',
        paymentMethod: 'cash_on_delivery',
        orderStatus: 'pending',
        paymentStatus: 'pending',
      });
      await testOrder.save();
    });

    describe('POST /api/orders', () => {
      it('should create a new order', async () => {
        const orderData = {
          items: [
            {
              foodId: testFood._id,
              quantity: 1,
              price: testFood.price,
            },
          ],
          totalAmount: testFood.price + 50 + (testFood.price * 0.05),
          deliveryAddress: '456 New St',
          deliveryCity: 'New City',
          deliveryZipCode: '54321',
          phoneNumber: '+1234567890',
          paymentMethod: 'cash_on_delivery',
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(orderData)
          .expect(201);

        expect(response.body.order).toBeDefined();
        expect(response.body.order.userId).toBe(testUser._id.toString());
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .post('/api/orders')
          .send({})
          .expect(401);
      });
    });

    describe('GET /api/orders/my-orders', () => {
      it('should get user orders', async () => {
        const response = await request(app)
          .get('/api/orders/my-orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.orders).toBeDefined();
        expect(Array.isArray(response.body.orders)).toBe(true);
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/api/orders/my-orders')
          .expect(401);
      });
    });

    describe('GET /api/orders/:id', () => {
      it('should get order by ID', async () => {
        const response = await request(app)
          .get(`/api/orders/${testOrder._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.order._id).toBe(testOrder._id.toString());
      });

      it('should return 404 for non-existent order', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const response = await request(app)
          .get(`/api/orders/${fakeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/orders/:id/status', () => {
      it('should update order status as admin', async () => {
        const response = await request(app)
          .put(`/api/orders/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderStatus: 'preparing' })
          .expect(200);

        expect(response.body.order.orderStatus).toBe('preparing');
      });

      it('should fail as regular user', async () => {
        const response = await request(app)
          .put(`/api/orders/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ orderStatus: 'preparing' })
          .expect(403);
      });
    });
  });
});
