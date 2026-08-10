const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId:         { type: mongoose.Schema.Types.ObjectId, ref: 'JobBoard', required: true },
  
  // Applicant Info
  name:          { type: String, required: true },
  email:         { type: String, required: true, lowercase: true },
  phone:         { type: String },
  location:      { type: String },
  
  // Application
  resumeUrl:     { type: String },
  coverLetter:   { type: String },
  linkedinUrl:   { type: String },
  portfolioUrl:  { type: String },
  
  // Experience
  totalExperience: { type: Number },
  currentSalary:   { type: Number },
  expectedSalary:  { type: Number },
  noticePeriod:    { type: String },
  
  // Status
  status:        { 
    type: String, 
    enum: ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Offer Extended', 'Hired', 'Rejected', 'Withdrawn'],
    default: 'Applied'
  },
  
  // Tracking
  source:        { type: String, enum: ['Job Board', 'LinkedIn', 'Referral', 'Direct', 'Other'], default: 'Job Board' },
  referredBy:    { type: String },
  
  notes:         { type: String },
  rating:        { type: Number, min: 1, max: 5 },
  
  appliedAt:     { type: Date, default: Date.now },
  reviewedAt:    { type: Date },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const jobBoardSchema = new mongoose.Schema({
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Job Details
  title:         { type: String, required: true },
  department:    { type: String },
  location:      { type: String, required: true },
  workType:      { type: String, enum: ['On-site', 'Remote', 'Hybrid'], default: 'On-site' },
  employmentType:{ type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], default: 'Full-time' },
  
  // Requirements
  experienceMin: { type: Number, default: 0 },
  experienceMax: { type: Number },
  skills:        [String],
  qualifications:[String],
  
  // Compensation
  salaryMin:     { type: Number },
  salaryMax:     { type: Number },
  currency:      { type: String, default: 'INR' },
  salaryVisible: { type: Boolean, default: true },
  
  // Content
  description:   { type: String, required: true },
  responsibilities: { type: String },
  benefits:      { type: String },
  
  // Company Info (denormalized for public display)
  companyName:   { type: String, required: true },
  companyLogo:   { type: String },
  companyWebsite:{ type: String },
  companySize:   { type: String },
  industry:      { type: String },
  
  // Settings
  status:        { type: String, enum: ['Draft', 'Published', 'Paused', 'Closed'], default: 'Draft' },
  openings:      { type: Number, default: 1 },
  applicationDeadline: { type: Date },
  
  // Stats
  views:         { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  
  // Applications
  applications:  [jobApplicationSchema],
  
  postedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt:   { type: Date },
}, { timestamps: true });

jobBoardSchema.index({ status: 1, publishedAt: -1 });
jobBoardSchema.index({ companyId: 1, status: 1 });
jobBoardSchema.index({ title: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('JobBoard', jobBoardSchema);
