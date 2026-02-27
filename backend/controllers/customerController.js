const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// helper: auto-calculate tier from totalPoints
function calcTier(totalPoints) {
  if (totalPoints >= 30000) return 'Platinum';
  if (totalPoints >= 10000) return 'Gold';
  if (totalPoints >= 3000)  return 'Silver';
  return 'Bronze';
}

// ─── GET /api/customers ──────────────────────────────────────────────────────
function getAllCustomers(req, res) {
  try {
    const db   = readDB();
    const { search, tier, status } = req.query;

    let list = db.customers;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.membershipId.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    if (tier)   list = list.filter(c => c.membershipTier === tier);
    if (status) list = list.filter(c => c.status === status);

    // Attach transactions count
    const result = list.map(c => ({
      ...c,
      transactionCount: db.transactions.filter(t => t.customerId === c.id).length,
    }));

    return res.status(200).json({ success: true, count: result.length, customers: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── GET /api/customers/:id ──────────────────────────────────────────────────
function getCustomerById(req, res) {
  try {
    const db       = readDB();
    const customer = db.customers.find(c => c.id === req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const transactions = db.transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, customer: { ...customer, transactions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── GET /api/customers/scan/:qrCode ─────────────────────────────────────────
function scanQR(req, res) {
  try {
    const db       = readDB();
    const customer = db.customers.find(
      c => c.qrCode === req.params.qrCode || c.membershipId === req.params.qrCode
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'No customer found with this QR code.' });
    }

    const transactions = db.transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, customer: { ...customer, transactions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── POST /api/customers ─────────────────────────────────────────────────────
function createCustomer(req, res) {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email and phone are required.' });
    }

    const db = readDB();

    if (db.customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Generate next membership ID
    const nextNum       = String(db.customers.length + 1).padStart(3, '0');
    const year          = new Date().getFullYear();
    const membershipId  = `LYL-${year}-${nextNum}`;
    const id            = uuidv4();

    const newCustomer = {
      id,
      name,
      email:          email.toLowerCase(),
      phone,
      membershipId,
      membershipTier: 'Bronze',
      totalPoints:    0,
      availablePoints:0,
      redeemedPoints: 0,
      joinDate:       new Date().toISOString().split('T')[0],
      lastActivity:   new Date().toISOString().split('T')[0],
      qrCode:         id,
      status:         'active',
    };

    // Welcome bonus transaction
    const welcomeTx = {
      id:          uuidv4(),
      customerId:  id,
      date:        new Date().toISOString().split('T')[0],
      description: 'Welcome Bonus',
      points:      500,
      type:        'bonus',
      store:       'System',
      amount:      0,
    };

    newCustomer.totalPoints     = 500;
    newCustomer.availablePoints = 500;

    db.customers.push(newCustomer);
    db.transactions.push(welcomeTx);
    writeDB(db);

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      customer: newCustomer,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────
function updateCustomer(req, res) {
  try {
    const db    = readDB();
    const index = db.customers.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const allowed = ['name', 'email', 'phone', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        db.customers[index][field] = req.body[field];
      }
    });

    writeDB(db);
    return res.status(200).json({ success: true, message: 'Customer updated.', customer: db.customers[index] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── DELETE /api/customers/:id ────────────────────────────────────────────────
function deleteCustomer(req, res) {
  try {
    const db    = readDB();
    const index = db.customers.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    db.customers.splice(index, 1);
    // Also remove transactions
    db.transactions = db.transactions.filter(t => t.customerId !== req.params.id);
    writeDB(db);

    return res.status(200).json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── POST /api/customers/:id/points ──────────────────────────────────────────
// Add or redeem points
function updatePoints(req, res) {
  try {
    const { points, type, description, store, amount } = req.body;

    if (!points || !type || !description) {
      return res.status(400).json({ success: false, message: 'points, type and description are required.' });
    }

    const validTypes = ['earned', 'redeemed', 'bonus', 'expired'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
    }

    const db    = readDB();
    const index = db.customers.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customer = db.customers[index];
    const pts      = Number(points);

    if (type === 'redeemed') {
      if (customer.availablePoints < Math.abs(pts)) {
        return res.status(400).json({ success: false, message: 'Insufficient points balance.' });
      }
      customer.availablePoints -= Math.abs(pts);
      customer.redeemedPoints  += Math.abs(pts);
    } else {
      customer.availablePoints += Math.abs(pts);
      customer.totalPoints     += Math.abs(pts);
    }

    // Auto-update tier
    customer.membershipTier = calcTier(customer.totalPoints);
    customer.lastActivity   = new Date().toISOString().split('T')[0];

    // Add transaction record
    const tx = {
      id:          uuidv4(),
      customerId:  customer.id,
      date:        new Date().toISOString().split('T')[0],
      description,
      points:      type === 'redeemed' ? -Math.abs(pts) : Math.abs(pts),
      type,
      store:       store || 'System',
      amount:      amount || 0,
    };

    db.customers[index] = customer;
    db.transactions.push(tx);
    writeDB(db);

    const allTx = db.transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      message: `Points ${type} successfully.`,
      customer: { ...customer, transactions: allTx },
      transaction: tx,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  scanQR,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updatePoints,
};