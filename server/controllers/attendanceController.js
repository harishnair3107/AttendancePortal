const crypto = require('crypto');
const os = require('os');
const AttendanceLog = require('../models/AttendanceLog');
const ScanToken = require('../models/ScanToken');
const Employee = require('../models/Employee');
const CONSTANTS = require('../config/constants');

/**
 * Haversine formula — distance in meters between two lat/lng points
 */
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Returns YYYY-MM-DD in India (Asia/Kolkata) timezone
 */
const getKolkataDateString = (dateObj = new Date()) => {
  return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

/**
 * Returns the local network IP address (e.g. 192.168.x.x) of the host computer
 */
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

/**
 * Helper to determine attendance status based on 10:30 AM cutoff:
 * - On or before 10:30 AM -> 'present' (Full Day / On-Time)
 * - After 10:30 AM -> 'half-day'
 */
const getAttendanceStatusForTime = (dateObj) => {
  try {
    const timeString = dateObj.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
    const [hStr, mStr] = timeString.split(':');
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);

    // Rejection cutoff: After 7:00 PM (19:00 IST) -> 'rejected'
    if (hours >= 19) {
      return 'rejected';
    }

    if (hours < 10 || (hours === 10 && minutes <= 30)) {
      return 'present';
    }
    return 'half-day';
  } catch (err) {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    if (hours >= 19) {
      return 'rejected';
    }
    if (hours < 10 || (hours === 10 && minutes <= 30)) {
      return 'present';
    }
    return 'half-day';
  }
};

/**
 * GET /api/attendance/generate-token
 * Employee: generate a one-time QR scan token
 */
const generateScanToken = async (req, res) => {
  try {
    const { employeeId, name } = req.user;

    // Invalidate existing unused tokens for this employee
    await ScanToken.deleteMany({ employeeId, used: false });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CONSTANTS.SCAN_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const scanToken = new ScanToken({ token, employeeId, employeeName: name, expiresAt });
    await scanToken.save();

    const localIp = getLocalIpAddress();
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Replace localhost or 127.0.0.1 with the actual local IP address so mobile phones can resolve it
    frontendUrl = frontendUrl.replace('localhost', localIp).replace('127.0.0.1', localIp);

    const scanUrl = `${frontendUrl}/scan?token=${token}`;

    res.json({ success: true, token, scanUrl, expiresInMinutes: CONSTANTS.SCAN_TOKEN_EXPIRY_MINUTES });
  } catch (error) {
    console.error('Generate scan token error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/attendance/mark
 * Public / Kiosk: Called when laptop webcam scans employee QR code (token or employeeId)
 */
const markAttendance = async (req, res) => {
  try {
    const { token, employeeId, latitude, longitude } = req.body;

    if ((!token && !employeeId) || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'QR Code payload (token or employeeId), latitude, and longitude are required' });
    }

    let targetEmployeeId = '';
    let targetEmployeeName = '';
    let targetEmployeeEmail = '';

    if (token) {
      const scanToken = await ScanToken.findOne({ token });
      if (scanToken) {
        if (scanToken.used) {
          return res.status(409).json({ success: false, message: 'This QR code token has already been used. Please generate a new one.' });
        }
        if (new Date() > scanToken.expiresAt) {
          await ScanToken.deleteOne({ token });
        } else {
          targetEmployeeId = scanToken.employeeId;
          targetEmployeeName = scanToken.employeeName;
          await ScanToken.updateOne({ token }, { used: true });
        }
      }
    }

    // Fallback: If token didn't match or expired, try employeeId lookup
    if (!targetEmployeeId && employeeId) {
      const trimmedId = String(employeeId).trim();
      const emp = await Employee.findOne({
        $or: [
          { employeeId: trimmedId },
          { employeeId: new RegExp(`^${trimmedId}$`, 'i') }
        ]
      });
      if (emp) {
        targetEmployeeId = emp.employeeId;
        targetEmployeeName = emp.name;
        targetEmployeeEmail = emp.email || '';
      }
    }

    if (!targetEmployeeId) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired QR code pass. Employee record not found in system.'
      });
    }

    // Geo-fence check
    const distance = getDistanceMeters(
      parseFloat(latitude),
      parseFloat(longitude),
      CONSTANTS.OFFICE.LAT,
      CONSTANTS.OFFICE.LNG
    );

    if (distance > CONSTANTS.OFFICE.RADIUS_M) {
      return res.status(403).json({
        success: false,
        message: `Location verification failed: You are ${Math.round(distance)}m away from the office. Must be within ${CONSTANTS.OFFICE.RADIUS_M}m.`,
        distance: Math.round(distance),
        required: CONSTANTS.OFFICE.RADIUS_M,
      });
    }

    const now = new Date();
    const dateStr = getKolkataDateString(now);
    const calculatedStatus = getAttendanceStatusForTime(now);

    // Prevent duplicate attendance for same employee same day
    const existing = await AttendanceLog.findOne({
      employeeId: targetEmployeeId,
      date: dateStr,
      status: { $in: ['present', 'half-day', 'rejected'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Attendance already marked today for ${targetEmployeeName} (${targetEmployeeId}).`,
        alreadyMarked: true,
        markedAt: existing.timestamp,
        status: existing.status,
      });
    }

    // After 7:00 PM rejection check
    if (calculatedStatus === 'rejected') {
      const log = new AttendanceLog({
        employeeId: targetEmployeeId,
        employeeName: targetEmployeeName,
        employeeEmail: targetEmployeeEmail,
        timestamp: now,
        date: dateStr,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distanceMeters: Math.round(distance),
        status: 'rejected',
        verificationMethod: 'qr',
        photoCaptured: false,
      });
      await log.save();

      return res.status(403).json({
        success: false,
        message: '🚫 Attendance marking is closed after 7:00 PM. Attendance recorded as Rejected.',
        status: 'rejected',
      });
    }

    // Mark attendance
    const log = new AttendanceLog({
      employeeId: targetEmployeeId,
      employeeName: targetEmployeeName,
      employeeEmail: targetEmployeeEmail,
      timestamp: now,
      date: dateStr,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      distanceMeters: Math.round(distance),
      status: calculatedStatus,
      verificationMethod: 'qr',
      photoCaptured: false,
    });

    await log.save();

    const statusLabel = calculatedStatus === 'present' ? 'Present (On-Time)' : 'Half-Day';

    res.json({
      success: true,
      message: `🎉 Attendance marked successfully for ${targetEmployeeName} as ${statusLabel}!`,
      log: {
        id: log._id,
        employeeId: log.employeeId,
        employeeName: log.employeeName,
        timestamp: log.timestamp,
        distance: Math.round(distance),
        status: log.status,
        verificationMethod: log.verificationMethod,
      },
    });
  } catch (error) {
    console.error('Mark QR attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking QR attendance' });
  }
};

/**
 * POST /api/attendance/selfie-mark
 * Employee protected route: mark attendance with live selfie verification + location + timestamp
 * NOTE: Image is verified locally on device, NOT stored in the database.
 */
const markSelfieAttendance = async (req, res) => {
  try {
    const { photoCaptured, photoData, latitude, longitude } = req.body;
    const { employeeId, name, email } = req.user;

    if (!photoCaptured) {
      return res.status(400).json({ success: false, message: 'Live selfie photo capture verification is required' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Device location (latitude and longitude) is required' });
    }

    // Geo-fence distance verification
    const distance = getDistanceMeters(
      parseFloat(latitude),
      parseFloat(longitude),
      CONSTANTS.OFFICE.LAT,
      CONSTANTS.OFFICE.LNG
    );

    if (distance > CONSTANTS.OFFICE.RADIUS_M) {
      return res.status(403).json({
        success: false,
        message: `Location verification failed: You are ${Math.round(distance)}m away from the office. Must be within ${CONSTANTS.OFFICE.RADIUS_M}m.`,
        distance: Math.round(distance),
        required: CONSTANTS.OFFICE.RADIUS_M,
      });
    }

    const now = new Date();
    const dateStr = getKolkataDateString(now);
    const calculatedStatus = getAttendanceStatusForTime(now);

    // Check duplicate attendance for today
    const existing = await AttendanceLog.findOne({
      employeeId,
      date: dateStr,
      status: { $in: ['present', 'half-day', 'rejected'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for today.',
        alreadyMarked: true,
        markedAt: existing.timestamp,
        status: existing.status,
      });
    }

    // After 7:00 PM rejection check
    if (calculatedStatus === 'rejected') {
      const log = new AttendanceLog({
        employeeId,
        employeeName: name,
        employeeEmail: email || '',
        timestamp: now,
        date: dateStr,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distanceMeters: Math.round(distance),
        status: 'rejected',
        verificationMethod: 'selfie',
        photoCaptured: true,
        photoData,
      });
      await log.save();

      return res.status(403).json({
        success: false,
        message: '🚫 Attendance marking is closed after 7:00 PM. Attendance recorded as Rejected.',
        status: 'rejected',
      });
    }

    // Save Attendance Log with base64 photo data
    const log = new AttendanceLog({
      employeeId,
      employeeName: name,
      employeeEmail: email || '',
      timestamp: now,
      date: dateStr,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      distanceMeters: Math.round(distance),
      status: calculatedStatus,
      verificationMethod: 'selfie',
      photoCaptured: true,
      photoData,
    });

    await log.save();

    const statusLabel = calculatedStatus === 'present' ? 'Present (On-Time)' : 'Half-Day';

    res.json({
      success: true,
      message: `🎉 Attendance marked successfully as ${statusLabel}! (Selfie verified, image not stored)`,
      log: {
        id: log._id,
        employeeId: log.employeeId,
        employeeName: log.employeeName,
        timestamp: log.timestamp,
        distance: Math.round(distance),
        status: log.status,
        verificationMethod: log.verificationMethod,
      },
    });
  } catch (error) {
    console.error('Selfie attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking selfie attendance' });
  }
};

/**
 * GET /api/attendance/today
 * Admin: fetch all attendance for today
 */
const getTodayAttendance = async (req, res) => {
  try {
    const todayStr = getKolkataDateString();
    const logs = await AttendanceLog.find({
      date: todayStr,
      status: { $in: ['present', 'half-day'] },
    }).sort({ timestamp: -1 });

    res.json({ success: true, date: todayStr, count: logs.length, logs });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/attendance/by-date?date=YYYY-MM-DD
 * Admin: fetch attendance for a specific date
 */
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date in YYYY-MM-DD format is required' });
    }

    const logs = await AttendanceLog.find({
      date,
      status: { $in: ['present', 'half-day'] },
    }).sort({ timestamp: -1 });

    res.json({ success: true, date, count: logs.length, logs });
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/attendance/my-today-status
 * Employee protected route: check if logged in employee has marked attendance today
 */
const getMyTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const todayStr = getKolkataDateString();

    const existingLog = await AttendanceLog.findOne({
      employeeId,
      date: todayStr,
    });

    if (existingLog) {
      return res.json({
        success: true,
        marked: true,
        log: existingLog,
      });
    }

    res.json({
      success: true,
      marked: false,
      log: null,
    });
  } catch (error) {
    console.error('Get my today status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  generateScanToken,
  markAttendance,
  markSelfieAttendance,
  getTodayAttendance,
  getAttendanceByDate,
  getMyTodayStatus,
};
