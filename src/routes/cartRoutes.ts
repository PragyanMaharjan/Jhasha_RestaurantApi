const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', verifyToken, getCart);
router.post('/', verifyToken, addToCart);
router.put('/:itemId', verifyToken, updateCartItem);
router.delete('/:itemId', verifyToken, removeFromCart);
router.delete('/', verifyToken, clearCart);

module.exports = router;

export {};
