const express = require('express');
const router  = express.Router();

const { companyMiddleware }  = require('../middleware/companyMiddleware');
const { portalProtect }      = require('../middleware/portalAuthMiddleware');
const auth                   = require('../controllers/portalAuthController');
const customer               = require('../controllers/portalCustomerController');

// ── Company info (public) ──────────────────────────────────────────────────────
// GET /api/portal/company
// GET /api/portal/company?shop=retailtarget
// companyMiddleware resolves the company, handler just returns req.company
// ── Company info (public) ──────────────────────────────────────────────────────
router.get('/company', companyMiddleware, (req, res) => {
  const c = req.company;
  res.json({
    success: true,
    company: {
      code:         c.POSBACK_CODE,
      name:         c.COMPANY_NAME,
      address:      c.CITY          || null,
      phone:        c.PHONE         || null,
      primaryColor: c.PRIMARY_COLOR  || null,
      secondaryColor: c.SECONDARY_COLOR || null,
    },
  });
});

// ── Apply companyMiddleware to all routes below ────────────────────────────────
router.use(companyMiddleware);

// ── Auth (no token needed) ────────────────────────────────────────────────────
router.post('/auth/send-otp',   auth.sendOtp);
router.post('/auth/verify-otp', auth.verifyOtp);
router.post('/auth/qr-login',   auth.qrLogin);
router.post('/auth/logout',     auth.logoutPortal);

// ── Customer (token required) ─────────────────────────────────────────────────
router.get ('/me',           portalProtect, customer.getMe);
router.put ('/me',           portalProtect, customer.updateMe);
router.get ('/transactions', portalProtect, customer.getTransactions);
router.get ('/company-info', portalProtect, (req, res) => {
  const c = req.company;
  res.json({
    success: true,
    company: {
      code:    c.POSBACK_CODE,
      name:    c.COMPANY_NAME,
      address: c.CITY  || null,
      phone:   c.PHONE || null,
    },
  });
});
router.get ('/redemptions',  portalProtect, customer.getMyRedemptions);
router.post('/redeem',       portalProtect, customer.redeemReward);
router.get ('/promotions',   portalProtect, customer.getPromotions);

module.exports = router;