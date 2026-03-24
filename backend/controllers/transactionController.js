const { getPosbackPool, sql } = require('../config/userdb');

// GET /api/transactions?from=&to=&serialno=&transtype=&page=1&limit=20
const getAllTransactions = async (req, res) => {
  try {
    const pool = await getPosbackPool();
    const { from, to, serialno, transtype, page = 1, limit = 20 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit) + 1;
    const end   = (parseInt(page) - 1) * parseInt(limit) + parseInt(limit);

    const req2 = pool.request()
      .input('start', sql.Int, start)
      .input('end',   sql.Int, end);

    const filters = [];

    if (from && to) {
      filters.push('T.INVOICE_DATE BETWEEN @from AND @to');
      req2.input('from', sql.Date, from);
      req2.input('to',   sql.Date, to);
    }
    if (serialno) {
      filters.push('T.SERIALNO = @serialno');
      req2.input('serialno', sql.NVarChar, serialno);
    }
    if (transtype) {
      filters.push("LTRIM(RTRIM(T.ID)) = @transtype");
      req2.input('transtype', sql.NVarChar, transtype);
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const result = await req2.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY T.INVOICE_DATE DESC, T.IDX DESC) AS RowNum,
          T.IDX,
          T.SERIALNO,
          T.CUSTOMER_NAME,
          LTRIM(RTRIM(T.ID))           AS ID,
          T.RATE,
          T.AMOUNT,
          T.INVOICENO,
          T.INVOICE_DATE,
          T.INVOICE_TIME,
          T.COMPANY_NAME,
          T.LOYALTY_TYPE,
          T.MOBILENO,
          C.CUSTDISPLAY_NAME           AS CUSTNAME,
          C.MOBILENO                   AS MOBILE
        FROM dbo.tb_LOYALTY_TRANSACTION T
        LEFT JOIN dbo.tb_LOYALTYCUSTOMER_MAIN C
          ON LTRIM(RTRIM(C.SERIALNO)) = LTRIM(RTRIM(T.SERIALNO))
         AND LTRIM(RTRIM(C.COMPANY_CODE)) = LTRIM(RTRIM(T.COMPANY_CODE))
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
    const posPool = await getPosbackPool();

    const statsRes = await posPool.request().query(`
      SELECT
        -- Total unique loyalty customers
        (SELECT COUNT(DISTINCT SERIALNO)
         FROM dbo.tb_LOYALTYCUSTOMER_MAIN
         WHERE LTRIM(RTRIM(CUSTOMER_LOCK)) <> 'T')                              AS totalCustomers,

        -- New customers this month
        (SELECT COUNT(*)
         FROM dbo.tb_LOYALTYCUSTOMER_MAIN
         WHERE CRDATE >= DATEADD(DAY,-30,GETDATE()))                            AS newThisMonth,

        -- Transactions this month
        (SELECT COUNT(*)
         FROM dbo.tb_LOYALTY_TRANSACTION
         WHERE INVOICE_DATE >= DATEADD(DAY,-30,GETDATE()))                      AS transactionsThisMonth,

        -- EN transactions this month
        (SELECT COUNT(*)
         FROM dbo.tb_LOYALTY_TRANSACTION
         WHERE LTRIM(RTRIM(ID))='EN'
           AND INVOICE_DATE >= DATEADD(DAY,-30,GETDATE()))                      AS earnsThisMonth,

        -- RM transactions this month
        (SELECT COUNT(*)
         FROM dbo.tb_LOYALTY_TRANSACTION
         WHERE LTRIM(RTRIM(ID))='RM'
           AND INVOICE_DATE >= DATEADD(DAY,-30,GETDATE()))                      AS reedemsThisMonth,

        -- Total points earned all time
        (SELECT ISNULL(SUM(RATE),0)
         FROM dbo.tb_LOYALTY_TRANSACTION
         WHERE LTRIM(RTRIM(ID))='EN')                                           AS totalPointsEverEarned,

        -- Total points outstanding (earned - redeemed)
        (SELECT ISNULL(SUM(CASE
            WHEN LTRIM(RTRIM(ID))='EN' THEN RATE
            WHEN LTRIM(RTRIM(ID))='RM' THEN -ABS(RATE)
            ELSE 0
          END),0)
         FROM dbo.tb_LOYALTY_TRANSACTION)                                       AS totalPointsOutstanding
    `);

    // Sales stats from tb_LOYALTY_TRANSACTION AMOUNT field
    const salesRes = await posPool.request().query(`
      SELECT
        ISNULL(SUM(AMOUNT), 0)   AS totalSales30Days,
        COUNT(*)                 AS totalBills30Days,
        ISNULL(AVG(AMOUNT), 0)   AS avgBillValue
      FROM dbo.tb_LOYALTY_TRANSACTION
      WHERE LTRIM(RTRIM(ID)) = 'EN'
        AND INVOICE_DATE >= DATEADD(DAY,-30,GETDATE())
    `);

    // Daily trend (last 7 days)
    const trendRes = await posPool.request().query(`
      SELECT
        CAST(INVOICE_DATE AS DATE)  AS saleDate,
        COUNT(*)                    AS bills,
        ISNULL(SUM(AMOUNT), 0)      AS total
      FROM dbo.tb_LOYALTY_TRANSACTION
      WHERE LTRIM(RTRIM(ID)) = 'EN'
        AND INVOICE_DATE >= DATEADD(DAY,-7,GETDATE())
      GROUP BY CAST(INVOICE_DATE AS DATE)
      ORDER BY saleDate
    `);

    // Top customers by available points
    const topRes = await posPool.request().query(`
      SELECT TOP 5
        LTRIM(RTRIM(SERIALNO))       AS SERIALNO,
        CUSTDISPLAY_NAME             AS NAME,
        MOBILENO                     AS PHONE,
        SUM(CASE
          WHEN LTRIM(RTRIM(ID))='EN' THEN RATE
          WHEN LTRIM(RTRIM(ID))='RM' THEN -ABS(RATE)
          ELSE 0
        END)                         AS AVAILABLE_POINTS,
        SUM(CASE WHEN LTRIM(RTRIM(ID))='EN' THEN RATE ELSE 0 END) AS TOTAL_POINTS,
        LTRIM(RTRIM(LOYALTY_TYPE))   AS MEMBERSHIP_TIER
      FROM dbo.tb_LOYALTY_TRANSACTION T
      LEFT JOIN dbo.tb_LOYALTYCUSTOMER_MAIN C
        ON LTRIM(RTRIM(C.SERIALNO))      = LTRIM(RTRIM(T.SERIALNO))
       AND LTRIM(RTRIM(C.COMPANY_CODE))  = LTRIM(RTRIM(T.COMPANY_CODE))
      GROUP BY LTRIM(RTRIM(T.SERIALNO)), CUSTDISPLAY_NAME, MOBILENO, LTRIM(RTRIM(LOYALTY_TYPE))
      ORDER BY AVAILABLE_POINTS DESC
    `);

    res.json({
      success: true,
      data: {
        loyalty: {
          ...statsRes.recordset[0],
        },
        sales:        salesRes.recordset[0],
        dailyTrend:   trendRes.recordset,
        topCustomers: topRes.recordset,
      },
    });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getAllTransactions, getStats };