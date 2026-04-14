const mongoose = require('mongoose');

const workExpSchema = new mongoose.Schema({
  company:    String,
  role:       String,
  startDate:  String,
  endDate:    String,
  current:    Boolean,
  description: String,
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree:      String,
  institution: String,
  year:        Number,
  percentage:  String,
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  phone:           { type: String },
  alternatePhone:  { type: String },
  location:        { type: String },
  city:            { type: String },
  state:           { type: String },
  pincode:         { type: String },

  currentCompany:  { type: String },
  currentRole:     { type: String },
  experienceYears: { type: Number, default: 0 },
  experienceMonths:{ type: Number, default: 0 },

  skills:          [String],
  languages:       [String], // Hindi, Tamil, etc.
  workExperience:  [workExpSchema],
  education:       [educationSchema],

  // Indian market specifics
  currentSalary:   { type: Number }, // in LPA (Lakhs Per Annum)
  expectedSalary:  { type: Number }, // in LPA
  noticePeriod:    { type: String, enum: ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days', 'Serving notice'] },
  preferredLocations: [String],
  willingToRelocate: { type: Boolean, default: false },

  // Profile
  resumeUrl:       { type: String },
  linkedinUrl:     { type: String },
  githubUrl:       { type: String },
  portfolioUrl:    { type: String },
  summary:         { type: String },
  recruiterNotes:  { type: String },

  // Metadata
  source:          { type: String, enum: ['manual', 'resume_upload', 'linkedin', 'naukri', 'referral', 'portal'], default: 'manual' },
  addedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:          { type: String, enum: ['active', 'placed', 'inactive', 'blacklisted'], default: 'active' },
  tags:            [String],

  // AI fields
  aiSummary:       { type: String },
  aiSkillScore:    { type: Number },
}, { timestamps: true });

candidateSchema.index({ name: 'text', skills: 'text', currentRole: 'text', currentCompany: 'text', location: 'text' });
candidateSchema.index({ skills: 1 });
candidateSchema.index({ location: 1 });
candidateSchema.index({ experienceYears: 1 });
candidateSchema.index({ expectedSalary: 1 });
candidateSchema.index({ noticePeriod: 1 });
candidateSchema.index({ status: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
