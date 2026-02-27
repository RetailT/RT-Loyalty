const express = require('express');
const router  = express.Router();
const { readDB } = require('../config/db');

// GET /api/debug/health
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status:  'OK',
    message: 'RetailCo Loyalty API is running.',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// GET /api/debug/db-status
router.get('/db-status', (req, res) => {
  try {
    const db = readDB();
    res.status(200).json({
      success: true,
      counts: {
        users:        db.users.length,
        customers:    db.customers.length,
        transactions: db.transactions.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;