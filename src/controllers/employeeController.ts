const Employee = require('../models/Employee');
const { generateToken } = require('../utils/helpers');
const { sendWelcomeEmail } = require('../utils/emailService');
import * as crypto from 'crypto';

/**
 * Register a new employee
 * @route POST /api/employees/register
 * @description Creates a new employee account
 */
exports.registerEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, position, department, salary } = req.body;

    if (!name || !email || !phone || !password || !position || !department) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    // Check if employee already exists
    let employee = await Employee.findOne({ email: email.toLowerCase() });
    if (employee) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered as employee' 
      });
    }

    // Create new employee
    employee = new Employee({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      position,
      department,
      salary: salary || 0,
      phone_number: phone
    });

    await employee.save();

    // Send welcome email
    sendWelcomeEmail(employee.email, employee.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    const token = generateToken(employee._id, employee.role);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      employee: employee.toJSON()
    });
  } catch (error) {
    console.error('Employee registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error registering employee' 
    });
  }
};

/**
 * Employee login
 * @route POST /api/employees/login
 */
exports.loginEmployee = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isPasswordMatched = await employee.matchPassword(password);
    if (!isPasswordMatched) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been deactivated' 
      });
    }

    const token = generateToken(employee._id, employee.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      employee: employee.toJSON()
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error during login' 
    });
  }
};

/**
 * Get all employees (Admin only)
 * @route GET /api/employees
 */
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { department, isActive } = req.query;
    let filter: any = {};

    if (department) {
      filter.department = department;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .select('-password');

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching employees' 
    });
  }
};

/**
 * Get employee by ID
 * @route GET /api/employees/:id
 */
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Fetch employee error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching employee' 
    });
  }
};

/**
 * Update employee (self or admin)
 * @route PUT /api/employees/:id
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    const { name, phone, address, city, state, zipCode, position, salary } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    // Update allowed fields
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;
    if (city) employee.city = city;
    if (state) employee.state = state;
    if (zipCode) employee.zipCode = zipCode;
    if (position) employee.position = position;
    if (salary !== undefined) employee.salary = salary;

    if (req.file) {
      employee.profileImage = req.file.path;
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: employee.toJSON()
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating employee' 
    });
  }
};

/**
 * Delete employee (Admin only)
 * @route DELETE /api/employees/:id
 */
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      employee
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting employee' 
    });
  }
};

/**
 * Change employee password
 * @route POST /api/employees/change-password
 */
exports.changeEmployeePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All password fields are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New passwords do not match' 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password cannot be the same as current password' 
      });
    }

    const employee = await Employee.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    const isPasswordMatched = await employee.matchPassword(currentPassword);
    if (!isPasswordMatched) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error changing password' 
    });
  }
};
