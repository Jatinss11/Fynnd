const mongoose = require('mongoose');

const PLANS = {
  basic: {
    name: 'Basic',
    price: 4999,
    billingCycle: 'monthly',
    features: {
      jobPostings: 3,
      aiMatches: 10,
      candidateViews: 50,
      resumeDownloads: 10,
      aiInterviews: 0,
      atsAnalysis: 0,
      teamMembers: 1,
      pipelineStages: 4,
      analytics: false,
      prioritySupport: false,
      dedicatedManager: false,
      customBranding: false,
      apiAccess: false,
      bulkUpload: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 14999,
    billingCycle: 'monthly',
    features: {
      jobPostings: 15,
      aiMatches: 100,
      candidateViews: 500,
      resumeDownloads: 100,
      aiInterviews: 20,
      atsAnalysis: 50,
      teamMembers: 5,
      pipelineStages: 11,
      analytics: true,
      prioritySupport: true,
      dedicatedManager: false,
      customBranding: false,
      apiAccess: false,
      bulkUpload: true,
    },
  },
  gold: {
    name: 'Gold',
    price: 39999,
    billingCycle: 'monthly',
    features: {
      jobPostings: -1, // unlimited
      aiMatches: -1,
      candidateViews: -1,
      resumeDownloads: -1,
      aiInterviews: -1,
      atsAnalysis: -1,
      teamMembers: -1,
      pipelineStages: 11,
      analytics: true,
      prioritySupport: true,
      dedicatedManager: true,
      customBranding: true,
      apiAccess: true,
      bulkUpload: true,
    },
  },
};

const usageSchema = new mongoose.Schema({
  jobPostings:      { type: Number, default: 0 },
  aiMatches:        { type: Number, default: 0 },
  candidateViews:   { type: Number, default: 0 },
  resumeDownloads:  { type: Number, default: 0 },
  aiInterviews:     { type: Number, default: 0 },
  atsAnalysis:      { type: Number, default: 0 },
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  clientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan:         { type: String, enum: ['basic', 'premium', 'gold'], default: 'basic' },
  status:       { type: String, enum: ['active', 'expired', 'cancelled', 'trial'], default: 'trial' },
  trialEndsAt:  { type: Date },
  trialDays:    { type: Number, default: 7 },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd:   { type: Date },
  usage:        { type: usageSchema, default: () => ({}) },
  // Payment
  razorpayOrderId:    { type: String },
  razorpayPaymentId:  { type: String },
  invoices:     [{ amount: Number, plan: String, paidAt: Date, invoiceId: String }],
}, { timestamps: true });

subscriptionSchema.methods.canUse = function (feature) {
  const plan = PLANS[this.plan];
  if (!plan) return false;
  if (this.status === 'expired' || this.status === 'cancelled') return false;
  const limit = plan.features[feature];
  if (limit === undefined) return false;
  if (typeof limit === 'boolean') return limit;
  if (limit === -1) return true; // unlimited
  const used = this.usage[feature] || 0;
  return used < limit;
};

subscriptionSchema.methods.getLimit = function (feature) {
  const plan = PLANS[this.plan];
  if (!plan) return 0;
  return plan.features[feature];
};

subscriptionSchema.statics.PLANS = PLANS;

module.exports = mongoose.model('Subscription', subscriptionSchema);
module.exports.PLANS = PLANS;
