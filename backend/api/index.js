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
const debugRouter  = require('../routes/debug');
const portalRouter = require('../routes/portalRoutes'); // ← Customer Portal

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL        || 'http://localhost:3000',
    process.env.PORTAL_FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:    'Retail Loyalty API',
    version: '1.1.0',
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
// All portal endpoints: /api/portal/*
app.use('/api/portal', portalRouter);

// ─── Admin Auth Routes ────────────────────────────────────────────────────────
app.post('/api/auth/login',           authController.login);
app.post('/api/auth/register',        protect, adminOnly, authController.register);
app.get( '/api/auth/me',              protect, authController.getMe);
app.put( '/api/auth/change-password', protect, authController.changePassword);

// ─── Admin Customer Routes ────────────────────────────────────────────────────
app.get(   '/api/customers',              protect, customerController.getAllCustomers);
app.get(   '/api/customers/scan/:qrCode', protect, customerController.scanQR);
app.get(   '/api/customers/:id',          protect, customerController.getCustomerById);
app.post(  '/api/customers',              protect, customerController.createCustomer);
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
  console.log(`   Health check          →  GET  /api/debug/health\n`);
});

module.exports = app;