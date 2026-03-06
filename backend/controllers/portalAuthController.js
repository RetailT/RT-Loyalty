// controllers/portalAuthController.js
// Auth source: POSBACK_SYSTEM → tb_LOYALTYCUSTOMER_MAIN (MOBILENO based)
// OTP store:   RT_LOYALTY     → tb_OTP_SESSIONS

const jwt = require('jsonwebtoken');
const { getPool, sql }              = require('../config/database');   // POSBACK_SYSTEM
const { getLoyaltyPool, sql: lsql } = require('../config/userdb');     // RT_LOYALTY
const { sendOtpEmail }              = require('../utils/mailer');

const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function shapeCustomer(c, points = {}) {
  return {
    serialNo:        (c.SERIALNO || '').trim(),
    name:            c.CUSTDISPLAY_NAME || c.CUSTFULL_NAME || '',
    email:           c.EMAIL       || '',
    phone:           c.MOBILENO    || '',
    dateOfBirth:     c.DOB         || null,
    loyaltyType:     c.LOYALTY_TYPE || '',
    companyCode:     (c.COMPANY_CODE || '').trim(),
    companyName:     c.COMPANY_NAME  || '',
    isLocked:        (c.CUSTOMER_LOCK || 'F').trim() === 'T',
    availablePoints: parseFloat(points.available || 0),
    totalPoints:     parseFloat(points.earned    || 0),
    redeemedPoints:  parseFloat(points.redeemed  || 0),
  };
}

async function getPointsSummary(pool, serialNo) {
  const result = await pool.request()
    .input('sno', sql.NVarChar, serialNo)
    .query(`
      SELECT
        ISNULL(SUM(CASE WHEN ID='EN' THEN RATE ELSE 0 END), 0) AS earned,
        ISNULL(SUM(CASE WHEN ID='RD' THEN RATE ELSE 0 END), 0) AS redeemed,
        ISNULL(SUM(CASE WHEN ID='EN' THEN RATE ELSE -RATE END), 0) AS available
      FROM tb_LOYALTY_TRANSACTION
      WHERE SERIALNO = @sno AND SMS = 'T'
    `);
  return result.recordset[0] || { earned: 0, redeemed: 0, available: 0 };
}

// POST /api/portal/auth/send-otp  — Body: { phone }
const sendOtp = async (req, res) => {
  try {
    const mobile = (req.body.phone || '').trim();
    if (!mobile)
      return res.status(400).json({ success: false, message: 'phone (mobile number) required.' });

    const posPool = await getPool();
    const result  = await posPool.request()
      .input('mobile', sql.NVarChar, mobile)
      .query(`
        SELECT TOP 1 IDX, SERIALNO, CUSTDISPLAY_NAME, MOBILENO, EMAIL,
                     LOYALTY_TYPE, COMPANY_CODE, COMPANY_NAME, CUSTOMER_LOCK
        FROM tb_LOYALTYCUSTOMER_MAIN
        WHERE MOBILENO = @mobile AND (CUSTOMER_LOCK = 'F' OR CUSTOMER_LOCK = '' OR CUSTOMER_LOCK IS NULL)
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'No loyalty account found for this mobile number.', notFound: true });

    const cust    = result.recordset[0];
    const sendTo  = (cust.EMAIL || '').trim();
    const otp     = generateOTP();
    const expires = new Date(Date.now() + OTP_TTL_MIN * 60000);

    // Store OTP keyed by mobile number
    const loyaltyPool = await getLoyaltyPool();
    await loyaltyPool.request()
      .input('mobile',  lsql.NVarChar, mobile)
      .input('otp',     lsql.NVarChar, otp)
      .input('expires', lsql.DateTime, expires)
      .query(`
        IF EXISTS (SELECT 1 FROM tb_OTP_SESSIONS WHERE EMAIL = @mobile)
          UPDATE tb_OTP_SESSIONS
            SET OTP = @otp, EXPIRES_AT = @expires, IS_USED = 0, CREATED_AT = GETDATE()
          WHERE EMAIL = @mobile
        ELSE
          INSERT INTO tb_OTP_SESSIONS (EMAIL, OTP, EXPIRES_AT, IS_USED, IS_NEW, CREATED_AT)
          VALUES (@mobile, @otp, @expires, 0, 0, GETDATE())
      `);

    if (sendTo) {
      try {
        await sendOtpEmail(sendTo, otp, cust.CUSTDISPLAY_NAME);
        console.log('✅ OTP email sent to', sendTo);
      } catch (e) {
        console.error('❌ OTP email failed:', e.message);
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      success:  true,
      message:  `OTP generated. Expires in ${OTP_TTL_MIN} minutes.`,
      phone:    mobile,
      hasEmail: !!sendTo,
      ...(isDev ? { dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error('sendOtp:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/portal/auth/verify-otp  — Body: { phone, otp }
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'phone and otp required.' });

    const mobile      = phone.trim();
    const loyaltyPool = await getLoyaltyPool();

    const sessionResult = await loyaltyPool.request()
      .input('mobile', lsql.NVarChar, mobile)
      .input('otp',    lsql.NVarChar, String(otp).trim())
      .query(`
        SELECT TOP 1 IDX, EXPIRES_AT, IS_USED
        FROM tb_OTP_SESSIONS
        WHERE EMAIL = @mobile AND OTP = @otp
      `);

    if (!sessionResult.recordset.length)
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });

    const session = sessionResult.recordset[0];
    if (session.IS_USED)
      return res.status(401).json({ success: false, message: 'OTP already used.' });
    if (new Date(session.EXPIRES_AT) < new Date())
      return res.status(401).json({ success: false, message: 'OTP expired. Request a new one.' });

    await loyaltyPool.request()
      .input('mobile2', lsql.NVarChar, mobile)
      .query('UPDATE tb_OTP_SESSIONS SET IS_USED = 1 WHERE EMAIL = @mobile2');

    const posPool    = await getPool();
    const custResult = await posPool.request()
      .input('mobile3', sql.NVarChar, mobile)
      .query(`
        SELECT TOP 1 IDX, SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME,
                     MOBILENO, EMAIL, LOYALTY_TYPE, COMPANY_CODE,
                     COMPANY_NAME, CUSTOMER_LOCK, DOB
        FROM tb_LOYALTYCUSTOMER_MAIN
        WHERE MOBILENO = @mobile3
      `);

    if (!custResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const cust   = custResult.recordset[0];
    const points = await getPointsSummary(posPool, (cust.SERIALNO || '').trim());

    console.log(`✅ Login — ${cust.CUSTDISPLAY_NAME} (${mobile}) — ${new Date().toLocaleTimeString()}`);

    const token = signToken({
      serialNo:     (cust.SERIALNO || '').trim(),
      name:         cust.CUSTDISPLAY_NAME,
      phone:        mobile,
      companyCode:  (cust.COMPANY_CODE || '').trim(),
      isPortalUser: true,
    });

    res.json({ success: true, token, customer: shapeCustomer(cust, points) });
  } catch (err) {
    console.error('verifyOtp:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/portal/auth/qr-login  — Body: { qr_code }
const qrLogin = async (req, res) => {
  try {
    const { qr_code } = req.body;
    if (!qr_code)
      return res.status(400).json({ success: false, message: 'qr_code required.' });

    const posPool = await getPool();
    const result  = await posPool.request()
      .input('qr', sql.NVarChar, String(qr_code).trim())
      .query(`
        SELECT TOP 1 IDX, SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME,
                     MOBILENO, EMAIL, LOYALTY_TYPE, COMPANY_CODE,
                     COMPANY_NAME, CUSTOMER_LOCK, DOB
        FROM tb_LOYALTYCUSTOMER_MAIN
        WHERE SERIALNO = @qr OR SERIALNO2 = @qr OR SERIALNO3 = @qr
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'QR code not recognised.' });

    const cust = result.recordset[0];
    if ((cust.CUSTOMER_LOCK || '').trim() === 'T')
      return res.status(403).json({ success: false, message: 'Account is locked.' });

    const points = await getPointsSummary(posPool, (cust.SERIALNO || '').trim());
    const mobile = (cust.MOBILENO || '').trim();

    console.log(`✅ QR Login — ${cust.CUSTDISPLAY_NAME} (${mobile}) — ${new Date().toLocaleTimeString()}`);

    const token = signToken({
      serialNo:     (cust.SERIALNO || '').trim(),
      name:         cust.CUSTDISPLAY_NAME,
      phone:        mobile,
      companyCode:  (cust.COMPANY_CODE || '').trim(),
      isPortalUser: true,
    });

    res.json({ success: true, token, customer: shapeCustomer(cust, points) });
  } catch (err) {
    console.error('qrLogin:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/portal/auth/logout
const logoutPortal = (req, res) => {
  const { name, phone, reason } = req.body;
  console.log(`🔴 Logout — ${name || 'Unknown'} (${phone || ''}) — ${reason || 'user logged out'} — ${new Date().toLocaleTimeString()}`);
  res.json({ success: true });
};

module.exports = { sendOtp, verifyOtp, qrLogin, logoutPortal };