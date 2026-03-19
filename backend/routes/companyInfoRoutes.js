const express = require('express');
const router  = express.Router();
const { sql } = require('../config/userdb');

// ── GET /api/company-info ──────────────────────────────────
// Uses req.shopPool + req.company from companyMiddleware
// Do NOT use getPosbackPool() here — that always hits the master server
router.get('/', async (req, res) => {
  try {
    // ✅ Always use middleware-provided pool (correct shop server)
    const posPool = req.shopPool;
    const code    = req.company?.POSBACK_CODE;

    if (!posPool || !code) {
      return res.status(400).json({
        success: false,
        message: 'Shop context missing. Check companyMiddleware.',
      });
    }

    const result = await posPool.request()
      .input('code', sql.NVarChar, code.trim())
      .query(`
        SELECT TOP 1
          LTRIM(RTRIM(COMPANY_CODE)) AS code,
          LTRIM(RTRIM(COMPANY_NAME)) AS name,
          LTRIM(RTRIM(ADDRESS))      AS address,
          LTRIM(RTRIM(PHONE))        AS phone
        FROM dbo.tb_COMPANY
        WHERE LTRIM(RTRIM(COMPANY_CODE)) = LTRIM(RTRIM(@code))
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    res.json({ success: true, company: result.recordset[0] });

  } catch (err) {
    console.error('[companyInfo]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;