const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  companyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  date:        { type: Date, required: true },
  type:        { type: String, enum: ['Public Holiday', 'Optional Holiday', 'Company Holiday'], default: 'Public Holiday' },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

holidaySchema.index({ companyId: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
