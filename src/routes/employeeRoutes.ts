const express = require('express');
const {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  changeEmployeePassword
} = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * Public Routes
 */

// Employee login
router.post('/login', loginEmployee);

// Employee registration
router.post('/register', registerEmployee);

/**
 * Protected Routes (Employee only)
 */

// Get employee profile
router.get('/profile/:id', verifyToken, getEmployeeById);

// Update employee profile
router.put('/profile/:id', verifyToken, updateEmployee);

// Change password
router.post('/change-password', verifyToken, changeEmployeePassword);

/**
 * Admin Routes (Admin only)
 */

// Get all employees
router.get('/', verifyToken, requireRole(['admin']), getAllEmployees);

// Get employee by ID
router.get('/:id', verifyToken, requireRole(['admin']), getEmployeeById);

// Delete/deactivate employee
router.delete('/:id', verifyToken, requireRole(['admin']), deleteEmployee);

module.exports = router;
export default router;
