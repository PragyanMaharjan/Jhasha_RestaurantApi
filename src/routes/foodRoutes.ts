const express = require('express');
const { getAllFood, getFoodById, addFood, updateFood, deleteFood } = require('../controllers/foodController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
import { validate } from '../middleware/validate';
import {
  addFoodValidation,
  updateFoodValidation,
  foodIdValidation,
  foodQueryValidation
} from '../validators/foodValidators';

const router = express.Router();

router.get('/', foodQueryValidation, validate, getAllFood);
router.get('/:id', foodIdValidation, validate, getFoodById);
router.post('/', verifyToken, verifyAdmin, upload.single('image'), addFoodValidation, validate, addFood);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), updateFoodValidation, validate, updateFood);
router.delete('/:id', verifyToken, verifyAdmin, foodIdValidation, validate, deleteFood);

module.exports = router;

export {};
