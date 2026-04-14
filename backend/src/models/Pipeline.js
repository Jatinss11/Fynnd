const mongoose = require('mongoose');

const STAGES = [
  'Sourced',
  'Screening',
  'Shortlisted',
  'Interview Round 1',
  'Interview Round 2',
  'HR Round',
  'Offer Released',
  'Offer Accepted',
  'Joined',
  'Rejected',
  'Withdrawn'
];

const activitySchema = new mongoose.Schema({
  action:    String,
  note:      String,
  by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byName:    String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  stage:          { type: String, enum: STAGES, default: 'Sourced' },
  matchScore:     { type: Number },
  matchReasons:   [String],

  // Feedback
  clientFeedback: { type: String },
  clientRating:   { type: Number, min: 1, max: 5 },
  recruiterNotes: { type: String },

  // Interview
  interviewDate:  { type: Date },
  interviewLink:  { type: String },
  interviewType:  { type: String, enum: ['phone', 'video', 'in-person', 'technical', 'hr'] },

  // Offer
  offeredSalary:  { type: Number },
  joiningDate:    { type: Date },

  // Activity log
  activities:     [activitySchema],

  movedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

pipelineSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
pipelineSchema.index({ stage: 1 });

module.exports = mongoose.model('Pipeline', pipelineSchema);
module.exports.STAGES = STAGES;
