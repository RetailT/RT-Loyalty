const { readDB } = require('../config/db');

// ─── GET /api/transactions ────────────────────────────────────────────────────
function getAllTransactions(req, res) {
  try {
    const db = readDB();
    const { type, store, customerId, limit = 50 } = req.query;

    let list = db.transactions;

    if (customerId) list = list.filter(t => t.customerId === customerId);
    if (type)       list = list.filter(t => t.type === type);
    if (store)      list = list.filter(t => t.store.toLowerCase().includes(store.toLowerCase()));

    // Attach customer name
    const result = list
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit))
      .map(t => {
        const customer = db.customers.find(c => c.id === t.customerId);
        return { ...t, customerName: customer ? customer.name : 'Unknown' };
      });

    return res.status(200).json({ success: true, count: result.length, transactions: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── GET /api/transactions/stats ──────────────────────────────────────────────
function getStats(req, res) {
  try {
    const db = readDB();

    const totalCustomers  = db.customers.length;
    const totalPoints     = db.customers.reduce((s, c) => s + c.totalPoints,   0);
    const availablePoints = db.customers.reduce((s, c) => s + c.availablePoints,0);
    const redeemedPoints  = db.customers.reduce((s, c) => s + c.redeemedPoints, 0);

    const tierCounts = db.customers.reduce((acc, c) => {
      acc[c.membershipTier] = (acc[c.membershipTier] || 0) + 1;
      return acc;
    }, {});

    const txThisWeek = db.transactions.filter(t => {
      const txDate  = new Date(t.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return txDate >= weekAgo;
    });

    const redemptionsThisWeek = txThisWeek.filter(t => t.type === 'redeemed').length;
    const redemptionRate      = totalPoints > 0 ? Math.round((redeemedPoints / totalPoints) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalPoints,
        availablePoints,
        redeemedPoints,
        redemptionRate,
        redemptionsThisWeek,
        tierCounts,
        totalTransactions: db.transactions.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { getAllTransactions, getStats };