const express = require('express');
const router  = express.Router();

const { companyMiddleware }      = require('../middleware/companyMiddleware');
const { portalProtect }          = require('../middleware/portalAuthMiddleware');
const auth                       = require('../controllers/portalAuthController');
const customer                   = require('../controllers/portalCustomerController');
const { companyInfoHandler }     = require('../controllers/companyInfoRoute');

// ── Company info (no middleware — public endpoint) ─────────
// GET /api/portal/company?shop=keells-nugegoda
router.get('/company', companyInfoHandler);

// companyMiddleware ← routes
router.use(companyMiddleware);

// ── Auth (no token needed) ────────────────────────────────
router.post('/auth/send-otp',   auth.sendOtp);
router.post('/auth/verify-otp', auth.verifyOtp);
router.post('/auth/qr-login',   auth.qrLogin);
router.post('/auth/logout',     auth.logoutPortal);

// ── Customer (token required) ─────────────────────────────
router.get ('/me',           portalProtect, customer.getMe);
router.put ('/me',           portalProtect, customer.updateMe);
router.get ('/transactions', portalProtect, customer.getTransactions);
router.get ('/company-info', portalProtect, companyInfoHandler);
router.get ('/redemptions',  portalProtect, customer.getMyRedemptions);
router.post('/redeem',       portalProtect, customer.redeemReward);
router.get ('/promotions',   portalProtect, customer.getPromotions);

module.exports = router;