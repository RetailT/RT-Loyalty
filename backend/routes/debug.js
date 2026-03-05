// routes/debug.js  —  /api/debug/*
const express = require('express');
const router  = express.Router();
const { getPool, sql }    = require('../config/database');
const { getLoyaltyPool }  = require('../config/userdb');

// GET /api/debug/health
router.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'Retail Loyalty API',
    version:   '1.1.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// GET /api/debug/ping
router.get('/ping', (req, res) => res.json({ pong: true, time: new Date() }));

// GET /api/debug/db  — test POSBACK_SYSTEM
router.get('/db', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query('SELECT DB_NAME() AS db, GETDATE() AS serverTime');
    res.json({ success: true, ...result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/debug/loyalty-db  — test RT_LOYALTY
router.get('/loyalty-db', async (req, res) => {
  try {
    const pool   = await getLoyaltyPool();
    const result = await pool.request().query('SELECT DB_NAME() AS db, GETDATE() AS serverTime');
    res.json({ success: true, ...result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/debug/tables
router.get('/tables', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME`
    );
    res.json({ success: true, count: result.recordset.length, tables: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/debug/table/:name  — preview top 10 rows (development only)
router.get('/table/:name', async (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ message: 'Not available in production.' });
  try {
    const pool   = await getPool();
    const name   = req.params.name.replace(/[^a-zA-Z0-9_]/g, ''); // sanitize
    const result = await pool.request().query(`SELECT TOP 10 * FROM ${name}`);
    res.json({ success: true, table: name, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;