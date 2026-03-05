// config/userdb.js  —  RT_LOYALTY connection pool
const sql = require('mssql');
require('dotenv').config();

const loyaltyConfig = {
  server:   process.env.DB_SERVER || '173.208.167.190',
  port:     parseInt(process.env.DB_PORT) || 47182,
  database: process.env.LOYALTY_DB_DATABASE || 'RT_LOYALTY',
  user:     process.env.LOYALTY_DB_USER || process.env.DB_USER,
  password: process.env.LOYALTY_DB_PASSWORD || process.env.DB_PASSWORD,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout:    30000,
};

let loyaltyPool = null;

const getLoyaltyPool = async () => {
  if (!loyaltyPool) {
    loyaltyPool = await new sql.ConnectionPool(loyaltyConfig).connect();
    console.log('✅ RT_LOYALTY connected');
  }
  return loyaltyPool;
};

module.exports = { getLoyaltyPool, sql };