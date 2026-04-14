const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  company:        { type: String, required: true },
  clientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Location
  location:       { type: String },
  cities:         [String],
  remote:         { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },

  // Requirements
  experienceMin:  { type: Number, default: 0 },
  experienceMax:  { type: Number, default: 10 },
  salaryMin:      { type: Number }, // LPA
  salaryMax:      { type: Number }, // LPA
  skills:         [String],
  description:    { type: String },
  responsibilities: { type: String },
  requirements:   { type: String },

  // Indian market
  industry:       { type: String },
  department:     { type: String },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], default: 'Full-time' },
  openings:       { type: Number, default: 1 },
  urgency:        { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },

  // Status
  status:         { type: String, enum: ['open', 'closed', 'on-hold', 'filled'], default: 'open' },
  deadline:       { type: Date },

  // Metrics
  viewCount:      { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ clientId: 1 });

module.exports = mongoose.model('Job', jobSchema);
