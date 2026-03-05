const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['delivery', 'kitchen_staff', 'manager', 'supervisor'],
    default: 'delivery'
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['delivery', 'kitchen', 'management', 'customer_service'],
    required: true
  },
  salary: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  experience: {
    type: Number,
    default: 0
  },
  skills: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  },
  idProof: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  phone_number: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  zipCode: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual property for joinDate (alias for joiningDate)
employeeSchema.virtual('joinDate').get(function() {
  return this.joiningDate;
}).set(function(value) {
  this.joiningDate = value;
});

// Ensure virtuals are included when converting to object
employeeSchema.set('toObject', { virtuals: true });

// Method to compare passwords
employeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from response and include virtuals
employeeSchema.methods.toJSON = function() {
  const employee = this.toObject({ virtuals: true });
  delete employee.password;
  return employee;
};

// Create index on email for faster lookups
employeeSchema.index({ email: 1 });
employeeSchema.index({ createdAt: -1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
export default Employee;
