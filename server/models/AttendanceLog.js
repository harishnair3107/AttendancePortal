const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeEmail: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    date: {
      type: String, // stored as 'YYYY-MM-DD' for easy date filtering
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    distanceMeters: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['present', 'half-day', 'rejected'],
      default: 'present',
    },
    verificationMethod: {
      type: String,
      enum: ['selfie', 'qr'],
      default: 'qr',
    },
    photoCaptured: {
      type: Boolean,
      default: true,
    },
    photoData: {
      type: String, // Store base64 image data string
    },
  },
  { timestamps: true }
);

// Index for fast date-based queries
attendanceLogSchema.index({ date: 1 });
attendanceLogSchema.index({ employeeId: 1, date: 1 });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
