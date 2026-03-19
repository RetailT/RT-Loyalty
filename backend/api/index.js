require('dotenv').config();

const express = require('express');
const cors    = require('cors');

// Controllers — Admin side
const authController        = require('../controllers/authController');
const customerController    = require('../controllers/customerController');
const transactionController = require('../controllers/transactionController');

// Middleware — Admin side
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Routes
const debugRouter       = require('../routes/debug');
const portalRouter      = require('../routes/portalRoutes');
const companyInfoRouter = require('../routes/companyInfoRoutes');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL        || 'http://localhost:3000',
      process.env.PORTAL_FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://rt-loyalty-frontend.vercel.app',
    ];

    if (allowed.includes(origin)) return callback(null, true);

    // ✅ Allow any shop domain (retailtarget.lk, kamals.lk, shopname.com ...)
    // Each shop buys their own domain — all point to this backend
    // companyMiddleware identifies the shop via domain lookup in tb_SERVER_DETAILS
    const isShopDomain = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(origin);

    if (isShopDomain) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shop-Slug'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:    'Retail Loyalty API',
    version: '1.2.0',
    status:  'running',
    portals: {
      admin:    '/api/auth/login',
      customer: '/api/portal/auth/send-otp',
    },
    docs: '/api/debug/health',
  });
});

// ─── Debug / Health ───────────────────────────────────────────────────────────
app.use('/api/debug', debugRouter);

// ─── Customer Portal Routes ───────────────────────────────────────────────────
app.use('/api/portal', portalRouter);

// ─── Company Info Route (shop-aware via companyMiddleware) ────────────────────
app.use('/api/company-info', companyInfoRouter);

// ─── Admin Auth Routes ────────────────────────────────────────────────────────
app.post('/api/auth/login',           authController.login);
app.post('/api/auth/register',        protect, adminOnly, authController.register);
app.get( '/api/auth/me',              protect, authController.getMe);
app.put( '/api/auth/change-password', protect, authController.changePassword);

// ─── Admin Customer Routes ────────────────────────────────────────────────────
app.get(   '/api/customers',              protect, customerController.getAllCustomers);
app.get(   '/api/customers/scan/:qrCode', protect, customerController.scanQR);
app.get(   '/api/customers/:id',          protect, customerController.getCustomerById);
app.post(  '/api/customers',             protect, customerController.createCustomer);
app.put(   '/api/customers/:id',          protect, customerController.updateCustomer);
app.delete('/api/customers/:id',          protect, adminOnly, customerController.deleteCustomer);
app.post(  '/api/customers/:id/points',   protect, customerController.updatePoints);

// ─── Admin Transaction Routes ─────────────────────────────────────────────────
app.get('/api/transactions',       protect, transactionController.getAllTransactions);
app.get('/api/transactions/stats', protect, transactionController.getStats);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Retail Loyalty API  →  http://localhost:${PORT}`);
  console.log(`   Admin login           →  POST /api/auth/login`);
  console.log(`   Customer OTP          →  POST /api/portal/auth/send-otp`);
  console.log(`   Health check          →  GET  /api/debug/health`);
  console.log(`   Company info          →  GET  /api/company-info`);
  console.log(`   Shop portal           →  retailtarget.lk`);
});

module.exports = app;