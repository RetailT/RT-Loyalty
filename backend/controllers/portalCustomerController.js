const { getPosbackPool, getLoyaltyPool, sql } = require('../config/userdb');

async function getPointsSummary(posPool, serialNo, posbackCode) {
  const r = await posPool.request()
    .input('sno',  sql.NVarChar, serialNo)
    .input('code', sql.Char,     posbackCode)
    .query(`
      SELECT
        SUM(CASE WHEN ID='EN' THEN RATE ELSE 0 END) AS totalPoints,
        SUM(CASE WHEN ID='RD' THEN RATE ELSE 0 END) AS redeemedPoints,
        SUM(CASE WHEN ID='EN' THEN RATE
             WHEN ID='RD' THEN -RATE
             WHEN ID='RM' THEN RATE
             ELSE 0 END)                             AS availablePoints
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
    if (type === 'earn')   typeFilter = "AND ID = 'EN'";
    if (type === 'redeem') typeFilter = "AND ID = 'RD'";

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
          (@sno, @code, @name, 'RD', @rate, 0, @desc,
           GETDATE(), CONVERT(VARCHAR(8), GETDATE(), 108), 'T', '', 0)
      `);

    res.json({ success: true, message: `Redeemed: ${reward.TITLE}` });
  } catch (err) {
    console.error('[redeemReward]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/* ── getPromotions ───────────────────────────────────────── */
exports.getPromotions = async (req, res) => {
  try {
    const { companyCode } = req.customer;
    const posPool = await getPosbackPool();

    const result = await posPool.request()
      .input('code', sql.Char, companyCode)
      .query(`
        SELECT
          p.IDX         AS idx,
          p.PRODUCT_CODE AS productCode,
          COALESCE(NULLIF(LTRIM(RTRIM(pr.PRODUCT_NAMELONG)),''), LTRIM(RTRIM(pr.PRODUCT_NAMESHORT))) AS productName,
          p.UNIT_PRICE  AS unitPrice,
          p.TYPE        AS type,
          p.DPD_DATEFROM AS dateFrom,
          p.DPD_DATETO  AS dateTo,
          p.DPD_DISCPRC AS discountPrc,
          p.PD1         AS discountAmt,
          p.PROMOTIONMODE AS promotionMode
        FROM dbo.tb_PROMOTION p
        LEFT JOIN dbo.tb_PRODUCT pr ON pr.PRODUCT_CODE = p.PRODUCT_CODE
        WHERE LTRIM(RTRIM(p.COMPANY_CODE)) = LTRIM(RTRIM(@code))
          AND p.UNIT_PRICE > 0
          AND (p.PD1 > 0 OR p.DPD_DISCPRC > 0)
          AND (
            p.DPD_DATETO = '1900-01-01 00:00:00.000'
            OR p.DPD_DATETO >= CAST(GETDATE() AS DATE)
          )
        ORDER BY p.IDX DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('[getPromotions]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};