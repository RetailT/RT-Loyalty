const { getMasterPool, getShopPool, sql } = require('../config/userdb');

// ── Main/Admin domains — only these get the RT fallback ──────────────────────
const MAIN_DOMAINS = [
  'rtpos.web.lk',
  'www.rtpos.web.lk',
];

const companyMiddleware = async (req, res, next) => {
  try {
    const host    = req.headers.host || '';
    const devSlug = req.query.shop   || req.headers['x-shop-slug'];

    const cleanHost = host
      .replace(/^www\./, '')
      .replace(/:\d+$/, '')
      .toLowerCase()
      .trim();

    const isDev =
      cleanHost.includes('localhost') ||
      cleanHost.includes('127.0.0.1') ||
      cleanHost.includes('vercel.app');

    const isMainDomain = MAIN_DOMAINS.includes(cleanHost) || 
                         MAIN_DOMAINS.includes(`www.${cleanHost}`);

    let finalSlug = '';

    if (!isDev && !isMainDomain) {
      finalSlug = cleanHost;
    } else if (devSlug) {
      finalSlug = devSlug.trim().toLowerCase();
    }

    const masterPool = await getMasterPool();
    let serverRow    = null;

    // ── Shop domain lookup ────────────────────────────────────────────────────
    if (finalSlug) {
      const slugBase = finalSlug.split('.')[0];
      try {
        const r = await masterPool.request()
          .input('slug',     sql.NVarChar, finalSlug)
          .input('slugBase', sql.NVarChar, slugBase)
          .query(`
            SELECT TOP 1
              LTRIM(RTRIM(SERVERIP))     AS SERVERIP,
              LTRIM(RTRIM(PORTNO))       AS PORTNO,
              LTRIM(RTRIM(COMPANY_NAME)) AS COMPANY_NAME,
              LTRIM(RTRIM(CUSTOMERID))   AS CUSTOMERID
            FROM dbo.tb_SERVER_DETAILS
            WHERE (
              LTRIM(RTRIM(DOMAIN_SLUG)) = @slug OR
              LTRIM(RTRIM(DOMAIN_SLUG)) = @slugBase
            )
            AND (END_DATE IS NULL OR END_DATE >= GETDATE())
            ORDER BY IDX DESC
          `);
        if (r.recordset.length) serverRow = r.recordset[0];
      } catch (e) {
        console.warn('[companyMiddleware] SERVER_DETAILS query failed:', e.message);
      }

      // Unknown shop domain → block immediately
      if (!serverRow) {
        return res.status(404).json({
          success: false,
          message: 'Shop not configured. Please contact support.',
        });
      }
    }

    // ── Fallback: only for dev / main admin domain ────────────────────────────
    if (!serverRow) {
      if (!isDev && !isMainDomain) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Shop not configured.',
        });
      }

      // Dev or main domain → RT default server (CUSTOMERID = 500)
      const r = await masterPool.request()
        .query(`
          SELECT TOP 1
            LTRIM(RTRIM(SERVERIP))     AS SERVERIP,
            LTRIM(RTRIM(PORTNO))       AS PORTNO,
            LTRIM(RTRIM(COMPANY_NAME)) AS COMPANY_NAME,
            LTRIM(RTRIM(CUSTOMERID))   AS CUSTOMERID
          FROM dbo.tb_SERVER_DETAILS
          WHERE CUSTOMERID = 500
            AND (END_DATE IS NULL OR END_DATE >= GETDATE())
          ORDER BY IDX DESC
        `);

      if (r.recordset.length) serverRow = r.recordset[0];
      if (!serverRow) {
        return res.status(404).json({ 
          success: false, 
          message: 'Default server not found.' 
        });
      }
    }

    // ── Shop DB connect ───────────────────────────────────────────────────────
    const { SERVERIP, PORTNO } = serverRow;
    const shopPool = await getShopPool(SERVERIP, PORTNO);

    const r = await shopPool.request()
      .query(`
        SELECT TOP 1
          LTRIM(RTRIM(COMPANY_CODE))    AS POSBACK_CODE,
          LTRIM(RTRIM(COMPANY_NAME))    AS COMPANY_NAME,
          LTRIM(RTRIM(ADDRESS))         AS CITY,
          LTRIM(RTRIM(PHONE))           AS PHONE,
          LTRIM(RTRIM(PRIMARY_COLOR))   AS PRIMARY_COLOR,
          LTRIM(RTRIM(SECONDARY_COLOR)) AS SECONDARY_COLOR
        FROM dbo.tb_COMPANY
        WHERE LTRIM(RTRIM(COMPANY_CODE)) != ''
        ORDER BY IDX ASC
      `);

    if (!r.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found in shop DB.' 
      });
    }

    req.company  = r.recordset[0];
    req.shopPool = shopPool;
    req.shopSlug = finalSlug;

    console.log(`[companyMiddleware] ${finalSlug || 'dev-fallback'} → ${req.company.POSBACK_CODE} @ ${SERVERIP}:${PORTNO}`);
    next();

  } catch (err) {
    console.error('[companyMiddleware]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { companyMiddleware };