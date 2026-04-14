const router = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Subscription = require('../models/Subscription');
const { PLANS } = require('../models/Subscription');
const { auth, requireRole } = require('../middleware/auth');

// ── Razorpay instance (lazy — only if keys configured) ────────────────────────
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── Helper: create/get trial subscription ─────────────────────────────────────
async function getOrCreateTrial(clientId) {
  let sub = await Subscription.findOne({ clientId });
  if (!sub) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial
    sub = await Subscription.create({
      clientId,
      plan: 'basic',
      status: 'trial',
      trialEndsAt: trialEnd,
      currentPeriodEnd: trialEnd,
    });
  }
  // Auto-expire trial
  if (sub.status === 'trial' && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
    sub.status = 'expired';
    await sub.save();
  }
  return sub;
}

// GET /api/billing/plans — public
router.get('/plans', (req, res) => res.json(PLANS));

// GET /api/billing/subscription
router.get('/subscription', auth, requireRole('client'), async (req, res) => {
  try {
    const sub = await getOrCreateTrial(req.user._id);
    res.json({ subscription: sub, plans: PLANS });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/billing/usage
router.get('/usage', auth, requireRole('client'), async (req, res) => {
  try {
    const sub = await Subscription.findOne({ clientId: req.user._id });
    if (!sub) return res.json({ usage: {}, plan: 'basic' });

    const plan = PLANS[sub.plan];
    const usageWithLimits = {};
    Object.keys(plan.features).forEach(key => {
      const limit = plan.features[key];
      const used = sub.usage?.[key] || 0;
      if (typeof limit === 'number') {
        usageWithLimits[key] = { used, limit, unlimited: limit === -1 };
      }
    });
    res.json({ usage: usageWithLimits, plan: sub.plan, status: sub.status, periodEnd: sub.currentPeriodEnd });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── RAZORPAY ──────────────────────────────────────────────────────────────────

// POST /api/billing/razorpay/create-order
router.post('/razorpay/create-order', auth, requireRole('client'), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const razorpay = getRazorpay();

    // If Razorpay not configured, simulate order for dev
    if (!razorpay) {
      return res.json({
        orderId: `order_dev_${Date.now()}`,
        amount: PLANS[plan].price * 100,
        currency: 'INR',
        plan,
        keyId: 'rzp_test_demo',
        devMode: true,
        message: 'Add RAZORPAY_KEY_ID to .env for real payments',
      });
    }

    const order = await razorpay.orders.create({
      amount: PLANS[plan].price * 100, // paise
      currency: 'INR',
      receipt: `fynnd_${req.user._id}_${Date.now()}`,
      notes: { plan, clientId: req.user._id.toString(), clientEmail: req.user.email },
    });

    // Save order ID to subscription
    await Subscription.findOneAndUpdate(
      { clientId: req.user._id },
      { razorpayOrderId: order.id },
      { upsert: true }
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// POST /api/billing/razorpay/verify — verify payment signature
router.post('/razorpay/verify', auth, requireRole('client'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, devMode } = req.body;

    // Dev mode — skip signature verification
    if (!devMode && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret') {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      }
    }

    // Activate subscription
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = await Subscription.findOneAndUpdate(
      { clientId: req.user._id },
      {
        plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        razorpayPaymentId: razorpay_payment_id || `dev_${Date.now()}`,
        'usage.jobPostings': 0,
        'usage.aiMatches': 0,
        'usage.candidateViews': 0,
        'usage.resumeDownloads': 0,
        'usage.aiInterviews': 0,
        'usage.atsAnalysis': 0,
        $push: {
          invoices: {
            amount: PLANS[plan].price,
            plan,
            paidAt: new Date(),
            invoiceId: `INV-${Date.now()}`,
            paymentId: razorpay_payment_id || `dev_${Date.now()}`,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, subscription: sub, message: `${PLANS[plan].name} plan activated!` });
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// ── PHONEPE ───────────────────────────────────────────────────────────────────

// POST /api/billing/phonepe/initiate
router.post('/phonepe/initiate', auth, requireRole('client'), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

    // If PhonePe not configured, return dev mode
    if (!merchantId || merchantId === 'your_phonepe_merchant_id') {
      return res.json({
        devMode: true,
        plan,
        amount: PLANS[plan].price,
        message: 'Add PHONEPE_MERCHANT_ID to .env for real PhonePe payments',
        redirectUrl: `${process.env.FRONTEND_URL}/billing?plan=${plan}&payment=phonepe_dev`,
      });
    }

    const merchantTransactionId = `FYNND_${req.user._id}_${Date.now()}`;
    const amount = PLANS[plan].price * 100; // paise

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: req.user._id.toString(),
      amount,
      redirectUrl: `${process.env.FRONTEND_URL}/billing/phonepe-callback?txnId=${merchantTransactionId}&plan=${plan}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/billing/phonepe/callback`,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = crypto
      .createHash('sha256')
      .update(base64Payload + '/pg/v1/pay' + saltKey)
      .digest('hex') + '###' + saltIndex;

    const response = await fetch('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();
    if (data.success) {
      res.json({ redirectUrl: data.data.instrumentResponse.redirectInfo.url, merchantTransactionId });
    } else {
      res.status(400).json({ message: 'PhonePe initiation failed', details: data });
    }
  } catch (err) {
    console.error('PhonePe error:', err.message);
    res.status(500).json({ message: 'PhonePe payment initiation failed' });
  }
});

// POST /api/billing/phonepe/callback — PhonePe server callback
router.post('/phonepe/callback', async (req, res) => {
  try {
    const { response } = req.body;
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString());

    if (decoded.code === 'PAYMENT_SUCCESS') {
      const { merchantUserId, merchantTransactionId } = decoded.data;
      // Extract plan from transaction ID or notes
      // In production, store txnId→plan mapping in DB
      console.log('PhonePe payment success:', merchantTransactionId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// POST /api/billing/phonepe/verify — verify after redirect
router.post('/phonepe/verify', auth, requireRole('client'), async (req, res) => {
  try {
    const { merchantTransactionId, plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

    // Dev mode
    if (!merchantId || merchantId === 'your_phonepe_merchant_id') {
      return activatePlan(req.user._id, plan, `phonepe_dev_${Date.now()}`, res);
    }

    const checksum = crypto
      .createHash('sha256')
      .update(`/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey)
      .digest('hex') + '###' + saltIndex;

    const response = await fetch(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      { headers: { 'X-VERIFY': checksum, 'X-MERCHANT-ID': merchantId } }
    );
    const data = await response.json();

    if (data.success && data.code === 'PAYMENT_SUCCESS') {
      return activatePlan(req.user._id, plan, merchantTransactionId, res);
    }
    res.status(400).json({ message: 'Payment not successful', status: data.code });
  } catch (err) {
    res.status(500).json({ message: 'PhonePe verification failed' });
  }
});

async function activatePlan(clientId, plan, paymentId, res) {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const sub = await Subscription.findOneAndUpdate(
    { clientId },
    {
      plan, status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      razorpayPaymentId: paymentId,
      'usage.jobPostings': 0, 'usage.aiMatches': 0, 'usage.candidateViews': 0,
      'usage.resumeDownloads': 0, 'usage.aiInterviews': 0, 'usage.atsAnalysis': 0,
      $push: { invoices: { amount: PLANS[plan].price, plan, paidAt: new Date(), invoiceId: `INV-${Date.now()}`, paymentId } },
    },
    { upsert: true, new: true }
  );
  res.json({ success: true, subscription: sub, message: `${PLANS[plan].name} plan activated!` });
}

// GET /api/billing/all — admin
router.get('/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const subs = await Subscription.find().populate('clientId', 'name email company').sort('-createdAt');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
