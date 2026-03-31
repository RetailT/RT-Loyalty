const { sql } = require('../config/userdb');
const jwt = require('jsonwebtoken');
const { sendOtpSMS } = require('../utils/sms');

const JWT_SECRET  = process.env.JWT_SECRET || 'rt_loyalty_secret';
const JWT_EXPIRES = '8h';
const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES) || 1;
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
        SUM(CASE WHEN LTRIM(RTRIM(ID))='EN' THEN RATE ELSE 0 END) AS totalPoints,
        SUM(CASE WHEN LTRIM(RTRIM(ID))='RM' THEN ABS(RATE) ELSE 0 END) AS redeemedPoints,
        SUM(CASE
              WHEN LTRIM(RTRIM(ID))='EN' THEN RATE
              WHEN LTRIM(RTRIM(ID))='RM' THEN -ABS(RATE)
              ELSE 0
            END) AS availablePoints
      FROM dbo.tb_LOYALTY_TRANSACTION
      WHERE SERIALNO = @sno
        AND COMPANY_CODE = @code
    `);
  const row = r.recordset[0] || {};
  return {
    totalPoints:     parseFloat(row.totalPoints     || 0),
    redeemedPoints:  parseFloat(row.redeemedPoints  || 0),
    availablePoints: parseFloat(row.availablePoints || 0),
  };
}

async function getLoyaltyStart(posPool, loyaltyType) {
  try {
    const r = await posPool.request()
      .input('ltype', sql.NVarChar, (loyaltyType || '').trim())
      .query(`
        SELECT TOP 1 LTRIM(RTRIM(LOYALTY_START)) AS LOYALTY_START
        FROM dbo.tb_LOYALTYMAIN
        WHERE LTRIM(RTRIM(LOYALTY_TYPE)) = LTRIM(RTRIM(@ltype))
           OR CAST(IDX AS NVARCHAR) = LTRIM(RTRIM(@ltype))
      `);
    const ls = r.recordset[0] ? r.recordset[0].LOYALTY_START : null;
    return (ls !== null && ls !== undefined) ? ls : '';
  } catch (err) {
    console.error('[getLoyaltyStart]', err.message);
    return '';
  }
}

function shapeCustomer(row, points, loyaltyStart) {
  const serialNo = row.SERIALNO;
  const qrValue  = (loyaltyStart !== undefined && loyaltyStart !== null)
    ? `${loyaltyStart}${serialNo}`
    : serialNo;

  return {
    serialNo,
    qrValue,
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

// ─────────────────────────────────────────────────────────────────────────────
// Logging helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * logOtpRequest — OTP_REQUEST row insert
 * LOGIN_TIME + LOGOUT_TIME = GETDATE() (NOT NULL satisfy)
 */
async function logOtpRequest(pool, { username, customerName, companyCode, companyName, otpCode }) {
  try {
    await pool.request()
      .input('username', sql.NVarChar(50),  username     || '')
      .input('custName', sql.NVarChar(100), customerName || '')
      .input('compCode', sql.NVarChar(20),  companyCode  || '')
      .input('compName', sql.NVarChar(100), companyName  || '')
      .input('otpCode',  sql.NVarChar(10),  otpCode      || '')
      .query(`
        INSERT INTO dbo.tb_LOYALTY_USERLOG
          (USERNAME, CUSTOMER_NAME, COMPANY_CODE, COMPANY_NAME,
           ACTION, OTP_CODE, LOGIN_TIME, LOGOUT_TIME, INSERT_TIME)
        VALUES
          (@username, @custName, @compCode, @compName,
           'OTP_REQUEST', @otpCode, GETDATE(), GETDATE(), GETDATE())
      `);
  } catch (err) {
    console.error('[logOtpRequest]', err.message);
  }
}

/**
 * logLogin — LOGIN row insert
 * LOGIN_TIME  = GETDATE() (actual login time)
 * LOGOUT_TIME = GETDATE() (placeholder — logout UPDATEs this row's LOGOUT_TIME to actual logout time)
 */
async function logLogin(pool, { username, customerName, companyCode, companyName, otpCode }) {
  try {
    await pool.request()
      .input('username', sql.NVarChar(50),  username     || '')
      .input('custName', sql.NVarChar(100), customerName || '')
      .input('compCode', sql.NVarChar(20),  companyCode  || '')
      .input('compName', sql.NVarChar(100), companyName  || '')
      .input('otpCode',  sql.NVarChar(10),  otpCode      || '')
      .query(`
        INSERT INTO dbo.tb_LOYALTY_USERLOG
          (USERNAME, CUSTOMER_NAME, COMPANY_CODE, COMPANY_NAME,
           ACTION, OTP_CODE, LOGIN_TIME, LOGOUT_TIME, INSERT_TIME)
        VALUES
          (@username, @custName, @compCode, @compName,
           'LOGIN', @otpCode, GETDATE(), GETDATE(), GETDATE())
      `);
  } catch (err) {
    console.error('[logLogin]', err.message);
  }
}

/**
 * logLogout — when customer logout
 * Most recent LOGIN row, LOGOUT_TIME = GETDATE() UPDATED
 * (same row — login + logout)
 */
async function logLogout(pool, { username, companyCode }) {
  try {
    await pool.request()
      .input('username', sql.NVarChar(50), username    || '')
      .input('compCode', sql.NVarChar(20), companyCode || '')
      .query(`
        UPDATE dbo.tb_LOYALTY_USERLOG
        SET    LOGOUT_TIME = GETDATE()
        WHERE  IDX = (
          SELECT TOP 1 IDX
          FROM   dbo.tb_LOYALTY_USERLOG
          WHERE  USERNAME     = @username
            AND  COMPANY_CODE = @compCode
            AND  ACTION       IN ('LOGIN', 'QR_LOGIN')
          ORDER BY IDX DESC
        )
      `);
  } catch (err) {
    console.error('[logLogout]', err.message);
  }
}

/* ── sendOtp ─────────────────────────────────────────────── */
exports.sendOtp = async (req, res) => {
  try {
    const { phone }                      = req.body;
    const { POSBACK_CODE, COMPANY_NAME } = req.company;

    if (!phone) return res.status(400).json({ success: false, message: 'Input required.' });

    const input   = phone.trim();
    const posPool = req.shopPool;

    const found = await posPool.request()
      .input('input', sql.NVarChar, input)
      .input('code',  sql.Char,     POSBACK_CODE)
      .query(`
        SELECT TOP 1
          SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME,
          MOBILENO, EMAIL, COMPANY_NAME
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE COMPANY_CODE = @code
          AND CUSTOMER_LOCK = 'F'
          AND (
            MOBILENO  = @input OR
            NIC       = @input OR
            PASSPORT  = @input OR
            SERIALNO  = @input OR
            SERIALNO2 = @input OR
            SERIALNO3 = @input
          )
      `);

    if (!found.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'No loyalty account found. Please try your Mobile No, NIC, Passport or Loyalty Card No.',
      });
    }

    const custRow  = found.recordset[0];
    const mobileNo = custRow.MOBILENO;
    const shop     = custRow.COMPANY_NAME || COMPANY_NAME;
    const custName = custRow.CUSTDISPLAY_NAME || custRow.CUSTFULL_NAME || '';

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: 'No mobile number registered for this account. Please contact your shop.',
      });
    }

    // OTP rate check
    const rateCheck = await posPool.request()
      .input('phone', sql.NVarChar, mobileNo)
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .input('mins',  sql.Int,      OTP_RATE_LIMIT_MIN)
      .input('max',   sql.Int,      OTP_RATE_LIMIT_COUNT)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM dbo.tb_LOYALTY_OTP_SESSIONS
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

    const otp     = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + OTP_TTL_MIN * 60000);

    await posPool.request()
      .input('phone', sql.NVarChar, mobileNo)
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .query(`DELETE FROM dbo.tb_LOYALTY_OTP_SESSIONS WHERE PHONE = @phone AND COMPANY_CODE = @code`);

    await posPool.request()
      .input('phone',   sql.NVarChar, mobileNo)
      .input('code',    sql.NVarChar, POSBACK_CODE)
      .input('otp',     sql.NVarChar, otp)
      .input('expires', sql.DateTime, expires)
      .query(`
        INSERT INTO dbo.tb_LOYALTY_OTP_SESSIONS (PHONE, COMPANY_CODE, OTP_CODE, EXPIRES_AT, CREATED_AT)
        VALUES (@phone, @code, @otp, @expires, GETDATE())
      `);

    // ── OTP_REQUEST log ───────────────────────────────────────────────────────
    logOtpRequest(posPool, {
      username:     mobileNo,
      customerName: custName,
      companyCode:  POSBACK_CODE,
      companyName:  shop,
      otpCode:      otp,
    });

    try {
      await sendOtpSMS(mobileNo, otp, shop);
    } catch (smsErr) {
      console.error('[sendOtp] SMS error:', smsErr.message);
    }

    const hasEmail    = !!(custRow.EMAIL || '').trim();
    const maskedPhone = mobileNo.slice(0, 3) + '****' + mobileNo.slice(-3);
    console.log(`📱 OTP for ${mobileNo} @ ${shop}: ${otp}`);

    res.json({
      success: true,
      hasEmail,
      maskedPhone,
      ...(IS_DEV ? { dev_otp: otp } : {}),
    });

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
      return res.status(400).json({ success: false, message: 'Input and OTP required.' });

    const input   = phone.trim();
    const posPool = req.shopPool;

    const custSearch = await posPool.request()
      .input('input', sql.NVarChar, input)
      .input('code',  sql.Char,     POSBACK_CODE)
      .query(`
        SELECT TOP 1 MOBILENO
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE COMPANY_CODE = @code
          AND CUSTOMER_LOCK = 'F'
          AND (
            MOBILENO  = @input OR
            NIC       = @input OR
            PASSPORT  = @input OR
            SERIALNO  = @input OR
            SERIALNO2 = @input OR
            SERIALNO3 = @input
          )
      `);

    if (!custSearch.recordset.length)
      return res.status(404).json({ success: false, message: 'Account not found.' });

    const mobileNo = custSearch.recordset[0].MOBILENO;

    const sess = await posPool.request()
      .input('phone', sql.NVarChar, mobileNo)
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .query(`
        SELECT TOP 1 OTP_CODE, EXPIRES_AT
        FROM dbo.tb_LOYALTY_OTP_SESSIONS
        WHERE PHONE = @phone AND COMPANY_CODE = @code
      `);

    if (!sess.recordset.length)
      return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });

    const { OTP_CODE, EXPIRES_AT } = sess.recordset[0];

    if (new Date() > new Date(EXPIRES_AT))
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    if (OTP_CODE.trim() !== otp.trim())
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });

    await posPool.request()
      .input('phone', sql.NVarChar, mobileNo)
      .input('code',  sql.NVarChar, POSBACK_CODE)
      .query(`DELETE FROM dbo.tb_LOYALTY_OTP_SESSIONS WHERE PHONE = @phone AND COMPANY_CODE = @code`);

    const cust = await posPool.request()
      .input('mob',  sql.NVarChar, mobileNo)
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

    const row          = cust.recordset[0];
    const points       = await getPointsSummary(posPool, row.SERIALNO, POSBACK_CODE);
    const loyaltyStart = await getLoyaltyStart(posPool, row.LOYALTY_TYPE);
    const customer     = shapeCustomer(row, points, loyaltyStart);

    const token = jwt.sign(
      {
        serialNo:     customer.serialNo,
        name:         customer.name,
        phone:        customer.phone,
        companyCode:  POSBACK_CODE,
        companyName:  customer.companyName,
        isPortalUser: true,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // ── LOGIN log — row insert, LOGOUT_TIME = placeholder (updated after logout) ──
    logLogin(posPool, {
      username:     mobileNo,
      customerName: customer.name,
      companyCode:  POSBACK_CODE,
      companyName:  customer.companyName,
      otpCode:      otp,
    });

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

    const posPool = req.shopPool;
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

    const row          = result.recordset[0];
    const points       = await getPointsSummary(posPool, row.SERIALNO, POSBACK_CODE);
    const loyaltyStart = await getLoyaltyStart(posPool, row.LOYALTY_TYPE);
    const customer     = shapeCustomer(row, points, loyaltyStart);

    const token = jwt.sign(
      {
        serialNo:     customer.serialNo,
        name:         customer.name,
        phone:        customer.phone,
        companyCode:  POSBACK_CODE,
        companyName:  customer.companyName,
        isPortalUser: true,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // ── QR_LOGIN log ──────────────────────────────────────────────────────────
    logLogin(posPool, {
      username:     customer.phone,
      customerName: customer.name,
      companyCode:  POSBACK_CODE,
      companyName:  customer.companyName,
      otpCode:      '',
    });

    console.log(`✅ QR Login — ${customer.name} (${customer.phone}) @ ${customer.companyName} — ${nowStr()}`);
    res.json({ success: true, token, customer });

  } catch (err) {
    console.error('[qrLogin]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── logoutPortal ────────────────────────────────────────── */
exports.logoutPortal = async (req, res) => {
  try {
    const { name, phone, companyCode, companyName, reason } = req.body || {};
    console.log(`🔴 Logout — ${name || '?'} (${phone || '?'}) — ${reason || 'manual'} — ${nowStr()}`);

    if (phone) {
      const posPool = req.shopPool;

      // ── Most recent LOGIN row, LOGOUT_TIME = now UPDATE ─────────────────
      await logLogout(posPool, {
        username:    phone,
        companyCode: companyCode,
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('[logoutPortal]', err.message);
    res.json({ success: true });
  }
};