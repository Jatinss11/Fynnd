const mongoose = require('mongoose');

const candidateReviewSchema = new mongoose.Schema({
  candidateId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  pipelineId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline' },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Rating
  overallRating:      { type: Number, min: 1, max: 5 },
  technicalRating:    { type: Number, min: 1, max: 5 },
  communicationRating:{ type: Number, min: 1, max: 5 },
  cultureFitRating:   { type: Number, min: 1, max: 5 },

  // Decision
  decision:     { type: String, enum: ['shortlisted', 'rejected', 'on_hold', 'hired'], required: true },
  feedback:     { type: String },
  privateNotes: { type: String }, // only visible to reviewer

  // Interview monitoring
  interviewMonitoring: {
    tabSwitches:    { type: Number, default: 0 },
    copyPasteCount: { type: Number, default: 0 },
    suspiciousFlags:[String],
    aiProctorScore: { type: Number }, // 0-100, higher = more suspicious
    cheatingDetected:{ type: Boolean, default: false },
  },
}, { timestamps: true });

candidateReviewSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('CandidateReview', candidateReviewSchema);
