const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  month:         { type: Number, required: true, min: 1, max: 12 },
  year:          { type: Number, required: true },
  
  // Earnings
  basicSalary:   { type: Number, required: true },
  hra:           { type: Number, default: 0 },
  allowances:    { type: Number, default: 0 },
  bonus:         { type: Number, default: 0 },
  overtime:      { type: Number, default: 0 },
  
  grossSalary:   { type: Number, required: true },
  
  // Deductions
  pf:            { type: Number, default: 0 },
  esi:           { type: Number, default: 0 },
  tax:           { type: Number, default: 0 },
  loanDeduction: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  
  totalDeductions: { type: Number, default: 0 },
  
  // Net
  netSalary:     { type: Number, required: true },
  
  // Attendance
  workingDays:   { type: Number, required: true },
  presentDays:   { type: Number, required: true },
  absentDays:    { type: Number, default: 0 },
  leaveDays:     { type: Number, default: 0 },
  
  // Payment
  paymentDate:   { type: Date },
  paymentMode:   { type: String, enum: ['Bank Transfer', 'Cash', 'Cheque', 'UPI'], default: 'Bank Transfer' },
  paymentStatus: { type: String, enum: ['Pending', 'Processing', 'Paid', 'Failed'], default: 'Pending' },
  transactionId: { type: String },
  
  // Payslip
  payslipUrl:    { type: String },
  
  notes:         { type: String },
  
  generatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, year: -1, month: -1 });
payrollSchema.index({ companyId: 1, year: 1, month: 1 });
payrollSchema.index({ companyId: 1, paymentStatus: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
