const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { isValidEmail, isStrongPassword, sanitize } = require('../middleware/validate');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role, company, phone, city, state, industry, companySize } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    if (!isValidEmail(email))
      return res.status(400).json({ message: 'Invalid email address' });
    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters with uppercase, lowercase and a number' });
    if (!['recruiter', 'client'].includes(role))
      return res.status(400).json({ message: 'Role must be recruiter or client' });

    const cleanEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name: sanitize(name),
      email: cleanEmail,
      password,
      role,
      company: company ? sanitize(company) : undefined,
      phone, city, state, industry, companySize,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isEmailVerified: false,
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user, verifyToken).catch(err =>
      console.error('Verification email failed:', err.message)
    );

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: user.toSafeObject(),
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    // Google-only accounts have no password
    if (user.authProvider === 'google' && !user.password)
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// ID token flow (for future use with Google One Tap)
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential required' });

    // Verify ID token via Google tokeninfo endpoint
    const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenRes.ok) return res.status(401).json({ message: 'Invalid Google token' });

    const payload = await tokenRes.json();
    if (payload.aud !== process.env.GOOGLE_OAUTH_CLIENT_ID)
      return res.status(401).json({ message: 'Token audience mismatch' });

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      // Link Google ID if signing in with Google for the first time on an existing account
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.isEmailVerified = true;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // New user via Google — role is required on first sign-up
      if (!role || !['recruiter', 'client'].includes(role))
        return res.status(400).json({ message: 'Please select your role to continue', requiresRole: true });

      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        role,
        avatar: picture,
        isEmailVerified: true,
        isActive: true,
      });
    }

    if (!user.isActive)
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

// ── POST /api/auth/google-token (access token flow from @react-oauth/google) ──
router.post('/google-token', authLimiter, async (req, res) => {
  try {
    const { accessToken, role } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Google access token required' });

    // Verify the access token with Google and get user info
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Invalid or expired Google token. Please sign in again.' });
    }

    const { sub: googleId, email, name, picture } = await googleRes.json();
    if (!email) return res.status(400).json({ message: 'Could not retrieve email from Google' });

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.isEmailVerified = true;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    } else {
      if (!role || !['recruiter', 'client'].includes(role))
        return res.status(400).json({ message: 'Please select your role to continue', requiresRole: true });

      user = await User.create({
        name, email: email.toLowerCase(), googleId,
        authProvider: 'google', role, avatar: picture,
        isEmailVerified: true, isActive: true,
      });
    }

    if (!user.isActive)
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });

    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('Google token auth error:', err.message);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

// ── GET /api/auth/verify-email ────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token required' });

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now sign in.' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/resend-verification ───────────────────────────────────────
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user || user.isEmailVerified)
      return res.json({ message: 'If that email exists and is unverified, we sent a new link.' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(user, verifyToken).catch(console.error);
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend. Please try again.' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user || user.authProvider === 'google')
      return res.json({ message: 'If that email is registered, you will receive a reset link.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    sendPasswordResetEmail(user, resetToken).catch(console.error);
    res.json({ message: 'If that email is registered, you will receive a reset link.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: 'Token and new password are required' });
    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters with uppercase, lowercase and a number' });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => res.json(req.user));

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'city', 'state', 'designation', 'company', 'industry', 'companySize', 'specializations'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' });
    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'New password must be at least 8 characters with uppercase, lowercase and a number' });

    const user = await User.findById(req.user._id);
    if (!user.password)
      return res.status(400).json({ message: 'This account uses Google Sign-In. Password change is not available.' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed' });
  }
});

module.exports = router;
