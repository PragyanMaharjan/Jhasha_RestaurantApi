const express = require('express');
const { getAllUsers, getUserDetails, updateUserStatus, updateUser, deleteUser, getDashboardStats } = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
import { validate } from '../middleware/validate';
import {
  getUsersQueryValidation,
  userIdValidation,
  updateUserStatusValidation,
  updateUserValidation
} from '../validators/adminValidators';

const router = express.Router();

router.get('/users', verifyToken, verifyAdmin, getUsersQueryValidation, validate, getAllUsers);
router.get('/users/:id', verifyToken, verifyAdmin, userIdValidation, validate, getUserDetails);
router.put('/users/status', verifyToken, verifyAdmin, updateUserStatusValidation, validate, updateUserStatus);
router.put('/users/:id', verifyToken, verifyAdmin, upload.single('profileImage'), updateUserValidation, validate, updateUser);
router.delete('/users/:id', verifyToken, verifyAdmin, userIdValidation, validate, deleteUser);
router.get('/stats', verifyToken, verifyAdmin, getDashboardStats);

module.exports = router;

export {};
