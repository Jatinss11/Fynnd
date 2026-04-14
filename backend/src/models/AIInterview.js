const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['ai', 'candidate'] },
  content:   { type: String },
  timestamp: { type: Date, default: Date.now },
  flagged:   { type: Boolean, default: false }, // AI flagged suspicious behaviour
  flags:     [String],
}, { _id: false });

const aiInterviewSchema = new mongoose.Schema({
  candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  jobId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  pipelineId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline' },
  scheduledBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Self-initiated by candidate (portal)
  selfInitiated: { type: Boolean, default: false },
  candidateName: { type: String },
  candidateEmail:{ type: String },
  jobTitle:      { type: String },
  jobDescription:{ type: String },

  status:        { type: String, enum: ['pending', 'in_progress', 'completed', 'abandoned'], default: 'pending' },
  startedAt:     { type: Date },
  completedAt:   { type: Date },
  duration:      { type: Number }, // minutes

  messages:      [messageSchema],
  totalQuestions:{ type: Number, default: 0 },

  // AI Report
  report: {
    overallScore:        { type: Number }, // 0-100
    technicalScore:      { type: Number },
    communicationScore:  { type: Number },
    problemSolvingScore: { type: Number },
    confidenceScore:     { type: Number },
    recommendation:      { type: String, enum: ['strong_hire', 'hire', 'maybe', 'no_hire'] },
    summary:             { type: String },
    strengths:           [String],
    weaknesses:          [String],
    detailedFeedback:    { type: String },
    redFlags:            [String],
    hiringNotes:         { type: String },
  },

  // Monitoring
  monitoring: {
    tabSwitches:    { type: Number, default: 0 },
    copyPasteCount: { type: Number, default: 0 },
    suspiciousActivity: [String],
  },

  accessToken: { type: String }, // unique token for candidate to join
  _questionsCache: { type: String }, // JSON array of questions for sequential delivery
}, { timestamps: true });

module.exports = mongoose.model('AIInterview', aiInterviewSchema);
