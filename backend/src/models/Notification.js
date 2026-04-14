const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['pipeline_update', 'interview_scheduled', 'offer_released', 'new_job', 'new_candidate', 'feedback', 'system'], default: 'system' },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  link:     { type: String },
  read:     { type: Boolean, default: false },
  meta:     { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
