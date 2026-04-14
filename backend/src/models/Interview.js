const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  pipelineId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', required: true },
  jobId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  clientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  scheduledAt:   { type: Date, required: true },
  duration:      { type: Number, default: 60 }, // minutes
  type:          { type: String, enum: ['phone', 'video', 'in-person', 'technical', 'hr'], default: 'video' },
  round:         { type: Number, default: 1 },
  meetLink:      { type: String },
  venue:         { type: String },

  status:        { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'], default: 'scheduled' },

  // Post-interview
  feedback:      { type: String },
  rating:        { type: Number, min: 1, max: 5 },
  recommendation:{ type: String, enum: ['strong_hire', 'hire', 'maybe', 'no_hire'] },
  aiSummary:     { type: String },
  strengths:     [String],
  weaknesses:    [String],

  // Notifications
  candidateNotified: { type: Boolean, default: false },
  clientNotified:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
