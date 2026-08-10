const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  companyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  code:        { type: String },
  headId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

departmentSchema.index({ companyId: 1 });

module.exports = mongoose.model('Department', departmentSchema);
