const nodemailer = require('nodemailer');

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send a welcome email to a new customer
 */
async function sendWelcomeEmail(customer) {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured — skipping welcome email.');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #FF6B00, #FF8C00); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 2px;">RETAILCO</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px; letter-spacing: 3px; text-transform: uppercase;">Loyalty System</p>
      </div>
      <div style="background: #ffffff; padding: 36px; border: 1px solid #e5e5e5; border-top: none;">
        <h2 style="color: #111; margin: 0 0 12px;">Welcome, ${customer.name}! 🎉</h2>
        <p style="color: #555; line-height: 1.7;">You've been registered to the <strong>RetailCo Loyalty Program</strong>. Start earning points on every purchase!</p>

        <div style="background: #FFF7F0; border: 1px solid #FFE4CC; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Membership Details</p>
          <p style="margin: 4px 0; color: #111;"><strong>Membership ID:</strong> ${customer.membershipId}</p>
          <p style="margin: 4px 0; color: #111;"><strong>Tier:</strong> ${customer.membershipTier}</p>
          <p style="margin: 4px 0; color: #111;"><strong>Welcome Bonus:</strong> <span style="color: #FF6B00; font-weight: bold;">500 Points</span></p>
        </div>

        <p style="color: #555; font-size: 13px; line-height: 1.7;">Show your <strong>Membership ID</strong> or QR code at any RetailCo branch to earn and redeem points.</p>
        <p style="color: #888; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">© ${new Date().getFullYear()} RetailCo Loyalty System. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'RetailCo <no-reply@retailco.lk>',
    to:      customer.email,
    subject: `Welcome to RetailCo Loyalty — ${customer.membershipId}`,
    html,
  });

  console.log(`Welcome email sent to ${customer.email}`);
}

/**
 * Send points update notification
 */
async function sendPointsEmail(customer, transaction) {
  if (!process.env.EMAIL_USER) return;

  const transporter = createTransporter();
  const isEarned    = transaction.points > 0;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #FF6B00, #FF8C00); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">Points ${isEarned ? 'Earned' : 'Redeemed'}!</h2>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e5e5e5; border-top: none;">
        <p style="color: #555;">Hi <strong>${customer.name}</strong>,</p>
        <div style="background: #FFF7F0; border: 1px solid #FFE4CC; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Points ${isEarned ? 'Earned' : 'Redeemed'}</p>
          <p style="color: #FF6B00; font-size: 42px; font-weight: 900; margin: 0;">${isEarned ? '+' : ''}${transaction.points}</p>
          <p style="color: #888; font-size: 13px; margin: 8px 0 0;">${transaction.description}</p>
        </div>
        <p style="color: #555; margin: 0;">Current Balance: <strong style="color: #FF6B00;">${customer.availablePoints.toLocaleString()} pts</strong></p>
        <p style="color: #888; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">© ${new Date().getFullYear()} RetailCo Loyalty System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'RetailCo <no-reply@retailco.lk>',
    to:      customer.email,
    subject: `RetailCo: ${isEarned ? '+' : ''}${transaction.points} Points ${isEarned ? 'Earned' : 'Redeemed'}`,
    html,
  });
}

module.exports = { sendWelcomeEmail, sendPointsEmail };