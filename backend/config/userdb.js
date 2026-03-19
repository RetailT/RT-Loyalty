const sql = require('mssql');
require('dotenv').config();

const MASTER_SERVER = (process.env.DB_SERVER || '173.208.167.190').trim();
const MASTER_PORT   = parseInt((process.env.DB_PORT || '47182').trim());
const DB_USER       = (process.env.DB_USER     || '').trim();
const DB_PASSWORD   = (process.env.DB_PASSWORD || '').trim();

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

// ── RT_LOYALTY (master server only) ──────────────────────
const loyaltyConfig = {
  ...baseOptions,
  server:   MASTER_SERVER,
  port:     MASTER_PORT,
  database: (process.env.LOYALTY_DB_DATABASE || 'RT_LOYALTY').trim(),
  user:     (process.env.LOYALTY_DB_USER     || DB_USER).trim(),
  password: (process.env.LOYALTY_DB_PASSWORD || DB_PASSWORD).trim(),
};

// ── RTPOS_MAIN (master — server details table) ────────────
const masterConfig = {
  ...baseOptions,
  server:   MASTER_SERVER,
  port:     MASTER_PORT,
  database: 'RTPOS_MAIN',
  user:     (process.env.MASTER_DB_USER     || DB_USER).trim(),
  password: (process.env.MASTER_DB_PASSWORD || DB_PASSWORD).trim(),
};

// ── POSBACK_SYSTEM (master server — default fallback) ─────
const posbackConfig = {
  ...baseOptions,
  server:   MASTER_SERVER,
  port:     MASTER_PORT,
  database: (process.env.POSBACK_DB_DATABASE || 'POSBACK_SYSTEM').trim(),
  user:     (process.env.POSBACK_DB_USER     || DB_USER).trim(),
  password: (process.env.POSBACK_DB_PASSWORD || DB_PASSWORD).trim(),
};

let loyaltyPool = null;
let masterPool  = null;
let posbackPool = null;

// Dynamic pool cache — key: "ip:port"
const shopPoolCache = {};

const getLoyaltyPool = async () => {
  if (!loyaltyPool) {
    loyaltyPool = await new sql.ConnectionPool(loyaltyConfig).connect();
    console.log('✅ RT_LOYALTY connected');
  }
  return loyaltyPool;
};

const getMasterPool = async () => {
  if (!masterPool) {
    masterPool = await new sql.ConnectionPool(masterConfig).connect();
    console.log('✅ RTPOS_MAIN connected');
  }
  return masterPool;
};

const getPosbackPool = async () => {
  if (!posbackPool) {
    posbackPool = await new sql.ConnectionPool(posbackConfig).connect();
    console.log('✅ POSBACK_SYSTEM connected');
  }
  return posbackPool;
};

// ── Dynamic shop pool (per static IP shop server) ─────────
const getShopPool = async (serverIp, portNo) => {
  // ✅ CRITICAL: trim whitespace — prevents "124.43.x.x   :1433" connection bug
  const cleanIp   = (serverIp || '').trim();
  const cleanPort = parseInt((portNo || '47182').toString().trim());
  const key       = `${cleanIp}:${cleanPort}`;

  if (shopPoolCache[key]) return shopPoolCache[key];

  if (!cleanIp) throw new Error('getShopPool: serverIp is empty');

  const config = {
    ...baseOptions,
    server:   cleanIp,
    port:     cleanPort,
    database: 'POSBACK_SYSTEM',
    user:     DB_USER,
    password: DB_PASSWORD,
  };

  try {
    const pool = await new sql.ConnectionPool(config).connect();
    shopPoolCache[key] = pool;
    console.log(`✅ Shop DB connected: ${key}`);
    return pool;
  } catch (err) {
    console.error(`[getShopPool] Failed to connect to ${key} — ${err.message}`);
    throw err;
  }
};

module.exports = { getLoyaltyPool, getMasterPool, getPosbackPool, getShopPool, sql };