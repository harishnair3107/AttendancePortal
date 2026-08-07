const express = require('express');
const router = express.Router();
const {
  generateScanToken,
  markAttendance,
  markSelfieAttendance,
  getTodayAttendance,
  getAttendanceByDate,
  getMyTodayStatus,
} = require('../controllers/attendanceController');
const { verifyEmployeeToken, verifyAdminToken } = require('../middleware/authMiddleware');

// Employee: check today's status
router.get('/my-today-status', verifyEmployeeToken, getMyTodayStatus);

// Employee: generate QR scan token
router.get('/generate-token', verifyEmployeeToken, generateScanToken);

// Employee: mark attendance with selfie + location + timestamp
router.post('/selfie-mark', verifyEmployeeToken, markSelfieAttendance);

// Public: phone submits location after scanning QR
router.post('/mark', markAttendance);

// Admin: view attendance
router.get('/today', verifyAdminToken, getTodayAttendance);
router.get('/by-date', verifyAdminToken, getAttendanceByDate);

module.exports = router;
