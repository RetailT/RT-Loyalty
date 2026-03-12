const { getPosbackPool, getLoyaltyPool, sql } = require('../config/userdb');
const jwt = require('jsonwebtoken');
const { sendOtpSMS } = require('../utils/sms');

const JWT_SECRET  = process.env.JWT_SECRET || 'rt_loyalty_secret';
const JWT_EXPIRES = '8h';
const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;
const IS_DEV      = process.env.NODE_ENV !== 'production';

const OTP_RATE_LIMIT_COUNT = 2;
const OTP_RATE_LIMIT_MIN   = 5;

function nowStr() { return new Date().toLocaleTimeString('en-GB'); }

async function getPointsSummary(posPool, serialNo, posbackCode) {
  const r = await posPool.request()
    .input('sno',  sql.NVarChar, serialNo)
    .input('code', sql.Char,     posbackCode)
    .query(`
      SELECT
        SUM(CASE WHEN ID='EN' THEN RATE ELSE 0     END) AS totalPoints,
        SUM(CASE WHEN ID='RD' THEN RATE ELSE 0     END) AS redeemedPoints,
        SUM(CASE WHEN ID='EN' THEN RATE ELSE -RATE END) AS availablePoints
      FROM dbo.tb_LOYALTY_TRANSACTION
      WHERE SERIALNO = @sno AND COMPANY_CODE = @code AND SMS = 'T'
    `);
  const row = r.recordset[0] || {};
  return {
    totalPoints:     parseFloat(row.totalPoints     || 0),
    redeemedPoints:  parseFloat(row.redeemedPoints  || 0),
    availablePoints: parseFloat(row.availablePoints || 0),
  };
}

function shapeCustomer(row, points) {
  return {
    serialNo:    row.SERIALNO,
    name:        row.CUSTDISPLAY_NAME || row.CUSTFULL_NAME,
    email:       row.EMAIL            || '',
    phone:       row.MOBILENO,
    dateOfBirth: row.DOB              || null,
    city:        row.CITY             || '',
    occupation:  row.OCCUPATION       || '',
    loyaltyType: row.LOYALTY_TYPE     || '',
    companyCode: row.COMPANY_CODE,
    companyName: row.COMPANY_NAME,
    isLocked:    row.CUSTOMER_LOCK === 'T',
    ...points,
  };
}

/* ── sendOtp ─────────────────────────────────────────────── */
exports.sendOtp = async (req, res) => {
  try {
    const { phone }                      = req.body;
    const { POSBACK_CODE, COMPANY_NAME } = req.company;

    if (!phone) return res.status(400).json({ success: false, message: 'Phone required.' });

    const loyPool = await getLoyaltyPool();

    // Rate limiting
    const rateCheck = await loyPool.request()
      .input('phone', sql.NVarChar, phone.trim())
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .input('mins',  sql.Int,      OTP_RATE_LIMIT_MIN)
      .input('max',   sql.Int,      OTP_RATE_LIMIT_COUNT)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM dbo.tb_OTP_SESSIONS
        WHERE PHONE = @phone
          AND COMPANY_CODE = @code
          AND CREATED_AT > DATEADD(MINUTE, -@mins, GETDATE())
      `);

    if (rateCheck.recordset[0].cnt >= OTP_RATE_LIMIT_COUNT) {
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Please wait ${OTP_RATE_LIMIT_MIN} minutes.`,
      });
    }

    // Check customer exists
    const posPool = await getPosbackPool();
    const found   = await posPool.request()
      .input('mob',  sql.NVarChar, phone.trim())
      .input('code', sql.Char,     POSBACK_CODE)
      .query(`
        SELECT TOP 1 SERIALNO, CUSTDISPLAY_NAME, MOBILENO, EMAIL, COMPANY_NAME
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE MOBILENO = @mob AND COMPANY_CODE = @code AND CUSTOMER_LOCK = 'F'
      `);

    if (!found.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'No loyalty account found for this number at ' + COMPANY_NAME + '.',
      });
    }

    const otp     = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + OTP_TTL_MIN * 60000);
    const custRow = found.recordset[0];
    const shop    = custRow.COMPANY_NAME || COMPANY_NAME;

    // Store OTP with PHONE + COMPANY_CODE
    await loyPool.request()
      .input('phone',   sql.NVarChar, phone.trim())
      .input('code',    sql.NVarChar, POSBACK_CODE)
      .input('email',   sql.NVarChar, phone.trim())
      .input('otp',     sql.NVarChar, otp)
      .input('expires', sql.DateTime, expires)
      .query(`
        MERGE dbo.tb_OTP_SESSIONS AS T
        USING (SELECT @phone AS PHONE, @code AS COMPANY_CODE) AS S
          ON T.PHONE = S.PHONE AND T.COMPANY_CODE = S.COMPANY_CODE
        WHEN MATCHED THEN
          UPDATE SET OTP = @otp, EXPIRES_AT = @expires, CREATED_AT = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (EMAIL, PHONE, COMPANY_CODE, OTP, EXPIRES_AT, CREATED_AT)
          VALUES (@email, @phone, @code, @otp, @expires, GETDATE());
      `);

    const hasEmail = !!(custRow.EMAIL || '').trim();

    // ✅ Always send SMS OTP
    sendOtpSMS(phone.trim(), otp, shop).catch(err =>
      console.error('[sendOtp] SMS error:', err.message)
    );

    // ✅ Also send email if available
    if (hasEmail) {
      console.log(`📧 OTP email queued for ${phone} @ ${shop}`);
      // TODO: sendOtpEmail(custRow.EMAIL, otp, custRow.CUSTDISPLAY_NAME);
    }

    console.log(`📱 OTP for ${phone} @ ${shop}: ${otp}`);

    res.json({ success: true, hasEmail, ...(IS_DEV ? { dev_otp: otp } : {}) });
  } catch (err) {
    console.error('[sendOtp]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── verifyOtp ───────────────────────────────────────────── */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp }                 = req.body;
    const { POSBACK_CODE, COMPANY_NAME } = req.company;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP required.' });

    const loyPool = await getLoyaltyPool();

    const sess = await loyPool.request()
      .input('phone', sql.NVarChar, phone.trim())
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .query(`
        SELECT TOP 1 OTP, EXPIRES_AT
        FROM dbo.tb_OTP_SESSIONS
        WHERE PHONE = @phone AND COMPANY_CODE = @code
      `);

    if (!sess.recordset.length)
      return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });

    const { OTP, EXPIRES_AT } = sess.recordset[0];

    if (new Date() > new Date(EXPIRES_AT))
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    if (OTP.trim() !== otp.trim())
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });

    // Clean up used OTP
    await loyPool.request()
      .input('phone', sql.NVarChar, phone.trim())
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .query(`DELETE FROM dbo.tb_OTP_SESSIONS WHERE PHONE = @phone AND COMPANY_CODE = @code`);

    // Get customer
    const posPool = await getPosbackPool();
    const cust    = await posPool.request()
      .input('mob',  sql.NVarChar, phone.trim())
      .input('code', sql.Char,     POSBACK_CODE)
      .query(`
        SELECT TOP 1 SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME, MOBILENO,
                     EMAIL, DOB, CITY, OCCUPATION, LOYALTY_TYPE,
                     COMPANY_CODE, COMPANY_NAME, CUSTOMER_LOCK
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE MOBILENO = @mob AND COMPANY_CODE = @code AND CUSTOMER_LOCK = 'F'
      `);

    if (!cust.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const row      = cust.recordset[0];
    const points   = await getPointsSummary(posPool, row.SERIALNO, POSBACK_CODE);
    const customer = shapeCustomer(row, points);

    const token = jwt.sign(
      {
        serialNo:    customer.serialNo,
        name:        customer.name,
        phone:       customer.phone,
        companyCode: POSBACK_CODE,
        companyName: customer.companyName,
        isPortalUser: true,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`✅ Login — ${customer.name} (${customer.phone}) @ ${customer.companyName} — ${nowStr()}`);
    res.json({ success: true, token, customer });
  } catch (err) {
    console.error('[verifyOtp]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── qrLogin ─────────────────────────────────────────────── */
exports.qrLogin = async (req, res) => {
  try {
    const { qrCode }                     = req.body;
    const { POSBACK_CODE, COMPANY_NAME } = req.company;

    if (!qrCode)
      return res.status(400).json({ success: false, message: 'QR code required.' });

    const posPool = await getPosbackPool();
    const result  = await posPool.request()
      .input('sno',  sql.NVarChar, qrCode.trim())
      .input('code', sql.Char,     POSBACK_CODE)
      .query(`
        SELECT TOP 1 SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME, MOBILENO,
                     EMAIL, DOB, CITY, OCCUPATION, LOYALTY_TYPE,
                     COMPANY_CODE, COMPANY_NAME, CUSTOMER_LOCK
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE (SERIALNO = @sno OR SERIALNO2 = @sno OR SERIALNO3 = @sno)
          AND COMPANY_CODE = @code AND CUSTOMER_LOCK = 'F'
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'QR code not recognized at ' + COMPANY_NAME + '.' });

    const row      = result.recordset[0];
    const points   = await getPointsSummary(posPool, row.SERIALNO, POSBACK_CODE);
    const customer = shapeCustomer(row, points);

    const token = jwt.sign(
      {
        serialNo:    customer.serialNo,
        name:        customer.name,
        phone:       customer.phone,
        companyCode: POSBACK_CODE,
        companyName: customer.companyName,
        isPortalUser: true,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`✅ QR Login — ${customer.name} (${customer.phone}) @ ${customer.companyName} — ${nowStr()}`);
    res.json({ success: true, token, customer });
  } catch (err) {
    console.error('[qrLogin]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── logoutPortal ────────────────────────────────────────── */
exports.logoutPortal = (req, res) => {
  const { name, phone, reason } = req.body || {};
  console.log(`🔴 Logout — ${name || '?'} (${phone || '?'}) — ${reason || 'manual'} — ${nowStr()}`);
  res.json({ success: true });
};