// middleware/portalAuthMiddleware.js
const jwt = require('jsonwebtoken');

const portalProtect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Portal: no token provided.' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'retail_secret');
    if (!decoded.isPortalUser)
      return res.status(403).json({ success: false, message: 'Not a portal customer token.' });

    // decoded contains: serialNo, name, phone, companyCode, isPortalUser
    req.customer = decoded;
    next();
  } catch (err) {
    console.log(`🔴 Session ended — Token invalid/expired — ${new Date().toLocaleTimeString()}`);
    return res.status(401).json({ success: false, message: 'Portal token invalid or expired.' });
  }
};

module.exports = { portalProtect };