import request from 'supertest';
import app from '../../app';
import User from '../../models/User';

describe('User Management Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testUser: any;

  beforeEach(async () => {
    // Create admin token (using hardcoded admin)
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmail.com',
        password: 'admin123',
      });
    adminToken = adminLoginRes.body.token;

    // Create a test user
    testUser = new User({
      name: 'Test User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
      role: 'user',
    });
    await testUser.save();

    // Login as test user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });
    userToken = userLoginRes.body.token;
  });

  describe('GET /api/admin/users', () => {
    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pages');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].name).toContain('Test');
    });

    it('should fail without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);
    });

    it('should fail with user token (not admin)', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('email', 'user@example.com');
      expect(response.body).toHaveProperty('ordersCount');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/admin/users/status', () => {
    it('should update user status', async () => {
      const response = await request(app)
        .put('/api/admin/users/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUser._id,
          isActive: false,
        })
        .expect(200);

      expect(response.body.user.isActive).toBe(false);
    });

    it('should fail without admin token', async () => {
      const response = await request(app)
        .put('/api/admin/users/status')
        .send({
          userId: testUser._id,
          isActive: false,
        })
        .expect(401);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user information', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+9876543210',
        })
        .expect(200);

      expect(response.body.user.name).toBe('Updated Name');
      expect(response.body.user.email).toBe('updated@example.com');
    });

    it('should fail with duplicate email', async () => {
      // Create another user
      await User.create({
        name: 'Another User',
        email: 'another@example.com',
        phone: '+1111111111',
        password: 'password123',
      });

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'another@example.com',
          phone: '+1234567890',
        })
        .expect(400);

      expect(response.body.message).toContain('already in use');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should fail to delete admin account', async () => {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'admin',
      });

      const response = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.message).toContain('Cannot delete admin');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
