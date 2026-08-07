const express = require('express');
const router = express.Router();
const { addEmployee, listEmployees, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

router.post('/add', verifyAdminToken, addEmployee);
router.get('/list', verifyAdminToken, listEmployees);
router.put('/update{/:id}', verifyAdminToken, updateEmployee);
router.delete('/delete{/:id}', verifyAdminToken, deleteEmployee);

module.exports = router;
