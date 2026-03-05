// utils/mailer.js
const nodemailer = require('nodemailer');

const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES) || 5;

// ─── Single shared transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT  || process.env.EMAIL_PORT)  || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER || process.env.EMAIL_USER,
    pass: process.env.MAIL_PASS || process.env.EMAIL_PASS,
  },
});

console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS:', process.env.MAIL_PASS ? '✅ set' : '❌ undefined');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mail server connection failed:', error.message);
  } else {
    console.log('✅ Mail server ready');
  }
});

const FROM =
  process.env.MAIL_FROM ||
  process.env.EMAIL_FROM ||
  process.env.MAIL_USER  ||
  process.env.EMAIL_USER ||
  'Retail <no-reply@retail.lk>';

// ─── Low-level helper ─────────────────────────────────────────────────────────
const sendMail = ({ to, subject, html, text }) =>
  transporter.sendMail({ from: FROM, to, subject, html, text });

// ─── Welcome email ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (customer) => {
  if (!process.env.MAIL_USER && !process.env.EMAIL_USER) {
    console.log('Email not configured — skipping welcome email.');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#FF6B00,#FF8C00);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">RETAIL</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Loyalty System</p>
      </div>
      <div style="background:#ffffff;padding:36px;border:1px solid #e5e5e5;border-top:none;">
        <h2 style="color:#111;margin:0 0 12px;">Welcome, ${customer.name}! 🎉</h2>
        <p style="color:#555;line-height:1.7;">You've been registered to the <strong>Retail Loyalty Program</strong>. Start earning points on every purchase!</p>

        <div style="background:#FFF7F0;border:1px solid #FFE4CC;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your Membership Details</p>
          <p style="margin:4px 0;color:#111;"><strong>Membership ID:</strong> ${customer.membershipId}</p>
          <p style="margin:4px 0;color:#111;"><strong>Tier:</strong> ${customer.membershipTier}</p>
          <p style="margin:4px 0;color:#111;"><strong>Welcome Bonus:</strong> <span style="color:#FF6B00;font-weight:bold;">500 Points</span></p>
        </div>

        <p style="color:#555;font-size:13px;line-height:1.7;">Show your <strong>Membership ID</strong> or QR code at any Retail branch to earn and redeem points.</p>
        <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">© ${new Date().getFullYear()} Retail Loyalty System. All rights reserved.</p>
      </div>
    </div>`;

  await sendMail({
    to:      customer.email,
    subject: `Welcome to Retail Loyalty — ${customer.membershipId}`,
    html,
  });
  console.log(`Welcome email sent to ${customer.email}`);
};

// ─── Points update email ──────────────────────────────────────────────────────
const sendPointsEmail = async (customer, transaction) => {
  if (!process.env.MAIL_USER && !process.env.EMAIL_USER) return;

  const isEarned = transaction.points > 0;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#FF6B00,#FF8C00);padding:24px 32px;border-radius:12px 12px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:20px;">Points ${isEarned ? 'Earned' : 'Redeemed'}!</h2>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e5e5;border-top:none;">
        <p style="color:#555;">Hi <strong>${customer.name}</strong>,</p>
        <div style="background:#FFF7F0;border:1px solid #FFE4CC;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Points ${isEarned ? 'Earned' : 'Redeemed'}</p>
          <p style="color:#FF6B00;font-size:42px;font-weight:900;margin:0;">${isEarned ? '+' : ''}${transaction.points}</p>
          <p style="color:#888;font-size:13px;margin:8px 0 0;">${transaction.description}</p>
        </div>
        <p style="color:#555;margin:0;">Current Balance: <strong style="color:#FF6B00;">${customer.availablePoints.toLocaleString()} pts</strong></p>
        <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">© ${new Date().getFullYear()} Retail Loyalty System</p>
      </div>
    </div>`;

  await sendMail({
    to:      customer.email,
    subject: `Retail: ${isEarned ? '+' : ''}${transaction.points} Points ${isEarned ? 'Earned' : 'Redeemed'}`,
    html,
  });
};

// ─── Password reset email ─────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#FF6B00;margin-bottom:8px;">Password Reset Request</h2>
      <p style="color:#475569;">Click the button below to reset your password. This link will expire shortly.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}"
           style="background:#FF6B00;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </div>
      <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`;

  await sendMail({
    to:      email,
    subject: 'Password Reset Request',
    html,
    text: `Reset your password here: ${resetLink}`,
  });
};

// ─── OTP email ────────────────────────────────────────────────────────────────
const sendOtpEmail = async (to, otp, name = '') => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#FF6B00;margin-bottom:8px;">Your Loyalty Portal OTP</h2>
      ${name ? `<p style="margin:0 0 16px;">Hi <strong>${name}</strong>,</p>` : ''}
      <p style="margin:0 0 24px;color:#475569;">Use the code below to sign in. It expires in ${OTP_TTL_MIN} minutes.</p>
      <div style="font-size:42px;font-weight:700;letter-spacing:14px;color:#1e293b;text-align:center;
                  background:#f1f5f9;border-radius:8px;padding:20px 0;margin-bottom:24px;">
        ${otp}
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>`;

  return sendMail({
    to,
    subject: `${otp} — Your Loyalty Portal sign-in code`,
    html,
    text: `Your OTP is: ${otp}. It expires in ${OTP_TTL_MIN} minutes.`,
  });
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendPointsEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
};