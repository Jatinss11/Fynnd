const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'noreply@fynnd.in';
const FRONTEND = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3001';

async function sendVerificationEmail(user, token) {
  const url = `${FRONTEND}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"fynnd" <${FROM}>`,
    to: user.email,
    subject: 'Verify your fynnd account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Welcome to fynnd, ${user.name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(user, token) {
  const url = `${FRONTEND}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"fynnd" <${FROM}>`,
    to: user.email,
    subject: 'Reset your fynnd password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Password Reset</h2>
        <p>Hi ${user.name}, we received a request to reset your password.</p>
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
