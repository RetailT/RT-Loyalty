require('dotenv').config();

const express = require('express');
const cors    = require('cors');

// Controllers
const authController        = require('../controllers/authController');
const customerController    = require('../controllers/customerController');
const transactionController = require('../controllers/transactionController');

// Middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Routes
const debugRouter = require('../routes/debug');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:    'RetailCo Loyalty API',
    version: '1.0.0',
    status:  'running',
    docs:    '/api/debug/health',
  });
});

// ─── Debug / Health ───────────────────────────────────────────────────────────
app.use('/api/debug', debugRouter);

// ─── Auth Routes ──────────────────────────────────────────────────────────────
// POST   /api/auth/login
// POST   /api/auth/register         (admin only)
// GET    /api/auth/me                (protected)
// PUT    /api/auth/change-password   (protected)

app.post('/api/auth/login',           authController.login);
app.post('/api/auth/register',        protect, adminOnly, authController.register);
app.get( '/api/auth/me',              protect, authController.getMe);
app.put( '/api/auth/change-password', protect, authController.changePassword);

// ─── Customer Routes ──────────────────────────────────────────────────────────
// GET    /api/customers              (protected) - list all with optional ?search= &tier= &status=
// GET    /api/customers/:id          (protected) - single customer + transactions
// GET    /api/customers/scan/:qrCode (protected) - QR code lookup
// POST   /api/customers              (protected) - create new customer
// PUT    /api/customers/:id          (protected) - update customer
// DELETE /api/customers/:id          (admin only) - delete customer
// POST   /api/customers/:id/points   (protected) - add/redeem points

app.get(   '/api/customers',                  protect, customerController.getAllCustomers);
app.get(   '/api/customers/scan/:qrCode',     protect, customerController.scanQR);
app.get(   '/api/customers/:id',              protect, customerController.getCustomerById);
app.post(  '/api/customers',                  protect, customerController.createCustomer);
app.put(   '/api/customers/:id',              protect, customerController.updateCustomer);
app.delete('/api/customers/:id',              protect, adminOnly, customerController.deleteCustomer);
app.post(  '/api/customers/:id/points',       protect, customerController.updatePoints);

// ─── Transaction Routes ───────────────────────────────────────────────────────
// GET /api/transactions              (protected) - all transactions with optional filters
// GET /api/transactions/stats        (protected) - dashboard stats

app.get('/api/transactions',       protect, transactionController.getAllTransactions);
app.get('/api/transactions/stats', protect, transactionController.getStats);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start (local dev) ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Retail Loyalty API running on http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/api/debug/health\n`);
});

// Export for Vercel serverless
module.exports = app;