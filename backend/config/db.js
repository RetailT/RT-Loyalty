/**
 * config/db.js
 * Exports: sql, query(), getPool(), getLoyaltyPool(), readDB(), writeDB()
 */

require('dotenv').config();
const mssql = require('mssql');

const posbackConfig = {
  server:   process.env.DB_SERVER   || '173.208.167.190',
  port:     parseInt(process.env.DB_PORT) || 47182,
  database: process.env.DB_DATABASE || 'POSBACK_SYSTEM',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options:  { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  pool:     { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000, requestTimeout: 30000,
};

const loyaltyConfig = {
  server:   process.env.DB_SERVER || '173.208.167.190',
  port:     parseInt(process.env.DB_PORT) || 47182,
  database: process.env.LOYALTY_DB_DATABASE || 'RT_LOYALTY',
  user:     process.env.LOYALTY_DB_USER     || process.env.DB_USER,
  password: process.env.LOYALTY_DB_PASSWORD || process.env.DB_PASSWORD,
  options:  { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  pool:     { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000, requestTimeout: 30000,
};

let _posPool = null, _loyaltyPool = null;

const getPool = async () => {
  if (!_posPool) { _posPool = await mssql.connect(posbackConfig); console.log('✅ POSBACK_SYSTEM connected'); }
  return _posPool;
};

const getLoyaltyPool = async () => {
  if (!_loyaltyPool) { _loyaltyPool = await new mssql.ConnectionPool(loyaltyConfig).connect(); console.log('✅ RT_LOYALTY connected'); }
  return _loyaltyPool;
};

const sql = mssql;

/**
 * query(text, params) — parameterised query against RT_LOYALTY
 * params shape: { paramName: { type: sql.X, value: v } }
 */
const query = async (text, params = {}) => {
  const pool = await getLoyaltyPool();
  const req  = pool.request();
  for (const [name, { type, value }] of Object.entries(params)) {
    req.input(name, type, value ?? null);
  }
  return (await req.query(text)).recordset;
};

/**
 * readDB / writeDB — keeps portalAuthController's JSON-file API
 * but backed by SQL Server tb_OTP_SESSIONS, tb_CUSTOMERS, tb_TRANSACTIONS
 */
const readDB = async () => {
  const pool = await getLoyaltyPool();
  const [c, o, t] = await Promise.all([
    pool.request().query(`
      SELECT id, name, email, phone, date_of_birth,
             membership_id AS membershipId, membership_tier AS membershipTier,
             total_points AS totalPoints, available_points AS availablePoints,
             redeemed_points AS redeemedPoints,
             join_date AS joinDate, last_activity AS lastActivity, status
      FROM tb_CUSTOMERS`),
    pool.request().query(`
      SELECT id, email, otp, expires_at AS expiresAt, used, is_new
      FROM tb_OTP_SESSIONS
      WHERE expires_at > DATEADD(HOUR, -1, SYSUTCDATETIME())`),
    pool.request().query(`
      SELECT id, customer_id AS customerId, type, points,
             bill_amount AS amount, description, tx_date AS date
      FROM tb_TRANSACTIONS`),
  ]);
  return {
    customers:    c.recordset,
    otpSessions:  o.recordset.map(s => ({
      ...s, used: !!s.used, is_new: !!s.is_new,
      expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt,
    })),
    transactions: t.recordset,
  };
};

const writeDB = async (db) => {
  const pool = await getLoyaltyPool();

  for (const s of (db.otpSessions || [])) {
    await pool.request()
      .input('id',      sql.UniqueIdentifier, s.id)
      .input('email',   sql.NVarChar,         s.email)
      .input('otp',     sql.NVarChar,         s.otp)
      .input('expires', sql.DateTime2,        new Date(s.expiresAt))
      .input('used',    sql.Bit,              s.used   ? 1 : 0)
      .input('is_new',  sql.Bit,              s.is_new ? 1 : 0)
      .query(`
        MERGE tb_OTP_SESSIONS AS target
        USING (SELECT @id AS id) AS src ON target.id = src.id
        WHEN MATCHED THEN
          UPDATE SET otp=@otp, expires_at=@expires, used=@used, is_new=@is_new
        WHEN NOT MATCHED THEN
          INSERT (id,email,otp,expires_at,used,is_new)
          VALUES (@id,@email,@otp,@expires,@used,@is_new);`);
  }

  for (const c of (db.customers || [])) {
    await pool.request()
      .input('id',       sql.UniqueIdentifier, c.id)
      .input('name',     sql.NVarChar,         c.name)
      .input('email',    sql.NVarChar,         c.email)
      .input('phone',    sql.NVarChar,         c.phone         || '')
      .input('dob',      sql.Date,             c.date_of_birth || null)
      .input('memid',    sql.NVarChar,         c.membershipId)
      .input('tier',     sql.NVarChar,         c.membershipTier  || 'Bronze')
      .input('total',    sql.Int,              c.totalPoints     || 0)
      .input('avail',    sql.Int,              c.availablePoints || 0)
      .input('redeemed', sql.Int,              c.redeemedPoints  || 0)
      .input('joindate', sql.Date,             c.joinDate)
      .input('lastact',  sql.Date,             c.lastActivity)
      .input('status',   sql.NVarChar,         c.status || 'active')
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tb_CUSTOMERS WHERE id=@id)
          INSERT INTO tb_CUSTOMERS
            (id,name,email,phone,date_of_birth,membership_id,membership_tier,
             total_points,available_points,redeemed_points,join_date,last_activity,status,created_at,updated_at)
          VALUES
            (@id,@name,@email,@phone,@dob,@memid,@tier,
             @total,@avail,@redeemed,@joindate,@lastact,@status,
             SYSUTCDATETIME(),SYSUTCDATETIME())`);
  }

  for (const t of (db.transactions || [])) {
    await pool.request()
      .input('id',   sql.UniqueIdentifier, t.id)
      .input('cid',  sql.UniqueIdentifier, t.customerId)
      .input('type', sql.NVarChar,         t.type)
      .input('pts',  sql.Int,              t.points  || 0)
      .input('amt',  sql.Decimal(18,2),    t.amount  || 0)
      .input('desc', sql.NVarChar,         t.description || '')
      .input('date', sql.Date,             t.date)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tb_TRANSACTIONS WHERE id=@id)
          INSERT INTO tb_TRANSACTIONS
            (id,customer_id,type,points,bill_amount,description,tx_date,created_at)
          VALUES (@id,@cid,@type,@pts,@amt,@desc,@date,SYSUTCDATETIME())`);
  }
};

module.exports = { sql, query, getPool, getLoyaltyPool, readDB, writeDB };