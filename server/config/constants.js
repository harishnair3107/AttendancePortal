require('dotenv').config();

const CONSTANTS = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'harishnair3107@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',

  OFFICE: {
    LAT: parseFloat(process.env.OFFICE_LAT) || 19.215340,
    LNG: parseFloat(process.env.OFFICE_LNG) || 73.201477,
    RADIUS_M: parseInt(process.env.OFFICE_RADIUS_M) || 500,
  },

  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: '8h',

  SCAN_TOKEN_EXPIRY_MINUTES: 5,
};

module.exports = CONSTANTS;
