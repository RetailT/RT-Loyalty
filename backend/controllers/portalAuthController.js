// controllers/portalAuthController.js
const jwt    = require('jsonwebtoken');
const { getLoyaltyPool, sql } = require('../config/userdb');
const { sendOtpEmail }        = require('../utils/mailer');

const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/portal/auth/send-otp
// Body: { email } or { phone }
const sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone)
      return res.status(400).json({ success: false, message: 'email or phone required.' });

    const pool = await getLoyaltyPool();
    const req2 = pool.request();
    let where  = '';

    if (email) {
      req2.input('val', sql.NVarChar, email.trim().toLowerCase());
      where = 'LOWER(EMAIL) = @val';
    } else {
      req2.input('val', sql.NVarChar, phone.trim());
      where = 'PHONE = @val';
    }

    const result = await req2.query(
      `SELECT TOP 1 IDX, NAME, EMAIL, PHONE, STATUS FROM tb_CUSTOMERS WHERE ${where}`
    );

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'No loyalty account found.', notFound: true });

    const cust = result.recordset[0];
    if (cust.STATUS !== 'active')
      return res.status(403).json({ success: false, message: 'Account is not active.' });

    const sendTo  = (email || cust.EMAIL || '').trim().toLowerCase();
    const otp     = generateOTP();
    const expires = new Date(Date.now() + OTP_TTL_MIN * 60000);
    const isNew   = 0;

    // Upsert OTP session keyed by EMAIL
    await pool.request()
      .input('email',   sql.NVarChar, sendTo)
      .input('otp',     sql.NVarChar, otp)
      .input('expires', sql.DateTime, expires)
      .input('isnew',   sql.Bit,      isNew)
      .query(`
        IF EXISTS (SELECT 1 FROM tb_OTP_SESSIONS WHERE EMAIL = @email)
          UPDATE tb_OTP_SESSIONS
            SET OTP = @otp, EXPIRES_AT = @expires, IS_USED = 0, IS_NEW = @isnew, CREATED_AT = GETDATE()
          WHERE EMAIL = @email
        ELSE
          INSERT INTO tb_OTP_SESSIONS (EMAIL, OTP, EXPIRES_AT, IS_USED, IS_NEW, CREATED_AT)
          VALUES (@email, @otp, @expires, 0, @isnew, GETDATE())
      `);

    // Send OTP email
    if (sendTo) {
      try {
        await sendOtpEmail(sendTo, otp, cust.NAME);
        console.log('✅ OTP email sent to', sendTo);
      } catch (e) {
        console.error('❌ OTP email failed:', e.message);
        console.error(e); // full error object
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      success: true,
      message: `OTP sent to ${sendTo}. Expires in ${OTP_TTL_MIN} minutes.`,
      email:   sendTo,
      custid:  cust.IDX,
      ...(isDev ? { _dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error('sendOtp:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/portal/auth/verify-otp
// Body: { email, otp }
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'email and otp required.' });

    const normalEmail = email.trim().toLowerCase();
    const pool        = await getLoyaltyPool();

    // Check OTP session
    const sessionResult = await pool.request()
      .input('email', sql.NVarChar, normalEmail)
      .input('otp',   sql.NVarChar, String(otp).trim())
      .query(`
        SELECT TOP 1 IDX, EXPIRES_AT, IS_USED
        FROM tb_OTP_SESSIONS
        WHERE EMAIL = @email AND OTP = @otp
      `);

    if (!sessionResult.recordset.length)
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });

    const session = sessionResult.recordset[0];

    if (session.IS_USED)
      return res.status(401).json({ success: false, message: 'OTP already used.' });

    if (new Date(session.EXPIRES_AT) < new Date())
      return res.status(401).json({ success: false, message: 'OTP has expired. Request a new one.' });

    // Mark OTP used
    await pool.request()
      .input('email2', sql.NVarChar, normalEmail)
      .query('UPDATE tb_OTP_SESSIONS SET IS_USED = 1 WHERE EMAIL = @email2');

    // Get customer
    const custResult = await pool.request()
      .input('email3', sql.NVarChar, normalEmail)
      .query(`
        SELECT TOP 1 IDX, NAME, EMAIL, PHONE, MEMBERSHIP_ID,
               AVAILABLE_POINTS, TOTAL_POINTS, MEMBERSHIP_TIER,
               STATUS, JOIN_DATE, QR_CODE
        FROM tb_CUSTOMERS
        WHERE LOWER(EMAIL) = @email3
      `);

    if (!custResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const cust = custResult.recordset[0];

    // Update last activity
    await pool.request()
      .input('custid', sql.Numeric, cust.IDX)
      .query('UPDATE tb_CUSTOMERS SET LAST_ACTIVITY = CAST(GETDATE() AS DATE), UPDATED_AT = GETDATE() WHERE IDX = @custid');

    const token = signToken({
      custid:       cust.IDX,
      name:         cust.NAME,
      email:        cust.EMAIL,
      isPortalUser: true,
    });

    res.json({
      success: true,
      token,
      customer: {
        idx:             cust.IDX,
        name:            cust.NAME,
        email:           cust.EMAIL,
        phone:           cust.PHONE,
        membershipId:    cust.MEMBERSHIP_ID,
        membershipTier:  cust.MEMBERSHIP_TIER,
        availablePoints: cust.AVAILABLE_POINTS,
        totalPoints:     cust.TOTAL_POINTS,
        joinDate:        cust.JOIN_DATE,
        qrCode:          cust.QR_CODE,
      },
    });
  } catch (err) {
    console.error('verifyOtp:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { sendOtp, verifyOtp };