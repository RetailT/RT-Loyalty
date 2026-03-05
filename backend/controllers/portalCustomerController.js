// controllers/portalCustomerController.js
// Customer self-service portal (RT_LOYALTY db)
const { getLoyaltyPool, sql } = require('../config/userdb');

const TIER_THRESHOLDS = {
  Bronze:   { next: 'Silver',   nextAt: 3000  },
  Silver:   { next: 'Gold',     nextAt: 10000 },
  Gold:     { next: 'Platinum', nextAt: 30000 },
  Platinum: { next: null,       nextAt: null  },
};

function shape(c) {
  const tier = c.MEMBERSHIP_TIER || 'Bronze';
  const cfg  = TIER_THRESHOLDS[tier] || {};
  return {
    idx:             c.IDX,
    name:            c.NAME,
    email:           c.EMAIL          || '',
    phone:           c.PHONE          || '',
    dateOfBirth:     c.DATE_OF_BIRTH  || '',
    membershipId:    c.MEMBERSHIP_ID,
    membershipTier:  tier,
    availablePoints: c.AVAILABLE_POINTS,
    totalPoints:     c.TOTAL_POINTS,
    redeemedPoints:  c.REDEEMED_POINTS,
    joinDate:        c.JOIN_DATE,
    lastActivity:    c.LAST_ACTIVITY,
    tierExpiry:      c.TIER_EXPIRY,
    status:          c.STATUS,
    tierNext:        cfg.next   || null,
    tierNextAt:      cfg.nextAt || null,
    qrCode:          c.QR_CODE,
  };
}

// GET /api/portal/me
const getMe = async (req, res) => {
  try {
    const pool   = await getLoyaltyPool();
    const result = await pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .query('SELECT * FROM tb_CUSTOMERS WHERE IDX = @custid');

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    res.json({ success: true, customer: shape(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// PUT /api/portal/me
const updateMe = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();
    const { name, email, phone, date_of_birth } = req.body;

    await pool.request()
      .input('custid', sql.Numeric,  req.customer.custid)
      .input('name',   sql.NVarChar, name          || null)
      .input('email',  sql.NVarChar, email         || null)
      .input('phone',  sql.NVarChar, phone         || null)
      .input('dob',    sql.Date,     date_of_birth || null)
      .query(`
        UPDATE tb_CUSTOMERS SET
          NAME          = ISNULL(@name,  NAME),
          EMAIL         = ISNULL(@email, EMAIL),
          PHONE         = ISNULL(@phone, PHONE),
          DATE_OF_BIRTH = ISNULL(@dob,   DATE_OF_BIRTH),
          UPDATED_AT    = GETDATE()
        WHERE IDX = @custid
      `);

    const result = await pool.request()
      .input('custid2', sql.Numeric, req.customer.custid)
      .query('SELECT * FROM tb_CUSTOMERS WHERE IDX = @custid2');

    res.json({ success: true, message: 'Profile updated.', customer: shape(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/portal/transactions?type=earn|redeem&page=1&limit=20
const getTransactions = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();
    const { type, page = 1, limit = 20 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit) + 1;
    const end   = (parseInt(page) - 1) * parseInt(limit) + parseInt(limit);

    const req2 = pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .input('start',  sql.Int,     start)
      .input('end',    sql.Int,     end);

    let typeFilter = '';
    if (type) {
      typeFilter = 'AND T.TYPE = @type';
      req2.input('type', sql.NVarChar, type);
    }

    const result = await req2.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY T.TX_DATE DESC, T.CREATED_AT DESC) AS RowNum,
          T.IDX, T.TX_DATE, T.TYPE, T.POINTS, T.BILL_AMOUNT,
          T.DESCRIPTION, T.SHOP_ID
        FROM tb_TRANSACTIONS T
        WHERE T.CUSTOMER_ID = @custid ${typeFilter}
      ) AS Paged
      WHERE RowNum BETWEEN @start AND @end
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/portal/rewards
const getRewards = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();

    const custResult = await pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .query('SELECT AVAILABLE_POINTS FROM tb_CUSTOMERS WHERE IDX = @custid');

    if (!custResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const pts = custResult.recordset[0].AVAILABLE_POINTS;

    const result = await pool.request()
      .input('today', sql.Date, new Date())
      .query(`
        SELECT IDX, TITLE, DESCRIPTION, CATEGORY, POINTS_COST,
               ICON, VALID_UNTIL, STOCK, IS_ACTIVE
        FROM tb_REWARDS
        WHERE IS_ACTIVE = 1
          AND (VALID_UNTIL IS NULL OR VALID_UNTIL >= @today)
          AND (STOCK IS NULL OR STOCK > 0)
        ORDER BY POINTS_COST ASC
      `);

    const rewards = result.recordset.map(r => ({
      ...r,
      canRedeem: pts >= r.POINTS_COST,
    }));

    res.json({ success: true, rewards, currentPoints: pts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/portal/redemptions
const getMyRedemptions = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();
    const result = await pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .query(`
        SELECT R.IDX, R.POINTS_COST, R.STATUS, R.REDEEMED_AT, R.FULFILLED_AT, R.NOTES,
               RW.TITLE AS REWARD_TITLE, RW.CATEGORY
        FROM tb_REDEMPTIONS R
        LEFT JOIN tb_REWARDS RW ON RW.IDX = R.REWARD_ID
        WHERE R.CUSTOMER_ID = @custid
        ORDER BY R.REDEEMED_AT DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/portal/redeem
const redeemReward = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();
    const { reward_id } = req.body;
    if (!reward_id)
      return res.status(400).json({ success: false, message: 'reward_id required.' });

    // Get reward
    const rwResult = await pool.request()
      .input('rid',   sql.Numeric, reward_id)
      .input('today', sql.Date,    new Date())
      .query(`
        SELECT TOP 1 IDX, TITLE, POINTS_COST, STOCK
        FROM tb_REWARDS
        WHERE IDX = @rid AND IS_ACTIVE = 1
          AND (VALID_UNTIL IS NULL OR VALID_UNTIL >= @today)
          AND (STOCK IS NULL OR STOCK > 0)
      `);

    if (!rwResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Reward not found or unavailable.' });

    const reward = rwResult.recordset[0];

    // Check points
    const custResult = await pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .query('SELECT AVAILABLE_POINTS FROM tb_CUSTOMERS WHERE IDX = @custid');

    const pts = custResult.recordset[0].AVAILABLE_POINTS;
    if (pts < reward.POINTS_COST)
      return res.status(400).json({
        success:   false,
        message:   `Insufficient points. Need ${reward.POINTS_COST - pts} more.`,
        shortfall: reward.POINTS_COST - pts,
      });

    // Deduct points
    await pool.request()
      .input('custid', sql.Numeric, req.customer.custid)
      .input('pts',    sql.Int,     reward.POINTS_COST)
      .query(`
        UPDATE tb_CUSTOMERS SET
          AVAILABLE_POINTS = AVAILABLE_POINTS - @pts,
          REDEEMED_POINTS  = REDEEMED_POINTS  + @pts,
          LAST_ACTIVITY    = CAST(GETDATE() AS DATE),
          UPDATED_AT       = GETDATE()
        WHERE IDX = @custid
      `);

    // Transaction log
    await pool.request()
      .input('custid', sql.Numeric,  req.customer.custid)
      .input('pts',    sql.Int,      -reward.POINTS_COST)
      .input('desc',   sql.NVarChar, 'Redeemed: ' + reward.TITLE)
      .query(`
        INSERT INTO tb_TRANSACTIONS (CUSTOMER_ID, TYPE, POINTS, BILL_AMOUNT, DESCRIPTION, TX_DATE, CREATED_AT)
        VALUES (@custid, 'redeem', @pts, 0, @desc, CAST(GETDATE() AS DATE), GETDATE())
      `);

    // Redemption record
    const txResult = await pool.request()
      .input('custid2', sql.Numeric, req.customer.custid)
      .query('SELECT TOP 1 IDX FROM tb_TRANSACTIONS WHERE CUSTOMER_ID = @custid2 ORDER BY CREATED_AT DESC');

    await pool.request()
      .input('custid3', sql.Numeric, req.customer.custid)
      .input('rid2',    sql.Numeric, reward.IDX)
      .input('txid',    sql.Numeric, txResult.recordset[0].IDX)
      .input('pts2',    sql.Int,     reward.POINTS_COST)
      .query(`
        INSERT INTO tb_REDEMPTIONS (CUSTOMER_ID, REWARD_ID, TRANSACTION_ID, POINTS_COST, STATUS, REDEEMED_AT)
        VALUES (@custid3, @rid2, @txid, @pts2, 'pending', GETDATE())
      `);

    // Decrement stock if applicable
    await pool.request()
      .input('rid3', sql.Numeric, reward.IDX)
      .query('UPDATE tb_REWARDS SET STOCK = STOCK - 1 WHERE IDX = @rid3 AND STOCK IS NOT NULL AND STOCK > 0');

    const updated = await pool.request()
      .input('custid4', sql.Numeric, req.customer.custid)
      .query('SELECT AVAILABLE_POINTS FROM tb_CUSTOMERS WHERE IDX = @custid4');

    res.json({
      success:       true,
      message:       `Successfully redeemed "${reward.TITLE}"!`,
      currentPoints: updated.recordset[0].AVAILABLE_POINTS,
    });
  } catch (err) {
    console.error('redeemReward:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getMe, updateMe, getTransactions, getRewards, getMyRedemptions, redeemReward };