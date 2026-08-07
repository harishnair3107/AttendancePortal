const express = require('express');
const router = express.Router();
const { employeeLogin, adminLogin, updatePassword } = require('../controllers/authController');
const { verifyEmployeeToken } = require('../middleware/authMiddleware');

router.post('/employee-login', employeeLogin);
router.post('/admin-login', adminLogin);
router.post('/update-password', verifyEmployeeToken, updatePassword);

module.exports = router;
