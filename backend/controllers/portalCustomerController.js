// controllers/portalCustomerController.js
// Data source: POSBACK_SYSTEM → tb_LOYALTYCUSTOMER_MAIN + tb_LOYALTY_TRANSACTION
// Rewards/Redemptions: RT_LOYALTY

const { getPool, sql }              = require('../config/database');
const { getLoyaltyPool, sql: lsql } = require('../config/userdb');

// ─── Points summary ───────────────────────────────────────────────────────────
async function getPointsSummary(pool, serialNo) {
  const r = await pool.request()
    .input('sno', sql.NVarChar, serialNo)
    .query(`
      SELECT
        ISNULL(SUM(CASE WHEN ID='EN' THEN RATE ELSE 0 END), 0)          AS earned,
        ISNULL(SUM(CASE WHEN ID='RD' THEN RATE ELSE 0 END), 0)          AS redeemed,
        ISNULL(SUM(CASE WHEN ID='EN' THEN RATE ELSE -RATE END), 0)      AS available
      FROM tb_LOYALTY_TRANSACTION
      WHERE SERIALNO = @sno AND SMS = 'T'
    `);
  return r.recordset[0] || { earned: 0, redeemed: 0, available: 0 };
}

// ─── GET /api/portal/me ───────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const { serialNo, phone } = req.customer;
    const pool = await getPool();

    const result = await pool.request()
      .input('sno', sql.NVarChar, serialNo)
      .query(`
        SELECT TOP 1
          IDX, SERIALNO, CUSTDISPLAY_NAME, CUSTFULL_NAME,
          MOBILENO, EMAIL, DOB, LOYALTY_TYPE,
          COMPANY_CODE, COMPANY_NAME, CUSTOMER_LOCK,
          CITY, NIC, OCCUPATION
        FROM tb_LOYALTYCUSTOMER_MAIN
        WHERE SERIALNO = @sno
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const cust   = result.recordset[0];
    const points = await getPointsSummary(pool, serialNo);

    res.json({
      success: true,
      customer: {
        serialNo:        (cust.SERIALNO || '').trim(),
        name:            cust.CUSTDISPLAY_NAME || '',
        fullName:        cust.CUSTFULL_NAME    || '',
        email:           cust.EMAIL            || '',
        phone:           cust.MOBILENO         || '',
        dateOfBirth:     cust.DOB              || null,
        city:            cust.CITY             || '',
        nic:             cust.NIC              || '',
        occupation:      cust.OCCUPATION       || '',
        loyaltyType:     cust.LOYALTY_TYPE     || '',
        companyCode:     (cust.COMPANY_CODE || '').trim(),
        companyName:     cust.COMPANY_NAME     || '',
        availablePoints: parseFloat(points.available || 0),
        totalPoints:     parseFloat(points.earned    || 0),
        redeemedPoints:  parseFloat(points.redeemed  || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─── PUT /api/portal/me ───────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const { serialNo } = req.customer;
    const { email, city, occupation, dob } = req.body;
    const pool = await getPool();

    await pool.request()
      .input('sno',        sql.NVarChar, serialNo)
      .input('email',      sql.NVarChar, email      || null)
      .input('city',       sql.NVarChar, city       || null)
      .input('occupation', sql.NVarChar, occupation || null)
      .input('dob',        sql.DateTime, dob        || null)
      .query(`
        UPDATE tb_LOYALTYCUSTOMER_MAIN SET
          EMAIL      = ISNULL(@email,      EMAIL),
          CITY       = ISNULL(@city,       CITY),
          OCCUPATION = ISNULL(@occupation, OCCUPATION),
          DOB        = ISNULL(@dob,        DOB),
          EDIT_DATE  = GETDATE(),
          EDIT_TIME  = GETDATE()
        WHERE SERIALNO = @sno
      `);

    // Return updated profile
    return getMe(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─── GET /api/portal/transactions ────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { serialNo } = req.customer;
    const { type, page = 1, limit = 20 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit) + 1;
    const end   = start + parseInt(limit) - 1;

    const pool = await getPool();
    const req2 = pool.request()
      .input('sno',   sql.NVarChar, serialNo)
      .input('start', sql.Int,      start)
      .input('end',   sql.Int,      end);

    let typeFilter = '';
    if (type === 'earn')   { typeFilter = "AND ID = 'EN'"; }
    if (type === 'redeem') { typeFilter = "AND ID = 'RD'"; }

    const result = await req2.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY INVOICE_DATE DESC, INVOICE_TIME DESC) AS RowNum,
          IDX, SERIALNO, CUSTOMER_NAME, LOYALTY_TYPE, ID,
          INVOICENO, INVOICE_DATE, INVOICE_TIME,
          AMOUNT, RATE, CURRATE, MOBILENO,
          COMPANY_CODE, COMPANY_NAME, SMS
        FROM tb_LOYALTY_TRANSACTION
        WHERE SERIALNO = @sno AND SMS = 'T' ${typeFilter}
      ) AS Paged
      WHERE RowNum BETWEEN @start AND @end
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─── GET /api/portal/rewards ─────────────────────────────────────────────────
const getRewards = async (req, res) => {
  try {
    const { serialNo } = req.customer;
    const posPool     = await getPool();
    const loyaltyPool = await getLoyaltyPool();

    // Get current available points from POSBACK
    const pts = await getPointsSummary(posPool, serialNo);

    const result = await loyaltyPool.request()
      .input('today', lsql.Date, new Date())
      .query(`
        SELECT IDX, TITLE, DESCRIPTION, CATEGORY, POINTS_COST,
               ICON, VALID_UNTIL, STOCK, IS_ACTIVE
        FROM tb_REWARDS
        WHERE IS_ACTIVE = 1
          AND (VALID_UNTIL IS NULL OR VALID_UNTIL >= @today)
          AND (STOCK IS NULL OR STOCK > 0)
        ORDER BY POINTS_COST ASC
      `);

    const available = parseFloat(pts.available || 0);
    const rewards   = result.recordset.map(r => ({
      ...r,
      canRedeem: available >= r.POINTS_COST,
    }));

    res.json({ success: true, rewards, currentPoints: available });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─── GET /api/portal/redemptions ─────────────────────────────────────────────
const getMyRedemptions = async (req, res) => {
  try {
    const { serialNo } = req.customer;
    const loyaltyPool  = await getLoyaltyPool();

    const result = await loyaltyPool.request()
      .input('sno', lsql.NVarChar, serialNo)
      .query(`
        SELECT R.IDX, R.POINTS_COST, R.STATUS, R.REDEEMED_AT, R.FULFILLED_AT, R.NOTES,
               RW.TITLE AS REWARD_TITLE, RW.CATEGORY
        FROM tb_REDEMPTIONS R
        LEFT JOIN tb_REWARDS RW ON RW.IDX = R.REWARD_ID
        WHERE R.CUSTOMER_ID = @sno
        ORDER BY R.REDEEMED_AT DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ─── POST /api/portal/redeem ─────────────────────────────────────────────────
const redeemReward = async (req, res) => {
  try {
    const { serialNo, name } = req.customer;
    const { reward_id }      = req.body;
    if (!reward_id)
      return res.status(400).json({ success: false, message: 'reward_id required.' });

    const posPool     = await getPool();
    const loyaltyPool = await getLoyaltyPool();

    // Get reward
    const rwResult = await loyaltyPool.request()
      .input('rid',   lsql.Numeric, reward_id)
      .input('today', lsql.Date,    new Date())
      .query(`
        SELECT TOP 1 IDX, TITLE, POINTS_COST, STOCK
        FROM tb_REWARDS
        WHERE IDX = @rid AND IS_ACTIVE = 1
          AND (VALID_UNTIL IS NULL OR VALID_UNTIL >= @today)
          AND (STOCK IS NULL OR STOCK > 0)
      `);

    if (!rwResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Reward not found or unavailable.' });

    const reward  = rwResult.recordset[0];
    const pts     = await getPointsSummary(posPool, serialNo);
    const avail   = parseFloat(pts.available || 0);

    if (avail < reward.POINTS_COST)
      return res.status(400).json({
        success:   false,
        message:   `Insufficient points. Need ${reward.POINTS_COST - avail} more.`,
        shortfall: reward.POINTS_COST - avail,
      });

    // Insert redemption record (use serialNo as CUSTOMER_ID)
    await loyaltyPool.request()
      .input('sno',  lsql.NVarChar, serialNo)
      .input('rid2', lsql.Numeric,  reward.IDX)
      .input('pts2', lsql.Int,      reward.POINTS_COST)
      .query(`
        INSERT INTO tb_REDEMPTIONS (CUSTOMER_ID, REWARD_ID, POINTS_COST, STATUS, REDEEMED_AT)
        VALUES (@sno, @rid2, @pts2, 'pending', GETDATE())
      `);

    // Deduct points — insert RD transaction in POSBACK
    await posPool.request()
      .input('sno2',  sql.NVarChar, serialNo)
      .input('name',  sql.NVarChar, name || '')
      .input('pts3',  sql.Money,    reward.POINTS_COST)
      .input('title', sql.NVarChar, reward.TITLE)
      .query(`
        INSERT INTO tb_LOYALTY_TRANSACTION
          (SERIALNO, CUSTOMER_NAME, LOYALTY_TYPE, ID, INVOICENO,
           INVOICE_DATE, INVOICE_TIME, CASHIER, COMPANY_CODE, AMOUNT,
           RATE, CURRATE, MOBILENO, COMPANY_NAME, CUST_NAME, SMS, INSERT_TIME)
        SELECT
          @sno2, @name, LOYALTY_TYPE, 'RD', 'REDEEM-' + CAST(GETDATE() AS NVARCHAR(20)),
          CAST(GETDATE() AS DATE), GETDATE(), 'PORTAL', COMPANY_CODE, 0,
          @pts3, 1, MOBILENO, COMPANY_NAME, @name, 'T', GETDATE()
        FROM tb_LOYALTYCUSTOMER_MAIN
        WHERE SERIALNO = @sno2
      `);

    // Decrement stock
    await loyaltyPool.request()
      .input('rid3', lsql.Numeric, reward.IDX)
      .query('UPDATE tb_REWARDS SET STOCK = STOCK - 1 WHERE IDX = @rid3 AND STOCK IS NOT NULL AND STOCK > 0');

    const updatedPts = await getPointsSummary(posPool, serialNo);

    res.json({
      success:       true,
      message:       `Successfully redeemed "${reward.TITLE}"!`,
      currentPoints: parseFloat(updatedPts.available || 0),
    });
  } catch (err) {
    console.error('redeemReward:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getMe, updateMe, getTransactions, getRewards, getMyRedemptions, redeemReward };