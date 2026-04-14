const mongoose = require('mongoose');

const atsReportSchema = new mongoose.Schema({
  candidateId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  // For candidate-side ATS check (no job)
  jobDescription: { type: String },
  jobTitle:       { type: String },

  overallScore:   { type: Number }, // 0-100
  sections: {
    keywordMatch:     { score: Number, matched: [String], missing: [String] },
    formatScore:      { score: Number, issues: [String] },
    experienceMatch:  { score: Number, notes: String },
    skillsMatch:      { score: Number, matched: [String], missing: [String] },
    educationMatch:   { score: Number, notes: String },
  },
  suggestions:    [String],
  optimizedCV:    { type: String }, // AI-generated optimized CV text
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ATSReport', atsReportSchema);
