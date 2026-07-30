import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/User';

describe('Frontend compatibility APIs', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.MONGODB_URI;
  });

  it('should return demo products from /api/products without a database connection', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.products.length).toBeGreaterThan(0);
  });

  it('should return the authenticated user profile from /api/auth/me', async () => {
    const user = await User.create({
      name: 'Compatibility User',
      email: 'compat@example.com',
      phone: '123456789',
      password: 'password123',
    });

    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: '1h',
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('compat@example.com');
  });

  it('should serve products from /api/products for the storefront', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
  });
});
