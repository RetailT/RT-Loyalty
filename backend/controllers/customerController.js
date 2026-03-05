// controllers/customerController.js
const { getLoyaltyPool, sql } = require('../config/userdb');
const { getPool, sql: mainSql } = require('../config/database');

// GET /api/customers?search=&page=1&limit=20
const getAllCustomers = async (req, res) => {
  try {
    const pool = await getPool();
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const end = offset + parseInt(limit);

    const req2 = pool.request()
      .input('start', mainSql.Int, offset + 1)
      .input('end',   mainSql.Int, end);

    let where = '';
    if (search) {
      where = `WHERE CUSTOMER_NAME LIKE @search OR CUSTOMER LIKE @search OR MOBILENO LIKE @search OR EMAIL LIKE @search`;
      req2.input('search', mainSql.NVarChar, `%${search}%`);
    }

    // Use ROW_NUMBER() for SQL Server 2008 compatibility
    const result = await req2.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY CUSTOMER_NAME) AS RowNum,
          IDX, CUSTOMER, CUSTOMER_NAME, TYPE, CREDITLIMIT, CREDITPERIOD,
          BALANCE, COMPANYNAME, ADDRESS, PHONENO1, PHONENO2, MOBILENO,
          EMAIL, AREACODE, TOWNCODE, COMPANY_CODE, CUSTTYPE, LOCK_CUSTOMER
        FROM tb_CUSTOMER
        ${where}
      ) AS Paged
      WHERE RowNum BETWEEN @start AND @end
    `);

    const countReq = pool.request();
    if (search) countReq.input('s2', mainSql.NVarChar, `%${search}%`);
    const countRes = await countReq.query(`
      SELECT COUNT(*) AS total FROM tb_CUSTOMER
      ${search ? 'WHERE CUSTOMER_NAME LIKE @s2 OR CUSTOMER LIKE @s2 OR MOBILENO LIKE @s2 OR EMAIL LIKE @s2' : ''}
    `);

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total: countRes.recordset[0].total,
      },
    });
  } catch (err) {
    console.error('getAllCustomers:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/customers/scan/:qrCode
const scanQR = async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('qr', mainSql.NVarChar, req.params.qrCode)
      .query(`
        SELECT TOP 1 IDX, CUSTOMER, CUSTOMER_NAME, MOBILENO, EMAIL,
               BALANCE, CREDITLIMIT, CUSTTYPE
        FROM tb_CUSTOMER
        WHERE CUSTOMER = @qr OR IDNO = @qr
      `);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', mainSql.Numeric, req.params.id)
      .query(`SELECT * FROM tb_CUSTOMER WHERE IDX = @id`);

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const pool = await getPool();
    const { customer, customer_name, type, mobileno, email, address, companyname, creditlimit, company_code } = req.body;

    if (!customer || !customer_name)
      return res.status(400).json({ success: false, message: 'customer and customer_name required.' });

    const dup = await pool.request()
      .input('customer', mainSql.NVarChar, customer)
      .query('SELECT TOP 1 IDX FROM tb_CUSTOMER WHERE CUSTOMER = @customer');
    if (dup.recordset.length)
      return res.status(409).json({ success: false, message: 'Customer code already exists.' });

    const result = await pool.request()
      .input('customer',      mainSql.NVarChar, customer)
      .input('customer_name', mainSql.NVarChar, customer_name)
      .input('type',          mainSql.NVarChar, type         || null)
      .input('mobileno',      mainSql.NVarChar, mobileno     || null)
      .input('email',         mainSql.NVarChar, email        || null)
      .input('address',       mainSql.NVarChar, address      || null)
      .input('companyname',   mainSql.NVarChar, companyname  || null)
      .input('creditlimit',   mainSql.Money,    creditlimit  || 0)
      .input('company_code',  mainSql.Char,     company_code || null)
      .query(`
        INSERT INTO tb_CUSTOMER
          (CUSTOMER, CUSTOMER_NAME, TYPE, MOBILENO, EMAIL, ADDRESS,
           COMPANYNAME, CREDITLIMIT, BALANCE, COMPANY_CODE, INSERT_TIME)
        OUTPUT INSERTED.IDX
        VALUES
          (@customer, @customer_name, @type, @mobileno, @email, @address,
           @companyname, @creditlimit, 0, @company_code, GETDATE())
      `);

    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('createCustomer:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const pool = await getPool();
    const { customer_name, type, mobileno, email, address, companyname, creditlimit, lock_customer } = req.body;

    await pool.request()
      .input('id',            mainSql.Numeric,  req.params.id)
      .input('customer_name', mainSql.NVarChar, customer_name)
      .input('type',          mainSql.NVarChar, type          || null)
      .input('mobileno',      mainSql.NVarChar, mobileno      || null)
      .input('email',         mainSql.NVarChar, email         || null)
      .input('address',       mainSql.NVarChar, address       || null)
      .input('companyname',   mainSql.NVarChar, companyname   || null)
      .input('creditlimit',   mainSql.Money,    creditlimit   || 0)
      .input('lock_customer', mainSql.Char,     lock_customer || 'N')
      .query(`
        UPDATE tb_CUSTOMER SET
          CUSTOMER_NAME = @customer_name, TYPE = @type,
          MOBILENO = @mobileno, EMAIL = @email, ADDRESS = @address,
          COMPANYNAME = @companyname, CREDITLIMIT = @creditlimit,
          LOCK_CUSTOMER = @lock_customer, EDITDATE = GETDATE()
        WHERE IDX = @id
      `);

    res.json({ success: true, message: 'Customer updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', mainSql.Numeric, req.params.id)
      .query(`UPDATE tb_CUSTOMER SET LOCK_CUSTOMER = 'Y' WHERE IDX = @id`);
    res.json({ success: true, message: 'Customer locked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/customers/:id/points
const updatePoints = async (req, res) => {
  try {
    const pool = await getPool();
    const { points, transtype = 'EARN', billno = '', remarks = '' } = req.body;

    if (points === undefined || isNaN(points))
      return res.status(400).json({ success: false, message: 'points (number) required.' });

    const custResult = await pool.request()
      .input('id', mainSql.Numeric, req.params.id)
      .query('SELECT TOP 1 MOBILENO, CUSTOMER, CUSTOMER_NAME FROM tb_CUSTOMER WHERE IDX = @id');

    if (!custResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const cust = custResult.recordset[0];
    const loyaltyPool = await getLoyaltyPool();
    const loyaltyResult = await loyaltyPool.request()
      .input('mobile', sql.NVarChar, cust.MOBILENO)
      .query('SELECT TOP 1 CUSTID, POINTS, TOTALPOINTS FROM tb_CUSTOMERS WHERE MOBILE = @mobile');

    if (!loyaltyResult.recordset.length)
      return res.status(404).json({ success: false, message: 'Loyalty account not found.' });

    const loyalty  = loyaltyResult.recordset[0];
    const newPts   = parseFloat(loyalty.POINTS) + parseFloat(points);
    const newTotal = parseFloat(loyalty.TOTALPOINTS) + (points > 0 ? parseFloat(points) : 0);

    if (newPts < 0)
      return res.status(400).json({ success: false, message: 'Insufficient points.' });

    await loyaltyPool.request()
      .input('custid', sql.Int,   loyalty.CUSTID)
      .input('pts',    sql.Float, newPts)
      .input('total',  sql.Float, newTotal)
      .query('UPDATE tb_CUSTOMERS SET POINTS = @pts, TOTALPOINTS = @total WHERE CUSTID = @custid');

    res.json({
      success: true,
      message: `Points ${points >= 0 ? 'added' : 'redeemed'}.`,
      data: { newPoints: newPts, totalPoints: newTotal },
    });
  } catch (err) {
    console.error('updatePoints:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getAllCustomers, scanQR, getCustomerById, createCustomer, updateCustomer, deleteCustomer, updatePoints };