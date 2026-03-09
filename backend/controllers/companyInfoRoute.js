// Add this GET /api/portal/company route to your main router (before portalRoutes)
// OR add inside portalRoutes.js BEFORE router.use(companyMiddleware)

// In portalRoutes.js — add at top before companyMiddleware:
// router.get('/company', companyInfoHandler);

const { getLoyaltyPool, sql } = require('../config/userdb');

exports.companyInfoHandler = async (req, res) => {
  try {
    const slug = (req.query.shop || req.headers['x-shop-slug'] || '').toLowerCase().trim();
    if (!slug) return res.status(400).json({ success: false, message: 'shop param required' });

    const pool   = await getLoyaltyPool();
    const result = await pool.request()
      .input('slug', sql.NVarChar, slug)
      .query(`
        SELECT TOP 1 IDX, COMPANY_NAME, CITY, DOMAIN_SLUG, IS_ACTIVE
        FROM dbo.tb_COMPANY
        WHERE DOMAIN_SLUG = @slug AND IS_ACTIVE = 1
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Shop not found: ' + slug });
    }

    res.json({ success: true, company: result.recordset[0] });
  } catch (err) {
    console.error('[companyInfo]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};