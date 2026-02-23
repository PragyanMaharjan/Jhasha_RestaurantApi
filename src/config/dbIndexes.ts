/**
 * Database Indexes Configuration
 * Improves query performance for frequently accessed fields
 * 
 * These indexes should be created when the application starts
 * Add this to server.ts after database connection
 */

const mongoose = require('mongoose');

/**
 * Create indexes for all models
 * Improves query performance and enforces constraints
 */
async function createIndexes() {
  try {
    // User Model Indexes
    const User = mongoose.model('User');
    await User.createIndexes([
      { email: 1 }, // Already unique, improves login query
      { phone: 1 }, // Unique constraint for phone lookups
      { role: 1, isActive: 1 }, // Compound index for admin queries
      { resetPasswordToken: 1, resetPasswordExpire: 1 }, // For password reset
      { createdAt: -1 }, // For sorting recent users
    ]);
    console.log('✓ User indexes created');

    // Food Model Indexes
    const Food = mongoose.model('Food');
    await Food.createIndexes([
      { category: 1, isAvailable: 1 }, // For category filtering
      { name: 'text', description: 'text' }, // Full-text search
      { price: 1 }, // For price-based sorting
      { rating: -1 }, // For top-rated items
      { totalOrders: -1 }, // For popular items
      { isAvailable: 1, category: 1, rating: -1 }, // Compound for main query
    ]);
    console.log('✓ Food indexes created');

    // Order Model Indexes
    const Order = mongoose.model('Order');
    await Order.createIndexes([
      { userId: 1, createdAt: -1 }, // User's orders by date
      { orderStatus: 1, createdAt: -1 }, // Orders by status
      { paymentStatus: 1 }, // Payment tracking
      { orderNumber: 1 }, // Unique order tracking
      { userId: 1, orderStatus: 1 }, // User's specific status orders
      { createdAt: -1 }, // Recent orders (admin dashboard)
    ]);
    console.log('✓ Order indexes created');

    // Review Model Indexes (if exists)
    try {
      const Review = mongoose.model('Review');
      await Review.createIndexes([
        { foodId: 1, createdAt: -1 }, // Food reviews
        { userId: 1 }, // User's reviews
        { rating: 1 }, // Filter by rating
        { foodId: 1, userId: 1 }, // Prevent duplicate reviews (unique)
      ]);
      console.log('✓ Review indexes created');
    } catch (err) {
      // Review model might not exist
      console.log('⚠ Review model not found, skipping indexes');
    }

    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

/**
 * Drop all indexes (useful for development/testing)
 * WARNING: Only use this in development!
 */
async function dropIndexes() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop indexes in production!');
  }

  try {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.dropIndexes();
      console.log(`✓ Dropped indexes for ${collection.collectionName}`);
    }

    console.log('✅ All indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
}

module.exports = {
  createIndexes,
  dropIndexes,
};

export {};

/**
 * USAGE in server.ts (after MongoDB connection):
 * 
 * const { createIndexes } = require('./config/dbIndexes');
 * 
 * mongoose.connect(process.env.MONGODB_URI)
 *   .then(async () => {
 *     console.log('MongoDB connected');
 *     // Create indexes in production, optional in development
 *     if (process.env.NODE_ENV !== 'test') {
 *       await createIndexes();
 *     }
 *   })
 *   .catch(err => console.log('MongoDB error:', err));
 */
