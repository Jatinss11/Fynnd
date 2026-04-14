const router = require('express').Router();
const Subscription = require('../models/Subscription');
const { PLANS } = require('../models/Subscription');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/subscription/plans — public
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// GET /api/subscription/my — get current client subscription
router.get('/my', auth, requireRole('client'), async (req, res) => {
  try {
    let sub = await Subscription.findOne({ clientId: req.user._id });
    if (!sub) {
      // Auto-create trial
      sub = await Subscription.create({
        clientId: req.user._id,
        plan: 'basic',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }
    const plan = PLANS[sub.plan];
    res.json({ ...sub.toObject(), planDetails: plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subscription/upgrade — simulate upgrade (integrate Razorpay in prod)
router.post('/upgrade', auth, requireRole('client'), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const sub = await Subscription.findOneAndUpdate(
      { clientId: req.user._id },
      {
        plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $push: {
          invoices: {
            amount: PLANS[plan].price,
            plan,
            paidAt: new Date(),
            invoiceId: `INV-${Date.now()}`,
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: `Upgraded to ${plan}`, subscription: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subscription/track — track usage
router.post('/track', auth, requireRole('client'), async (req, res) => {
  try {
    const { feature } = req.body;
    const sub = await Subscription.findOne({ clientId: req.user._id });
    if (!sub) return res.status(404).json({ message: 'No subscription found' });

    if (!sub.canUse(feature)) {
      return res.status(403).json({
        message: `You've reached your ${feature} limit on the ${sub.plan} plan. Please upgrade.`,
        limitReached: true,
        feature,
        currentPlan: sub.plan,
      });
    }

    await Subscription.findByIdAndUpdate(sub._id, { $inc: { [`usage.${feature}`]: 1 } });
    res.json({ ok: true, remaining: sub.getLimit(feature) === -1 ? 'unlimited' : sub.getLimit(feature) - (sub.usage[feature] || 0) - 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/subscription/all — admin view all subscriptions
router.get('/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const subs = await Subscription.find().populate('clientId', 'name email company').sort('-createdAt');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
