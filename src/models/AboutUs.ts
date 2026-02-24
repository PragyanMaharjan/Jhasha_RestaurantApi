const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'About Jhasha Restaurant'
  },
  description: {
    type: String,
    required: true,
    default: 'Welcome to Jhasha Restaurant, Nepal\'s premier destination for authentic Nepali cuisine.'
  },
  story: {
    type: String,
    required: true,
    default: 'Established in the heart of Kathmandu, Jhasha Restaurant has been serving delicious traditional Nepali food with a modern twist since 2020.'
  },
  mission: {
    type: String,
    default: 'To bring the authentic taste of Nepal to every home while maintaining the highest quality standards and exceptional customer service.'
  },
  vision: {
    type: String,
    default: 'To become Nepal\'s most trusted and loved food delivery service, connecting people with the rich culinary heritage of our nation.'
  },
  address: {
    type: String,
    default: 'Thamel, Kathmandu, Nepal'
  },
  phone: {
    type: String,
    default: '+977-9812345678'
  },
  email: {
    type: String,
    default: 'info@jhasharestaurant.com.np'
  },
  openingHours: {
    type: String,
    default: 'Sunday - Saturday: 10:00 AM - 10:00 PM'
  },
  specialties: [{
    type: String
  }],
  achievements: [{
    title: String,
    description: String,
    year: String
  }],
  teamSize: {
    type: Number,
    default: 25
  },
  yearsOfService: {
    type: Number,
    default: 4
  },
  customersServed: {
    type: Number,
    default: 10000
  },
  images: [{
    type: String
  }],
  socialMedia: {
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
aboutUsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const AboutUs = mongoose.model('AboutUs', aboutUsSchema);
module.exports = AboutUs;
export default AboutUs;
