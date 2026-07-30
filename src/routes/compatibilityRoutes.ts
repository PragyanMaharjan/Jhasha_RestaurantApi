const express = require('express');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Food = require('../models/Food');

const router = express.Router();

const demoProducts = [
  {
    _id: 'demo-product-1',
    name: 'Classic Burger',
    description: 'Grilled beef burger with lettuce and tomato.',
    price: 12.5,
    category: 'main_course',
    image: '/uploads/demo-burger.jpg',
  },
  {
    _id: 'demo-product-2',
    name: 'Garden Salad',
    description: 'Fresh greens with feta and olive dressing.',
    price: 8.5,
    category: 'starter',
    image: '/uploads/demo-salad.jpg',
  },
  {
    _id: 'demo-product-3',
    name: 'Chocolate Lava Cake',
    description: 'Warm cake with molten chocolate center.',
    price: 6.5,
    category: 'dessert',
    image: '/uploads/demo-cake.jpg',
  },
];

const canUseDatabase = () => {
  return Boolean(process.env.MONGODB_URI) && mongoose.connection.readyState === 1;
};

const getDemoProductList = (query: any = {}) => {
  let products = [...demoProducts];
  if (query.category) {
    products = products.filter((product: any) => product.category === query.category);
  }
  if (query.$or) {
    const searchValue = query.$or
      .find((condition: any) => condition.name || condition.description)
      ?.name?.$regex || query.$or.find((condition: any) => condition.description)?.description?.$regex;
    if (searchValue) {
      const normalized = searchValue.toString().replace(/[.*+?^${}()|[\]\\]/g, '');
      products = products.filter((product: any) => {
        const haystack = `${product.name} ${product.description}`.toLowerCase();
        return haystack.includes(normalized.toLowerCase());
      });
    }
  }
  return products;
};

router.get('/categories', async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      categories: [
        { name: 'Starter', slug: 'starter' },
        { name: 'Main Course', slug: 'main_course' },
        { name: 'Dessert', slug: 'dessert' },
        { name: 'Beverage', slug: 'beverage' },
        { name: 'Side Dish', slug: 'side_dish' },
      ],
    },
  });
});

router.get('/products', async (req, res) => {
  const { category, search } = req.query;
  const query: any = {};
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (!canUseDatabase()) {
    return res.status(200).json({ success: true, data: { products: getDemoProductList(query) } });
  }

  const products = await Food.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { products } });
});

router.get('/products/:id', async (req, res) => {
  if (!canUseDatabase()) {
    const product = demoProducts.find((item: any) => item._id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: { product } });
  }

  const product = await Food.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.status(200).json({ success: true, data: { product } });
});

router.get('/auth/me', verifyToken, async (req, res) => {
  if (!canUseDatabase()) {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user?.userId || 'demo-user-id',
        name: req.user?.role === 'admin' ? 'Admin' : 'Demo User',
        email: req.user?.role === 'admin' ? 'admin@gmail.com' : 'demo@example.com',
        role: req.user?.role || 'customer',
      },
    });
  }

  if (req.user.userId === 'admin-id') {
    return res.status(200).json({ success: true, user: { _id: 'admin-id', name: 'Admin', email: 'admin@gmail.com', role: 'admin' } });
  }

  const user = await User.findById(req.user.userId).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user: user.toJSON() });
});

router.put('/users/profile', verifyToken, async (req, res) => {
  if (!canUseDatabase()) {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user?.userId || 'demo-user-id',
        name: req.body.name || 'Demo User',
        phone: req.body.phone || '',
        address: req.body.address || '',
        city: req.body.city || '',
        zipCode: req.body.zipCode || '',
        role: req.user?.role || 'customer',
      },
    });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) user.phone = req.body.phone;
  if (req.body.address) user.address = req.body.address;
  if (req.body.city) user.city = req.body.city;
  if (req.body.zipCode) user.zipCode = req.body.zipCode;
  await user.save();
  res.status(200).json({ success: true, user: user.toJSON() });
});

router.put('/users/password', verifyToken, async (req, res) => {
  if (!canUseDatabase()) {
    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const { currentPassword, newPassword } = req.body;
  const isPasswordValid = await user.matchPassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

router.post('/users/2fa/setup', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, data: { secret: 'demo-secret', qrCodeUrl: '' } });
});

router.post('/users/2fa/enable', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, message: '2FA enabled' });
});

router.post('/users/2fa/disable', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, message: '2FA disabled' });
});

router.post('/orders/prepare', verifyToken, async (req, res, next) => {
  if (canUseDatabase()) {
    return next();
  }
  res.status(200).json({ success: true, order: { _id: 'demo-order', status: 'prepared' } });
});

router.get('/orders', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, orders: [] });
});

router.get('/orders/:id', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, order: { _id: req.params.id, status: 'pending' } });
});

router.post('/orders/verify-coupon', verifyToken, async (req, res, next) => {
  if (canUseDatabase()) {
    return next();
  }
  res.status(200).json({ success: true, data: { code: req.body.couponCode, discount: 0, newTotal: req.body.cartTotal || 0 } });
});

router.put('/orders/:id/cancel', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, message: 'Order cancelled' });
});

router.post('/payments/esewa/initiate', verifyToken, async (req, res, next) => {
  if (canUseDatabase()) {
    return next();
  }
  res.status(200).json({ success: true, data: { esewaUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form', formData: { amount: '100' } } });
});

router.get('/payments/verify/:orderId', verifyToken, async (req, res, next) => {
  if (canUseDatabase()) {
    return next();
  }
  res.status(200).json({ success: true, data: { paymentStatus: 'completed', orderStatus: 'confirmed' } });
});

router.get('/tracking/active-deliveries', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, deliveries: [] });
});

router.get('/tracking/order/:orderId', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, tracking: { orderId: req.params.orderId, status: 'pending' } });
});

router.put('/tracking/order/:orderId/status', verifyToken, async (req, res) => {
  res.status(200).json({ success: true, message: 'Tracking updated' });
});

module.exports = router;

export {};
