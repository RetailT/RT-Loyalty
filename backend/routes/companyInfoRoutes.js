const express = require('express');
const router  = express.Router();
const { sql } = require('../config/userdb');

router.get('/', async (req, res) => {
  try {
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
        LTRIM(RTRIM(COMPANY_CODE))      AS code,
        LTRIM(RTRIM(COMPANY_NAME))      AS name,
        LTRIM(RTRIM(ADDRESS))           AS address,
        LTRIM(RTRIM(PHONE))             AS phone,
        LTRIM(RTRIM(PRIMARY_COLOR))     AS primaryColor,
        LTRIM(RTRIM(SECONDARY_COLOR))   AS secondaryColor
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