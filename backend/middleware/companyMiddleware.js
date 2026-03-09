// Subdomain → tb_COMPANY → req.company attach
const { getLoyaltyPool, sql } = require('../config/userdb');

const companyMiddleware = async (req, res, next) => {
  try {
    const host = req.headers.host || '';
    // keells-nugegoda.rtpos.lk → slug = 'keells-nugegoda'
    const subdomain = host.split('.')[0].toLowerCase().trim();

    // Dev mode: ?shop=keells-nugegoda  OR  X-Shop-Slug: keells-nugegoda header
    const devSlug  = req.query.shop || req.headers['x-shop-slug'];
    const finalSlug = (devSlug || subdomain || '').trim().toLowerCase();

    if (!finalSlug) {
      return res.status(400).json({ success: false, message: 'Shop not identified.' });
    }

    const pool   = await getLoyaltyPool();
    const result = await pool.request()
      .input('slug', sql.NVarChar, finalSlug)
      .query(`
        SELECT TOP 1 IDX, COMPANY_NAME, CITY, IS_ACTIVE, DOMAIN_SLUG, POSBACK_CODE
        FROM   dbo.tb_COMPANY
        WHERE  DOMAIN_SLUG = @slug AND IS_ACTIVE = 1
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: `Shop not found: ${finalSlug}` });
    }

    req.company = result.recordset[0];
    // req.company = { IDX, COMPANY_NAME, CITY, DOMAIN_SLUG, POSBACK_CODE }
    next();
  } catch (err) {
    console.error('[companyMiddleware]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { companyMiddleware };