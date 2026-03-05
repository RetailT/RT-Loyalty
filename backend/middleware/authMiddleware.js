// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * protect — verifies JWT, attaches req.user
 */
const protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

/**
 * adminOnly — must come after protect
 * Uses DEPARTMENT field from tb_USERS
 * Set department = 'ADMIN' for admin users in the DB
 */
const adminOnly = (req, res, next) => {
  const dept = (req.user?.department || '').trim().toUpperCase();
  if (dept !== 'ADMIN' && dept !== 'SUPERADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { protect, adminOnly };