// routes/portalRoutes.js  —  /api/portal/*
const express = require('express');
const router  = express.Router();

const { sendOtp, verifyOtp, qrLogin }        = require('../controllers/portalAuthController');
const { getMe, updateMe, getTransactions,
        getRewards, getMyRedemptions,
        redeemReward }                        = require('../controllers/portalCustomerController');
const { portalProtect }                       = require('../middleware/portalAuthMiddleware');

// Auth (no token needed)
router.post('/auth/send-otp',   sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/qr-login',   qrLogin);
router.post('/auth/logout',     (req, res) => {
  const name  = req.body.name  || 'Unknown';
  const email = req.body.email || '';
  const reason = req.body.reason || 'user logged out';
  console.log(`🔴 Logout — ${name} (${email}) — ${reason} — ${new Date().toLocaleTimeString()}`);
  res.json({ success: true });
});

// Self-service (portal JWT required)
router.get ('/me',           portalProtect, getMe);
router.put ('/me',           portalProtect, updateMe);
router.get ('/transactions', portalProtect, getTransactions);
router.get ('/rewards',      portalProtect, getRewards);
router.get ('/redemptions',  portalProtect, getMyRedemptions);
router.post('/redeem',       portalProtect, redeemReward);

module.exports = router;