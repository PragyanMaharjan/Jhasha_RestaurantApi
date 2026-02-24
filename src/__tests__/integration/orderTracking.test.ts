import request from 'supertest';
const app = require('../../app');
import Order from '../../models/Order';
import User from '../../models/User';
import Food from '../../models/Food';

describe('Order Tracking Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testOrder: any;
  let testUser: any;
  let testFood: any;

  beforeEach(async () => {
    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmail.com',
        password: 'admin123',
      });
    adminToken = adminLoginRes.body.token;

    // Create and login test user
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '+977-9845678901',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);
    userToken = registerRes.body.token;
    testUser = registerRes.body.user;

    // Create test food item
    testFood = new Food({
      name: 'Test Pizza',
      description: 'Delicious test pizza',
      category: 'main_course',
      price: 15.99,
      image: '/test-image.jpg',
      isAvailable: true,
    });
    await testFood.save();

    // Create test order
    testOrder = new Order({
      userId: testUser._id,
      customerId: testUser._id,
      items: [{
        foodId: testFood._id,
        quantity: 2,
        price: testFood.price,
      }],
      totalAmount: testFood.price * 2,
      deliveryAddress: '123 Test Street',
      deliveryCity: 'Test City',
      deliveryZipCode: '12345',
      phoneNumber: '+977-9845678901',
      paymentMethod: 'online',
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      status: 'Confirmed',
    });
    await testOrder.save();
  });

  describe('GET /api/order-tracking/order/:orderId', () => {
    it('should get order tracking details', async () => {
      const response = await request(app)
        .get(`/api/order-tracking/order/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.order).toBeDefined();
      expect(response.body.order._id).toBe(testOrder._id.toString());
      expect(response.body.order.orderStatus).toBe('confirmed');
      expect(response.body.order.statusHistory).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/order-tracking/order/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe('Order not found');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/order-tracking/order/${testOrder._id}`)
        .expect(401);
    });
  });

  describe('PUT /api/order-tracking/order/:orderId/status', () => {
    it('should update order status as admin', async () => {
      const response = await request(app)
        .put(`/api/order-tracking/order/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'preparing',
          notes: 'Order is being prepared',
        })
        .expect(200);

      expect(response.body.message).toContain('updated');
      expect(response.body.order.orderStatus).toBe('preparing');
    });

    it('should add status to history', async () => {
      await request(app)
        .put(`/api/order-tracking/order/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ready',
          notes: 'Order is ready for pickup',
        });

      const order = await Order.findById(testOrder._id);
      expect(order?.statusHistory.length).toBeGreaterThan(0);
      const latestStatus = order?.statusHistory[order.statusHistory.length - 1];
      expect(latestStatus?.status).toBe('ready');
      expect(latestStatus?.notes).toBe('Order is ready for pickup');
    });

    it('should fail as regular user', async () => {
      await request(app)
        .put(`/api/order-tracking/order/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'delivered',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .put(`/api/order-tracking/order/${testOrder._id}/status`)
        .send({
          status: 'delivered',
        })
        .expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/order-tracking/order/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered',
        })
        .expect(404);

      expect(response.body.message).toBe('Order not found');
    });
  });

  describe('GET /api/order-tracking/active-deliveries', () => {
    it('should get active deliveries as admin', async () => {
      const response = await request(app)
        .get('/api/order-tracking/active-deliveries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deliveries).toBeDefined();
      expect(Array.isArray(response.body.deliveries)).toBe(true);
    });

    it('should only show orders in delivery status', async () => {
      // Create order with out_for_delivery status
      const deliveryOrder = new Order({
        userId: testUser._id,
        customerId: testUser._id,
        items: [{
          foodId: testFood._id,
          quantity: 1,
          price: testFood.price,
        }],
        totalAmount: testFood.price,
        deliveryAddress: '456 Delivery St',
        deliveryCity: 'Test City',
        deliveryZipCode: '54321',
        phoneNumber: '+9876543210',
        paymentMethod: 'online',
        paymentStatus: 'completed',
        orderStatus: 'out_for_delivery',
        status: 'Out for Delivery',
      });
      await deliveryOrder.save();

      const response = await request(app)
        .get('/api/order-tracking/active-deliveries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deliveries.length).toBeGreaterThan(0);
      const activeDelivery = response.body.deliveries.find(
        (d: any) => d._id === deliveryOrder._id.toString()
      );
      expect(activeDelivery).toBeDefined();
      expect(activeDelivery.orderStatus).toBe('out_for_delivery');
    });

    it('should fail as regular user', async () => {
      await request(app)
        .get('/api/order-tracking/active-deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/order-tracking/active-deliveries')
        .expect(401);
    });
  });

  describe('Order Status Progression', () => {
    it('should track complete order lifecycle', async () => {
      const statuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

      for (const status of statuses) {
        await request(app)
          .put(`/api/order-tracking/order/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: status,
            notes: `Updating to ${status}`,
          })
          .expect(200);
      }

      const order = await Order.findById(testOrder._id);
      expect(order?.orderStatus).toBe('delivered');
      expect(order?.statusHistory.length).toBe(statuses.length);
    });
  });
});
