const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Basic Info
  employeeId:      { type: String, required: true, unique: true },
  firstName:       { type: String, required: true },
  lastName:        { type: String, required: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  phone:           { type: String },
  dateOfBirth:     { type: Date },
  gender:          { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  
  // Employment Details
  companyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // client company
  department:      { type: String },
  designation:     { type: String },
  employmentType:  { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  joiningDate:     { type: Date, required: true },
  probationEndDate:{ type: Date },
  confirmationDate:{ type: Date },
  exitDate:        { type: Date },
  status:          { type: String, enum: ['Active', 'On Leave', 'Probation', 'Notice Period', 'Resigned', 'Terminated'], default: 'Active' },
  
  // Reporting
  reportingTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  
  // Compensation
  salary:          { type: Number }, // monthly
  currency:        { type: String, default: 'INR' },
  bankName:        { type: String },
  accountNumber:   { type: String },
  ifscCode:        { type: String },
  panNumber:       { type: String },
  
  // Address
  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  pincode:         { type: String },
  country:         { type: String, default: 'India' },
  
  // Emergency Contact
  emergencyContactName:  { type: String },
  emergencyContactPhone: { type: String },
  emergencyContactRelation: { type: String },
  
  // Documents
  documents:       [{
    name: String,
    type: { type: String, enum: ['Resume', 'ID Proof', 'Address Proof', 'Education', 'Experience Letter', 'Other'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  
  // Leave Balance
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    earned: { type: Number, default: 15 },
    unpaid: { type: Number, default: 0 },
  },
  
  // Performance
  lastReviewDate:  { type: Date },
  nextReviewDate:  { type: Date },
  performanceRating: { type: Number, min: 1, max: 5 },
  
  // System
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if employee has login access
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

employeeSchema.index({ companyId: 1, employeeId: 1 });
employeeSchema.index({ companyId: 1, status: 1 });
employeeSchema.index({ email: 1 });

employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);
