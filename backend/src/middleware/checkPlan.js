const Subscription = require('../models/Subscription');

/**
 * Middleware to check if client has access to a feature
 * Usage: checkPlan('aiMatches')
 */
const checkPlan = (feature) => async (req, res, next) => {
  // Only enforce for clients
  if (req.user.role !== 'client') return next();

  try {
    let sub = await Subscription.findOne({ clientId: req.user._id });

    // Auto-create trial subscription for new clients
    if (!sub) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      sub = await Subscription.create({
        clientId: req.user._id,
        plan: 'basic',
        status: 'trial',
        trialEndsAt: trialEnd,
        currentPeriodEnd: trialEnd,
      });
    }

    if (!sub.canUse(feature)) {
      const limit = sub.getLimit(feature);
      return res.status(403).json({
        message: `You've reached your ${feature} limit on the ${sub.plan} plan.`,
        feature,
        limit,
        plan: sub.plan,
        upgradeRequired: true,
      });
    }

    // Increment usage for countable features
    const countable = ['aiMatches', 'candidateViews', 'resumeDownloads', 'aiInterviews', 'atsAnalysis'];
    if (countable.includes(feature)) {
      await Subscription.findByIdAndUpdate(sub._id, { $inc: { [`usage.${feature}`]: 1 } });
    }

    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkPlan;
