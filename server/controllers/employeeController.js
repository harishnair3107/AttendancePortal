const Employee = require('../models/Employee');

/**
 * POST /api/employees/add
 * Admin only
 */
const addEmployee = async (req, res) => {
  try {
    const { name, email, employeeId, password } = req.body;

    if (!name || !email || !employeeId || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required: name, email, employeeId, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check for duplicates
    const existingEmail = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An employee with this email already exists' });
    }

    const existingId = await Employee.findOne({ employeeId });
    if (existingId) {
      return res.status(409).json({ success: false, message: 'An employee with this ID already exists' });
    }

    const employee = new Employee({
      name,
      email: email.toLowerCase(),
      employeeId,
      passwordHash: password, // pre-save hook hashes this
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
      },
    });
  } catch (error) {
    console.error('Add employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/employees/list
 * Admin only
 */
const listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}, '-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error('List employees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/employees/update/:id?
 * Admin only
 */
const updateEmployee = async (req, res) => {
  try {
    const { id, employeeId, name, email, password } = req.body;
    const targetId = req.params.id || id;

    let employee = null;
    if (targetId) {
      employee = await Employee.findById(targetId);
    } else if (employeeId) {
      employee = await Employee.findOne({ employeeId });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email.toLowerCase();
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      employee.passwordHash = password;
    }

    await employee.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
      },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/employees/delete/:id
 * Admin only
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = id || req.body.id;
    const targetEmployeeId = req.query.employeeId || req.body.employeeId;

    let employee = null;
    if (targetId) {
      employee = await Employee.findByIdAndDelete(targetId);
    } else if (targetEmployeeId) {
      employee = await Employee.findOneAndDelete({ employeeId: targetEmployeeId });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: `Employee ${employee.name} (${employee.employeeId}) removed successfully`,
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { addEmployee, listEmployees, updateEmployee, deleteEmployee };
