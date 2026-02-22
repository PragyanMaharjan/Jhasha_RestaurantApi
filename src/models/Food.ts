const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['starter', 'main_course', 'dessert', 'beverage', 'side_dish'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  preparationTime: {
    type: Number,
    default: 30
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot'],
    default: 'medium'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Food = mongoose.model('Food', foodSchema);
export default Food;
