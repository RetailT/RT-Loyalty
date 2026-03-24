const { getPosbackPool, getLoyaltyPool, sql } = require('../config/userdb');

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

/* ── getMe ───────────────────────────────────────────────── */
exports.getMe = async (req, res) => {
  try {
    const { serialNo, companyCode } = req.customer;
    const posPool = await getPosbackPool();
    const result  = await posPool.request()
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

    const row    = result.recordset[0];
    const points = await getPointsSummary(posPool, serialNo, companyCode);

    res.json({
      success: true,
      customer: {
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
      },
    });
  } catch (err) {
    console.error('[getMe]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── updateMe ────────────────────────────────────────────── */
exports.updateMe = async (req, res) => {
  try {
    const { serialNo, companyCode }        = req.customer;
    const { email, city, occupation, dob } = req.body;

    const posPool = await getPosbackPool();
    await posPool.request()
      .input('sno',        sql.NVarChar, serialNo)
      .input('code',       sql.Char,     companyCode)
      .input('email',      sql.NVarChar, email      || null)
      .input('city',       sql.NVarChar, city       || null)
      .input('occupation', sql.NVarChar, occupation || null)
      .input('dob',        sql.DateTime, dob ? new Date(dob) : null)
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

/* ── getTransactions ─────────────────────────────────────── */
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

    const posPool = await getPosbackPool();
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
          WHERE SERIALNO = @sno AND COMPANY_CODE = @code AND SMS = 'T'
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

/* ── getRewards ──────────────────────────────────────────── */
exports.getRewards = async (req, res) => {
  try {
    const { companyCode, serialNo } = req.customer;
    const loyPool = await getLoyaltyPool();
    const posPool = await getPosbackPool();

    const [rewardsRes, pointsRes] = await Promise.all([
      loyPool.request()
        .input('code', sql.NVarChar, companyCode)
        .query(`
          SELECT IDX, TITLE, DESCRIPTION, CATEGORY, POINTS_COST,
                 ICON, IS_ACTIVE, VALID_FROM, VALID_UNTIL, STOCK
          FROM dbo.tb_REWARDS
          WHERE IS_ACTIVE = 1
            AND COMPANY_CODE = @code
            AND (VALID_FROM  IS NULL OR VALID_FROM  <= GETDATE())
            AND (VALID_UNTIL IS NULL OR VALID_UNTIL >= GETDATE())
            AND (STOCK IS NULL OR STOCK > 0)
          ORDER BY POINTS_COST ASC
        `),
      getPointsSummary(posPool, serialNo, companyCode),
    ]);

    res.json({
      success: true,
      data: rewardsRes.recordset,
      availablePoints: pointsRes.availablePoints,
    });
  } catch (err) {
    console.error('[getRewards]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── getMyRedemptions ────────────────────────────────────── */
exports.getMyRedemptions = async (req, res) => {
  try {
    const { serialNo } = req.customer;
    const loyPool = await getLoyaltyPool();
    const result  = await loyPool.request()
      .input('sno', sql.NVarChar, serialNo)
      .query(`
        SELECT r.IDX, r.REDEEMED_AT, r.POINTS_USED, r.STATUS,
               rw.TITLE, rw.DESCRIPTION, rw.CATEGORY, rw.ICON
        FROM dbo.tb_REDEMPTIONS r
        JOIN dbo.tb_REWARDS rw ON rw.IDX = r.REWARD_ID
        WHERE r.SERIAL_NO = @sno
        ORDER BY r.REDEEMED_AT DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('[getMyRedemptions]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── redeemReward ────────────────────────────────────────── */
exports.redeemReward = async (req, res) => {
  try {
    const { serialNo, companyCode, name } = req.customer;
    const { reward_id } = req.body;

    if (!reward_id)
      return res.status(400).json({ success: false, message: 'reward_id required.' });

    const loyPool = await getLoyaltyPool();
    const posPool = await getPosbackPool();

    const rwRes = await loyPool.request()
      .input('rid',  sql.Int,      reward_id)
      .input('code', sql.NVarChar, companyCode)
      .query(`
        SELECT TOP 1 IDX, TITLE, POINTS_COST, IS_ACTIVE, STOCK
        FROM dbo.tb_REWARDS
        WHERE IDX = @rid AND IS_ACTIVE = 1 AND COMPANY_CODE = @code
      `);

    if (!rwRes.recordset.length)
      return res.status(404).json({ success: false, message: 'Reward not found.' });

    const reward = rwRes.recordset[0];

    if (reward.STOCK !== null && reward.STOCK <= 0)
      return res.status(400).json({ success: false, message: 'Reward out of stock.' });

    const points = await getPointsSummary(posPool, serialNo, companyCode);
    if (points.availablePoints < reward.POINTS_COST) {
      return res.status(400).json({
        success: false,
        message: `Not enough points. Need ${reward.POINTS_COST}, have ${points.availablePoints.toFixed(2)}.`,
      });
    }

    const custRes = await posPool.request()
      .input('sno',  sql.NVarChar, serialNo)
      .input('code', sql.Char,     companyCode)
      .query(`SELECT TOP 1 IDX FROM dbo.tb_LOYALTYCUSTOMER_MAIN WHERE SERIALNO = @sno AND COMPANY_CODE = @code`);

    if (!custRes.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const custIdx = custRes.recordset[0].IDX;

    await loyPool.request()
      .input('custId', sql.Int,   custIdx)
      .input('rid',    sql.Int,   reward.IDX)
      .input('pts',    sql.Float, reward.POINTS_COST)
      .query(`
        INSERT INTO dbo.tb_REDEMPTIONS (CUSTOMER_ID, REWARD_ID, POINTS_COST, STATUS, REDEEMED_AT)
        VALUES (@custId, @rid, @pts, 'PENDING', GETDATE())
      `);

    if (reward.STOCK !== null) {
      await loyPool.request()
        .input('rid', sql.Int, reward.IDX)
        .query(`UPDATE dbo.tb_REWARDS SET STOCK = STOCK - 1 WHERE IDX = @rid`);
    }

    await posPool.request()
      .input('sno',  sql.NVarChar, serialNo)
      .input('code', sql.Char,     companyCode)
      .input('name', sql.NVarChar, name)
      .input('rate', sql.Float,    reward.POINTS_COST)
      .input('desc', sql.NVarChar, reward.TITLE)
      .query(`
        INSERT INTO dbo.tb_LOYALTY_TRANSACTION
          (SERIALNO, COMPANY_CODE, CUSTOMER_NAME, ID, RATE, AMOUNT,
           INVOICENO, INVOICE_DATE, INVOICE_TIME, SMS, LOYALTY_TYPE, CURRATE)
        VALUES
          (@sno, @code, @name, 'RM', @rate, 0, @desc,
           GETDATE(), CONVERT(VARCHAR(8), GETDATE(), 108), 'T', '', 0)
      `);

    res.json({ success: true, message: `Redeemed: ${reward.TITLE}` });
  } catch (err) {
    console.error('[redeemReward]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── getPromotions ───────────────────────────────────────── */
/*
 * TYPE column in tb_PROMOTION:
 *   'PD '  → Normal amount discount  — PD1L = Rs. amount off  (e.g. 20.00)
 *   'PDP'  → Percentage discount     — DPD_DISCPRC = % off    (e.g. 15.00)
 *
 * Price source: tb_PRODUCT.SCALEPRICE (joined on PRODUCT_CODE)
 * NOT UNIT_PRICE from tb_PROMOTION (that column stores original unit price
 * at time of promo creation and may be stale).
 *
 * PD1L rule: PDQ1L = min qty threshold, PD1L = discount VALUE at that tier.
 */
exports.getPromotions = async (req, res) => {
  try {
    const { companyCode } = req.customer;
    const posPool = await getPosbackPool();

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

          -- Price from tb_PRODUCT.SCALEPRICE (NOT tb_PROMOTION.UNIT_PRICE)
          ISNULL(pr.SCALEPRICE, 0)                                     AS unitPrice,

          -- TYPE trim: stored as 'PD        ' with trailing spaces
          LTRIM(RTRIM(p.TYPE))                                         AS type,

          -- PD1L: used for BOTH PD (Rs. off) and PDP (% off)
          ISNULL(p.PD1L, 0)                                            AS discountValue,
          ISNULL(p.PDQ1L, 0)                                           AS minQty,

          p.DPD_DATEFROM                                               AS dateFrom,
          p.DPD_DATETO                                                  AS dateTo

        FROM dbo.tb_PROMOTION p
        LEFT JOIN dbo.tb_PRODUCT pr
          ON LTRIM(RTRIM(pr.PRODUCT_CODE)) = LTRIM(RTRIM(p.PRODUCT_CODE))

        WHERE LTRIM(RTRIM(p.COMPANY_CODE)) = LTRIM(RTRIM(@code))

          -- Active flag
          AND LTRIM(RTRIM(p.DATE_ACTIVE)) = 'T'

          -- Must have a loyalty discount value in at least one column
          AND ISNULL(p.PD1L, 0) > 0

          -- Exclude expired (1900-01-01 = no expiry sentinel)
          AND (
            p.DPD_DATETO IS NULL
            OR YEAR(p.DPD_DATETO) <= 1900
            OR CAST(p.DPD_DATETO AS DATE) >= CAST(GETDATE() AS DATE)
          )

        ORDER BY p.IDX DESC
      `);

    const data = result.recordset.map(row => {
      const unitPrice     = parseFloat(row.unitPrice     || 0);
      const discountValue = parseFloat(row.discountValue || 0);  // PD1L — used for both types
      const type          = (row.type || '').trim();

      // PD  type: PD1L = Rs. amount off   → finalPrice = unitPrice - PD1L
      // PDP type: PD1L = % value          → finalPrice = unitPrice - (unitPrice * PD1L / 100)
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

      return {
        idx:         row.idx,
        productCode: row.productCode,
        productName: row.productName,
        type,                                  // 'PD' | 'PDP'
        unitPrice,                             // SCALEPRICE from tb_PRODUCT
        discountAmt,                           // Rs. off  — PD  type
        discountPrc,                           // % off    — PDP type
        finalPrice:  Math.max(0, finalPrice),
        minQty:      parseFloat(row.minQty || 0),
        dateFrom:    row.dateFrom || null,
        dateTo:      row.dateTo   || null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getPromotions]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};