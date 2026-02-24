const express = require('express');
const {
  getAboutUs,
  updateAboutUs,
  addAchievement,
  removeAchievement,
  uploadImage
} = require('../controllers/aboutUsController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * Public Routes
 */

// Get About Us information (accessible to everyone)
router.get('/', getAboutUs);

/**
 * Admin Routes (Admin only)
 */

// Update About Us information
router.put('/', verifyToken, requireRole(['admin']), updateAboutUs);

// Add achievement
router.post('/achievement', verifyToken, requireRole(['admin']), addAchievement);

// Remove achievement
router.delete('/achievement/:id', verifyToken, requireRole(['admin']), removeAchievement);

// Upload image
router.post('/image', verifyToken, requireRole(['admin']), upload.single('image'), uploadImage);

module.exports = router;
export default router;
