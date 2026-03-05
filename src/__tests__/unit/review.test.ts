import { describe, test, expect, beforeEach } from '@jest/globals';

const Review = require('../../models/Review');

describe('Review Model', () => {
  let mockReviewData: any;

  beforeEach(() => {
    mockReviewData = {
      userId: '507f1f77bcf86cd799439011',
      foodId: '507f1f77bcf86cd799439012',
      rating: 5,
      comment: 'Delicious food!'
    };
  });

  test('should create a new review with all fields', () => {
    const review = new Review(mockReviewData);

    expect(review.userId.toString()).toBe(mockReviewData.userId);
    expect(review.foodId.toString()).toBe(mockReviewData.foodId);
    expect(review.rating).toBe(mockReviewData.rating);
    expect(review.comment).toBe(mockReviewData.comment);
  });

  test('should create a review with minimum required fields', () => {
    const minimalData = {
      userId: '507f1f77bcf86cd799439011',
      foodId: '507f1f77bcf86cd799439012',
      rating: 4,
      comment: 'Good food'
    };

    const review = new Review(minimalData);

    expect(review.userId.toString()).toBe(minimalData.userId);
    expect(review.foodId.toString()).toBe(minimalData.foodId);
    expect(review.rating).toBe(minimalData.rating);
    expect(review.comment).toBe(minimalData.comment);
  });

  test('should have createdAt timestamp', () => {
    const review = new Review(mockReviewData);
    
    expect(review.createdAt).toBeDefined();
    expect(review.createdAt instanceof Date).toBe(true);
  });

  test('should accept ratings from 1 to 5', () => {
    [1, 2, 3, 4, 5].forEach(rating => {
      const data = { ...mockReviewData, rating };
      const review = new Review(data);
      expect(review.rating).toBe(rating);
    });
  });

  test('should allow different comments', () => {
    const comments = [
      'Excellent food',
      'Very good',
      'Average',
      'Not so good',
      'Terrible'
    ];

    comments.forEach(comment => {
      const data = { ...mockReviewData, comment };
      const review = new Review(data);
      expect(review.comment).toBe(comment);
    });
  });

  test('should allow empty comment', () => {
    const dataWithoutComment = {
      ...mockReviewData,
      comment: ''
    };

    const review = new Review(dataWithoutComment);

    expect(review.comment).toBe('');
  });

  test('should accept long comments', () => {
    const longComment = 'A'.repeat(500);
    const dataWithLongComment = {
      ...mockReviewData,
      comment: longComment
    };

    const review = new Review(dataWithLongComment);

    expect(review.comment).toBe(longComment);
  });

  test('should store user and food references correctly', () => {
    const review = new Review(mockReviewData);

    expect(review.userId).toBeDefined();
    expect(review.foodId).toBeDefined();
  });

  test('should handle multiple reviews for same food', () => {
    const review1 = new Review({ ...mockReviewData, rating: 5 });
    const review2 = new Review({ ...mockReviewData, rating: 3, userId: '507f1f77bcf86cd799439013' });

    expect(review1.foodId.toString()).toBe(review2.foodId.toString());
    expect(review1.rating).not.toBe(review2.rating);
  });

  test('should handle multiple reviews from same user', () => {
    const review1 = new Review({ ...mockReviewData, foodId: '507f1f77bcf86cd799439012' });
    const review2 = new Review({ ...mockReviewData, foodId: '507f1f77bcf86cd799439013' });

    expect(review1.userId.toString()).toBe(review2.userId.toString());
    expect(review1.foodId.toString()).not.toBe(review2.foodId.toString());
  });

  test('should preserve review data structure', () => {
    const review = new Review(mockReviewData);
    const keys = Object.keys(review.toObject ? review.toObject() : review._doc || review);

    expect(keys).toContain('userId');
    expect(keys).toContain('foodId');
    expect(keys).toContain('rating');
    expect(keys).toContain('comment');
  });

  test('should support review updates', () => {
    const review = new Review(mockReviewData);
    
    review.rating = 4;
    review.comment = 'Updated comment';

    expect(review.rating).toBe(4);
    expect(review.comment).toBe('Updated comment');
  });

  test('should handle different user and food IDs', () => {
    const review1 = new Review(mockReviewData);
    const review2 = new Review({
      userId: '607f1f77bcf86cd799439011',
      foodId: '607f1f77bcf86cd799439012',
      rating: 3,
      comment: 'Different review'
    });

    expect(review1.userId.toString()).not.toBe(review2.userId.toString());
    expect(review1.foodId.toString()).not.toBe(review2.foodId.toString());
  });

  test('should maintain consistency across multiple instance creations', () => {
    const review1 = new Review(mockReviewData);
    const review2 = new Review(mockReviewData);

    expect(review1.rating).toBe(review2.rating);
    expect(review1.comment).toBe(review2.comment);
  });

  test('should handle numeric ratings correctly', () => {
    const ratingTests = [
      { rating: 1, expected: 1 },
      { rating: 2, expected: 2 },
      { rating: 3, expected: 3 },
      { rating: 4, expected: 4 },
      { rating: 5, expected: 5 }
    ];

    ratingTests.forEach(test => {
      const review = new Review({ ...mockReviewData, rating: test.rating });
      expect(review.rating).toBe(test.expected);
    });
  });
});
