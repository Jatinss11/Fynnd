const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:          { type: Date, required: true },
  
  checkIn:       { type: Date },
  checkOut:      { type: Date },
  
  status:        { 
    type: String, 
    enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday', 'Week Off'],
    default: 'Absent'
  },
  
  workHours:     { type: Number, default: 0 }, // in hours
  overtime:      { type: Number, default: 0 }, // in hours
  
  location:      { type: String }, // office/remote/field
  notes:         { type: String },
  
  // Geolocation (optional)
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  
  // Approval
  isApproved:    { type: Boolean, default: true },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
