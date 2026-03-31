const { getPosbackPool, sql } = require('../config/userdb');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
           OR CAST(IDX AS NVARCHAR)      = LTRIM(RTRIM(@ltype))
      `);
    const ls = r.recordset[0] ? r.recordset[0].LOYALTY_START : null;
    return (ls !== null && ls !== undefined) ? ls : '';
  } catch (err) {
    console.error('[getLoyaltyStart]', err.message);
    return '';
  }
}

async function checkDuplicate(posPool, companyCode, { nic, passport, mobileNo }) {
  const nicVal      = (nic      || '').trim();
  const passportVal = (passport || '').trim();
  const mobileVal   = (mobileNo || '').trim();

  const mainResult = await posPool.request()
    .input('code',     sql.Char,     companyCode)
    .input('nic',      sql.NVarChar, nicVal)
    .input('passport', sql.NVarChar, passportVal)
    .input('mobile',   sql.NVarChar, mobileVal)
    .query(`
      SELECT TOP 1
        CASE
          WHEN @mobile <> '' AND LTRIM(RTRIM(MOBILENO)) = @mobile THEN 'mobile'
          WHEN @nic    <> '' AND LTRIM(RTRIM(NIC))      = @nic    THEN 'nic'
          WHEN @passport <> '' AND LTRIM(RTRIM(PASSPORT)) = @passport THEN 'passport'
        END AS matched_field
      FROM dbo.tb_LOYALTYCUSTOMER_MAIN
      WHERE LTRIM(RTRIM(COMPANY_CODE)) = LTRIM(RTRIM(@code))
        AND (
          (@mobile   <> '' AND LTRIM(RTRIM(MOBILENO)) = @mobile)
          OR
          (@nic      <> '' AND LTRIM(RTRIM(NIC))      = @nic)
          OR
          (@passport <> '' AND LTRIM(RTRIM(PASSPORT)) = @passport)
        )
    `);

  if (mainResult.recordset.length > 0)
    return { found: true, field: mainResult.recordset[0].matched_field, source: 'active' };

  const regResult = await posPool.request()
    .input('code',     sql.Char,     companyCode)
    .input('nic',      sql.NVarChar, nicVal)
    .input('passport', sql.NVarChar, passportVal)
    .input('mobile',   sql.NVarChar, mobileVal)
    .query(`
      SELECT TOP 1
        CASE
          WHEN @mobile <> '' AND LTRIM(RTRIM(MOBILENO)) = @mobile THEN 'mobile'
          WHEN @nic    <> '' AND LTRIM(RTRIM(NIC))      = @nic    THEN 'nic'
          WHEN @passport <> '' AND LTRIM(RTRIM(PASSPORT)) = @passport THEN 'passport'
        END AS matched_field
      FROM dbo.tb_LOYALTYCUSTOMER_REGISTER
      WHERE LTRIM(RTRIM(COMPANY_CODE)) = LTRIM(RTRIM(@code))
        AND (
          (@mobile   <> '' AND LTRIM(RTRIM(MOBILENO)) = @mobile)
          OR
          (@nic      <> '' AND LTRIM(RTRIM(NIC))      = @nic)
          OR
          (@passport <> '' AND LTRIM(RTRIM(PASSPORT)) = @passport)
        )
    `);

  if (regResult.recordset.length > 0)
    return { found: true, field: regResult.recordset[0].matched_field, source: 'pending' };

  return { found: false };
}

function buildDuplicateMessage(field, source) {
  const fieldLabel = {
    mobile:   'Mobile number',
    nic:      'NIC number',
    passport: 'Passport number',
  }[field] || 'Details';

  if (source === 'active')
    return `${fieldLabel} is already registered as an active loyalty customer. Please log in instead.`;
  return `${fieldLabel} already has a pending registration request. Please wait for shop approval or contact the shop.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// registerCustomer — POST /api/portal/register
// ─────────────────────────────────────────────────────────────────────────────
exports.registerCustomer = async (req, res) => {
  try {
    const companyCode = req.company?.POSBACK_CODE;
    const companyName = req.company?.COMPANY_NAME || '';

    if (!companyCode)
      return res.status(400).json({ success: false, message: 'Company not resolved.' });

    const {
      type             = '',
      custDisplayName  = '',
      custFullName     = '',
      dob              = '',
      postalAddress    = '',
      permanentAddress = '',
      city             = '',
      civilStatus      = '',
      nic              = '',
      passport         = '',
      email            = '',
      occupation       = '',
      homeNo           = '',
      officeNo         = '',
      mobileNo         = '',
    } = req.body;

    if (!custFullName.trim())
      return res.status(400).json({ success: false, message: 'Full name is required.' });

    if (!mobileNo.trim() || !/^0\d{9}$/.test(mobileNo.trim()))
      return res.status(400).json({ success: false, message: 'Enter a valid mobile number (07XXXXXXXX).' });

    const hasNic      = nic.trim().length > 0;
    const hasPassport = passport.trim().length > 0;

    if (!hasNic && !hasPassport)
      return res.status(400).json({ success: false, message: 'NIC or Passport number is required.' });

    if (hasNic && !/^(\d{9}[VvXx]|\d{12})$/.test(nic.trim()))
      return res.status(400).json({ success: false, message: 'Enter a valid NIC (9 digits + V/X, or 12 digits).' });

    // ✅ Use shopPool (per-shop POSBACK) for registration
    const posPool = req.shopPool;

    const dup = await checkDuplicate(posPool, companyCode, { nic, passport, mobileNo });
    if (dup.found) {
      return res.status(409).json({
        success: false,
        message: buildDuplicateMessage(dup.field, dup.source),
        field:   dup.field,
        source:  dup.source,
      });
    }

    let dobDate = null;
    if (dob && dob.trim()) {
      const parsed = new Date(dob);
      if (!isNaN(parsed.getTime())) dobDate = parsed;
    }

    const homeNoVal   = (homeNo.trim()   || '').substring(0, 10);
    const officeNoVal = (officeNo.trim() || '').substring(0, 10);

    await posPool.request()
      .input('type',             sql.NVarChar(20),  type.trim())
      .input('custDisplayName',  sql.NVarChar(500), custDisplayName.trim())
      .input('custFullName',     sql.NVarChar(500), custFullName.trim())
      .input('dob',              sql.DateTime,      dobDate)
      .input('postalAddress',    sql.NVarChar(300), postalAddress.trim())
      .input('permanentAddress', sql.NVarChar(300), permanentAddress.trim())
      .input('city',             sql.NVarChar(100), city.trim())
      .input('civilStatus',      sql.NVarChar(50),  civilStatus.trim())
      .input('nic',              sql.NVarChar(50),  nic.trim())
      .input('passport',         sql.NVarChar(50),  passport.trim())
      .input('email',            sql.NVarChar(200), email.trim())
      .input('occupation',       sql.NVarChar(100), occupation.trim())
      .input('homeNo',           sql.Char(10),      homeNoVal)
      .input('officeNo',         sql.Char(10),      officeNoVal)
      .input('mobileNo',         sql.NVarChar(50),  mobileNo.trim())
      .input('companyCode',      sql.Char(10),      companyCode)
      .input('companyName',      sql.NVarChar(50),  companyName.substring(0, 50))
      .input('dateActive',       sql.Char(1),       'F')
      .query(`
        INSERT INTO dbo.tb_LOYALTYCUSTOMER_REGISTER (
          TYPE, CUSTDISPLAY_NAME, CUSTFULL_NAME, DOB,
          POSTAL_ADDRESS, PERMANANT_ADDRESS, CITY, CIVIL_STATUS,
          NIC, PASSPORT, EMAIL, OCCUPATION,
          HOMENO, OFFICENO, MOBILENO,
          COMPANY_CODE, COMPANY_NAME,
          STATUS, CREATE_USER, CREATE_DATE, CREATE_TIME,
          DATEACTIVE, INSERT_TIME
        ) VALUES (
          @type, @custDisplayName, @custFullName, COALESCE(@dob, '1900-01-01 00:00:00'),
          @postalAddress, @permanentAddress, @city, @civilStatus,
          @nic, @passport, @email, @occupation,
          @homeNo, @officeNo, @mobileNo,
          @companyCode, @companyName,
          'PENDING', 'PORTAL', GETDATE(), GETDATE(),
          @dateActive, GETDATE()
        )
      `);

    console.log(`[registerCustomer] Pending: ${custFullName.trim()} | ${mobileNo.trim()} | company: ${companyCode}`);
    res.status(201).json({
      success: true,
      message: 'Registration request submitted. Awaiting shop approval.',
    });

  } catch (err) {
    console.error('[registerCustomer]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getMe
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { serialNo, companyCode } = req.customer;
    const posPool = req.shopPool; // ✅ POSBACK only

    const result = await posPool.request()
      .input('sno',  sql.NVarChar, serialNo)
      .input('code', sql.Char,     companyCode)
      .query(`
        SELECT TOP 1 SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME, MOBILENO,
                     EMAIL, DOB, CITY, OCCUPATION, LOYALTY_TYPE,
                     COMPANY_CODE, COMPANY_NAME, CUSTOMER_LOCK
        FROM dbo.tb_LOYALTYCUSTOMER_MAIN
        WHERE SERIALNO = @sno AND COMPANY_CODE = @code
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const row          = result.recordset[0];
    const points       = await getPointsSummary(posPool, serialNo, companyCode);
    const loyaltyStart = await getLoyaltyStart(posPool, row.LOYALTY_TYPE);
    const qrValue      = `${loyaltyStart}${row.SERIALNO}`;

    res.json({
      success: true,
      customer: {
        serialNo:    row.SERIALNO,
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
      },
    });
  } catch (err) {
    console.error('[getMe]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// updateMe
// ─────────────────────────────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { serialNo, companyCode }        = req.customer;
    const { email, city, occupation, dob } = req.body;

    const posPool = req.shopPool; // ✅ POSBACK only
    await posPool.request()
      .input('sno',        sql.NVarChar,      serialNo)
      .input('code',       sql.Char,          companyCode)
      .input('email',      sql.NVarChar(200), email      || null)
      .input('city',       sql.NVarChar(100), city       || null)
      .input('occupation', sql.NVarChar(100), occupation || null)
      .input('dob',        sql.DateTime,      dob ? new Date(dob) : null)
      .query(`
        UPDATE dbo.tb_LOYALTYCUSTOMER_MAIN
        SET EMAIL      = COALESCE(@email,      EMAIL),
            CITY       = COALESCE(@city,       CITY),
            OCCUPATION = COALESCE(@occupation, OCCUPATION),
            DOB        = COALESCE(@dob,        DOB)
        WHERE SERIALNO = @sno AND COMPANY_CODE = @code
      `);

    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('[updateMe]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getTransactions
// ─────────────────────────────────────────────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const { serialNo, companyCode } = req.customer;
    const page   = parseInt(req.query.page  || '1');
    const limit  = parseInt(req.query.limit || '20');
    const type   = req.query.type || 'all';
    const offset = (page - 1) * limit;

    let typeFilter = '';
    if (type === 'earn')     typeFilter = "AND LTRIM(RTRIM(ID)) = 'EN'";
    if (type === 'redeem')   typeFilter = "AND LTRIM(RTRIM(ID)) = 'RM'";
    if (type === 'discount') typeFilter = "AND LTRIM(RTRIM(ID)) = 'PD'";
    if (type === 'birthday') typeFilter = "AND LTRIM(RTRIM(ID)) = 'SDB'";

    const posPool = req.shopPool; // ✅ POSBACK only
    const result  = await posPool.request()
      .input('sno',    sql.NVarChar, serialNo)
      .input('code',   sql.Char,     companyCode)
      .input('offset', sql.Int,      offset)
      .input('limit',  sql.Int,      limit)
      .query(`
        SELECT IDX, ID, RATE, AMOUNT, INVOICE_DATE, INVOICE_TIME,
               INVOICENO, COMPANY_NAME, LOYALTY_TYPE, CURRATE
        FROM (
          SELECT *, ROW_NUMBER() OVER (ORDER BY INVOICE_DATE DESC, IDX DESC) AS RN
          FROM dbo.tb_LOYALTY_TRANSACTION
          WHERE SERIALNO = @sno AND COMPANY_CODE = @code
          ${typeFilter}
        ) AS T
        WHERE RN > @offset AND RN <= (@offset + @limit)
      `);

    res.json({ success: true, data: result.recordset, page, limit });
  } catch (err) {
    console.error('[getTransactions]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getPromotions
// ─────────────────────────────────────────────────────────────────────────────
exports.getPromotions = async (req, res) => {
  try {
    const { companyCode } = req.customer;
    const posPool = req.shopPool; // ✅ POSBACK only

    const result = await posPool.request()
      .input('code', sql.Char, companyCode)
      .query(`
        SELECT
          p.IDX                                                        AS idx,
          LTRIM(RTRIM(p.PRODUCT_CODE))                                 AS productCode,
          COALESCE(
            NULLIF(LTRIM(RTRIM(pr.PRODUCT_NAMELONG)),  ''),
            NULLIF(LTRIM(RTRIM(pr.PRODUCT_NAMESHORT)), ''),
            LTRIM(RTRIM(p.PRODUCT_CODE))
          )                                                            AS productName,
          ISNULL(pr.SCALEPRICE, 0)                                     AS unitPrice,
          LTRIM(RTRIM(p.TYPE))                                         AS type,
          ISNULL(p.PD1L, 0)                                            AS discountValue,
          ISNULL(p.PDQ1L, 0)                                           AS minQty,
          p.DPD_DATEFROM                                               AS dateFrom,
          p.DPD_DATETO                                                  AS dateTo
        FROM dbo.tb_PROMOTION p
        LEFT JOIN dbo.tb_PRODUCT pr
          ON LTRIM(RTRIM(pr.PRODUCT_CODE)) = LTRIM(RTRIM(p.PRODUCT_CODE))
        WHERE LTRIM(RTRIM(p.COMPANY_CODE)) = LTRIM(RTRIM(@code))
          AND LTRIM(RTRIM(p.DATE_ACTIVE)) = 'T'
          AND ISNULL(p.PD1L, 0) > 0
          AND (
            p.DPD_DATETO IS NULL
            OR YEAR(p.DPD_DATETO) <= 1900
            OR CAST(p.DPD_DATETO AS DATE) >= CAST(GETDATE() AS DATE)
          )
        ORDER BY p.IDX DESC
      `);

    const data = result.recordset.map(row => {
      const unitPrice     = parseFloat(row.unitPrice     || 0);
      const discountValue = parseFloat(row.discountValue || 0);
      const type          = (row.type || '').trim();

      let finalPrice  = unitPrice;
      let discountAmt = 0;
      let discountPrc = 0;

      if (type === 'PD') {
        discountAmt = discountValue;
        finalPrice  = unitPrice - discountAmt;
      } else if (type === 'PDP') {
        discountPrc = discountValue;
        finalPrice  = unitPrice - (unitPrice * discountPrc / 100);
      }

      const normDate = (d) => {
        if (!d) return null;
        const y = new Date(d).getFullYear();
        return y <= 1900 ? null : d;
      };

      return {
        idx:         row.idx,
        productCode: row.productCode,
        productName: row.productName,
        type,
        unitPrice,
        discountAmt,
        discountPrc,
        finalPrice:  Math.max(0, finalPrice),
        minQty:      parseFloat(row.minQty || 0),
        dateFrom:    normDate(row.dateFrom),
        dateTo:      normDate(row.dateTo),
        isEvergreen: !normDate(row.dateFrom) && !normDate(row.dateTo),
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getPromotions]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};