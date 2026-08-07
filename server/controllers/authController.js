const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const CONSTANTS = require('../config/constants');

/**
 * POST /api/auth/employee-login
 */
const employeeLogin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ success: false, message: 'Employee ID and password are required' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: employee._id, employeeId: employee.employeeId, name: employee.name, email: employee.email, role: 'employee' },
      CONSTANTS.JWT_SECRET,
      { expiresIn: CONSTANTS.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/auth/admin-login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (email.toLowerCase() !== CONSTANTS.ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Access denied. Not an admin account.' });
    }

    if (password !== CONSTANTS.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      CONSTANTS.JWT_SECRET,
      { expiresIn: CONSTANTS.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: { email },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/auth/update-password
 * Protected: employee only
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { employeeId } = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Set new password — pre-save hook will hash it
    employee.passwordHash = newPassword;
    await employee.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { employeeLogin, adminLogin, updatePassword };
