const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });
const AttendanceLog = require('../server/models/AttendanceLog');

async function testQuery() {
  try {
    console.log('Connecting to MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');
    
    const count = await AttendanceLog.countDocuments();
    console.log('Total AttendanceLogs count:', count);
    
    const logs = await AttendanceLog.find().sort({ timestamp: -1 }).limit(5);
    console.log('Recent 5 logs:', JSON.stringify(logs, null, 2));
    
  } catch (err) {
    console.error('Test query error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

testQuery();
