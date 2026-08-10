const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  leaveType:     { type: String, enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity', 'Paternity', 'Bereavement', 'Other'], required: true },
  
  startDate:     { type: Date, required: true },
  endDate:       { type: Date, required: true },
  totalDays:     { type: Number, required: true },
  
  halfDay:       { type: Boolean, default: false },
  halfDayType:   { type: String, enum: ['First Half', 'Second Half'] },
  
  reason:        { type: String, required: true },
  
  status:        { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
  rejectionReason: { type: String },
  
  // Handover
  handoverTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  handoverNotes: { type: String },
  
  appliedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

leaveSchema.index({ employeeId: 1, startDate: -1 });
leaveSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
