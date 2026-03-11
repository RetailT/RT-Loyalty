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

    // ✅ FIX 1: Cross-shop token check
    // req.company is set by companyMiddleware (runs before portalProtect)
    const requestedCompany = req.company?.POSBACK_CODE;
    if (requestedCompany && decoded.companyCode !== requestedCompany) {
      console.warn(`⚠️  Cross-shop attempt: token=${decoded.companyCode} shop=${requestedCompany} user=${decoded.phone}`);
      return res.status(403).json({ success: false, message: 'Token not valid for this shop.' });
    }

    req.customer = decoded;
    next();
  } catch (err) {
    console.log(`🔴 Session ended — Token invalid/expired — ${new Date().toLocaleTimeString()}`);
    return res.status(401).json({ success: false, message: 'Portal token invalid or expired.' });
  }
};

module.exports = { portalProtect };