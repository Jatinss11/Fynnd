const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       { type: String },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['admin', 'recruiter', 'client'], required: true },
  company:     { type: String },
  designation: { type: String },
  avatar:      { type: String },
  isActive:    { type: Boolean, default: true },
  lastLogin:   { type: Date },
  // Indian market fields
  city:        { type: String },
  state:       { type: String },
  // Client-specific
  industry:    { type: String },
  companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+'] },
  gstin:       { type: String },
  // Recruiter-specific
  specializations: [String],
  totalPlacements: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
