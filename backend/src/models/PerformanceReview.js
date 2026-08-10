const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema({
  employeeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  reviewPeriod:  { type: String, required: true }, // e.g., "Q1 2024", "Jan-Jun 2024"
  reviewDate:    { type: Date, required: true },
  
  // Ratings (1-5 scale)
  ratings: {
    quality:       { type: Number, min: 1, max: 5 },
    productivity:  { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    teamwork:      { type: Number, min: 1, max: 5 },
    initiative:    { type: Number, min: 1, max: 5 },
    punctuality:   { type: Number, min: 1, max: 5 },
  },
  
  overallRating: { type: Number, min: 1, max: 5, required: true },
  
  // Feedback
  strengths:     { type: String },
  areasOfImprovement: { type: String },
  achievements:  { type: String },
  goals:         { type: String },
  
  // Employee Comments
  employeeComments: { type: String },
  employeeAcknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
  
  // Outcome
  salaryRevision: { type: Number }, // percentage or amount
  promotion:      { type: String },
  trainingRecommended: [String],
  
  status:        { type: String, enum: ['Draft', 'Submitted', 'Acknowledged', 'Completed'], default: 'Draft' },
  
  nextReviewDate: { type: Date },
}, { timestamps: true });

performanceReviewSchema.index({ employeeId: 1, reviewDate: -1 });
performanceReviewSchema.index({ companyId: 1, reviewDate: -1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
