// controllers/transactionController.js
const { getLoyaltyPool, sql } = require('../config/userdb');
const { getPool, sql: mainSql } = require('../config/database');

// GET /api/transactions?from=&to=&custid=&transtype=&page=1&limit=20
const getAllTransactions = async (req, res) => {
  try {
    const pool = await getLoyaltyPool();
    const { from, to, custid, transtype, page = 1, limit = 20 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit) + 1;
    const end   = (parseInt(page) - 1) * parseInt(limit) + parseInt(limit);

    const req2 = pool.request()
      .input('start', sql.Int, start)
      .input('end',   sql.Int, end);

    const filters = [];
    if (from && to) {
      filters.push('T.TX_DATE BETWEEN @from AND @to');
      req2.input('from', sql.Date, from);
      req2.input('to',   sql.Date, to);
    }
    if (custid) {
      filters.push('T.CUSTOMER_ID = @custid');
      req2.input('custid', sql.Numeric, custid);
    }
    if (transtype) {
      filters.push('T.TYPE = @transtype');
      req2.input('transtype', sql.NVarChar, transtype);
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const result = await req2.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY T.TX_DATE DESC, T.CREATED_AT DESC) AS RowNum,
          T.IDX, T.TX_DATE, T.CUSTOMER_ID, T.POINTS, T.TYPE,
          T.BILL_AMOUNT, T.DESCRIPTION,
          C.NAME AS CUSTNAME, C.PHONE AS MOBILE, C.MEMBERSHIP_ID
        FROM tb_TRANSACTIONS T
        LEFT JOIN tb_CUSTOMERS C ON C.IDX = T.CUSTOMER_ID
        ${where}
      ) AS Paged
      WHERE RowNum BETWEEN @start AND @end
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('getAllTransactions:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/transactions/stats
const getStats = async (req, res) => {
  try {
    const loyaltyPool = await getLoyaltyPool();
    const posPool     = await getPool();

    const loyaltyStats = await loyaltyPool.request().query(`
      SELECT
        (SELECT COUNT(*)             FROM tb_CUSTOMERS WHERE STATUS = 'active')                         AS totalCustomers,
        (SELECT COUNT(*)             FROM tb_CUSTOMERS WHERE JOIN_DATE >= DATEADD(DAY,-30,GETDATE()))   AS newThisMonth,
        (SELECT ISNULL(SUM(AVAILABLE_POINTS),0) FROM tb_CUSTOMERS WHERE STATUS = 'active')             AS totalPointsOutstanding,
        (SELECT ISNULL(SUM(TOTAL_POINTS),0)     FROM tb_CUSTOMERS WHERE STATUS = 'active')             AS totalPointsEverEarned,
        (SELECT COUNT(*)             FROM tb_TRANSACTIONS WHERE TX_DATE >= DATEADD(DAY,-30,GETDATE()))  AS transactionsThisMonth,
        (SELECT COUNT(*)             FROM tb_TRANSACTIONS WHERE TYPE = 'earn'   AND TX_DATE >= DATEADD(DAY,-30,GETDATE())) AS earnsThisMonth,
        (SELECT COUNT(*)             FROM tb_TRANSACTIONS WHERE TYPE = 'redeem' AND TX_DATE >= DATEADD(DAY,-30,GETDATE())) AS reedemsThisMonth
    `);

    const salesStats = await posPool.request().query(`
      SELECT
        ISNULL(SUM(NETAMT), 0) AS totalSales30Days,
        COUNT(*)               AS totalBills30Days,
        ISNULL(AVG(NETAMT), 0) AS avgBillValue
      FROM tb_SALES
      WHERE BILLDATE >= DATEADD(DAY,-30,GETDATE())
    `);

    const trend = await posPool.request().query(`
      SELECT
        CONVERT(DATE, BILLDATE) AS saleDate,
        COUNT(*)                AS bills,
        ISNULL(SUM(NETAMT),0)   AS total
      FROM tb_SALES
      WHERE BILLDATE >= DATEADD(DAY,-7,GETDATE())
      GROUP BY CONVERT(DATE, BILLDATE)
      ORDER BY saleDate
    `);

    const topCustomers = await loyaltyPool.request().query(`
      SELECT TOP 5 NAME, PHONE, AVAILABLE_POINTS, TOTAL_POINTS, MEMBERSHIP_TIER
      FROM tb_CUSTOMERS
      WHERE STATUS = 'active'
      ORDER BY AVAILABLE_POINTS DESC
    `);

    res.json({
      success: true,
      data: {
        loyalty:      loyaltyStats.recordset[0],
        sales:        salesStats.recordset[0],
        dailyTrend:   trend.recordset,
        topCustomers: topCustomers.recordset,
      },
    });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getAllTransactions, getStats };