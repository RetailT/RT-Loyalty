const { getPosbackPool, sql } = require('../config/userdb');

const companyMiddleware = async (req, res, next) => {
  try {
    const host      = req.headers.host || '';
    const subdomain = host.split('.')[0].toLowerCase().trim();
    const devSlug   = req.query.shop || req.headers['x-shop-slug'];
    const finalSlug = (devSlug || subdomain || '').trim().toLowerCase();

    const pool = await getPosbackPool();

    let result;

    if (finalSlug) {
      // Try DOMAIN_SLUG first
      result = await pool.request()
        .input('slug', sql.NVarChar, finalSlug)
        .query(`
          SELECT TOP 1
            LTRIM(RTRIM(COMPANY_CODE)) AS POSBACK_CODE,
            LTRIM(RTRIM(COMPANY_NAME)) AS COMPANY_NAME,
            LTRIM(RTRIM(ADDRESS))      AS CITY
          FROM dbo.tb_COMPANY
          WHERE LTRIM(RTRIM(DOMAIN_SLUG)) = @slug
        `);

      // Fallback — try COMPANY_CODE match
      if (!result.recordset.length) {
        result = await pool.request()
          .input('slug', sql.NVarChar, finalSlug)
          .query(`
            SELECT TOP 1
              LTRIM(RTRIM(COMPANY_CODE)) AS POSBACK_CODE,
              LTRIM(RTRIM(COMPANY_NAME)) AS COMPANY_NAME,
              LTRIM(RTRIM(ADDRESS))      AS CITY
            FROM dbo.tb_COMPANY
            WHERE LTRIM(RTRIM(COMPANY_CODE)) = @slug
          `);
      }
    }

    // Final fallback — return first company (for localhost dev)
    if (!result || !result.recordset.length) {
      result = await pool.request()
        .query(`
          SELECT TOP 1
            LTRIM(RTRIM(COMPANY_CODE)) AS POSBACK_CODE,
            LTRIM(RTRIM(COMPANY_NAME)) AS COMPANY_NAME,
            LTRIM(RTRIM(ADDRESS))      AS CITY
          FROM dbo.tb_COMPANY
        `);
    }

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'No company found.' });
    }

    req.company = result.recordset[0];
    next();
  } catch (err) {
    console.error('[companyMiddleware]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { companyMiddleware };