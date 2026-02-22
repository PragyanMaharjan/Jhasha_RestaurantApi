const express = require('express');
const { register, login, forgotPassword, resetPassword, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
import { validate } from '../middleware/validate';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation
} from '../validators/authValidators';

const router = express.Router();

router.post('/register', upload.single('profileImage'), registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, upload.single('profileImage'), updateProfileValidation, validate, updateUserProfile);

module.exports = router;

export {};
