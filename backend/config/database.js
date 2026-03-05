// config/database.js  —  POSBACK_SYSTEM connection pool
const sql = require('mssql');
require('dotenv').config();

const config = {
  server:   process.env.DB_SERVER   || '173.208.167.190',
  port:     parseInt(process.env.DB_PORT) || 47182,
  database: process.env.DB_DATABASE || 'POSBACK_SYSTEM',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:                 process.env.DB_ENCRYPT === 'true',
    trustServerCertificate:  true,
    enableArithAbort:        true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout:    30000,
};

let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ POSBACK_SYSTEM connected');
  }
  return pool;
};

module.exports = { getPool, sql };