const sql = require('mssql');
require('dotenv').config();

const SERVER = process.env.DB_SERVER || '173.208.167.190';
const PORT   = parseInt(process.env.DB_PORT) || 47182;

const baseOptions = {
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout:    30000,
};

// ── RT_LOYALTY ────────────────────────────────────────────
const loyaltyConfig = {
  ...baseOptions,
  server:   SERVER,
  port:     PORT,
  database: process.env.LOYALTY_DB_DATABASE || 'RT_LOYALTY',
  user:     process.env.LOYALTY_DB_USER     || process.env.DB_USER,
  password: process.env.LOYALTY_DB_PASSWORD || process.env.DB_PASSWORD,
};

// ── POSBACK_SYSTEM ────────────────────────────────────────
const posbackConfig = {
  ...baseOptions,
  server:   SERVER,
  port:     PORT,
  database: process.env.POSBACK_DB_DATABASE || 'POSBACK_SYSTEM',
  user:     process.env.POSBACK_DB_USER     || process.env.DB_USER,
  password: process.env.POSBACK_DB_PASSWORD || process.env.DB_PASSWORD,
};

let loyaltyPool = null;
let posbackPool = null;

const getLoyaltyPool = async () => {
  if (!loyaltyPool) {
    loyaltyPool = await new sql.ConnectionPool(loyaltyConfig).connect();
    console.log('✅ RT_LOYALTY connected');
  }
  return loyaltyPool;
};

const getPosbackPool = async () => {
  if (!posbackPool) {
    posbackPool = await new sql.ConnectionPool(posbackConfig).connect();
    console.log('✅ POSBACK_SYSTEM connected');
  }
  return posbackPool;
};

module.exports = { getLoyaltyPool, getPosbackPool, sql };