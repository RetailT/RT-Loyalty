const { getPosbackPool, sql } = require('../config/userdb');

exports.companyInfoHandler = async (req, res) => {
  try {
    const posPool = await getPosbackPool();

    // Get company code from companyMiddleware (req.company.POSBACK_CODE)
    const code = req.company?.POSBACK_CODE || '01';

    const result = await posPool.request()
      .input('code', sql.Char, code.trim())
      .query(`
        SELECT TOP 1
          LTRIM(RTRIM(COMPANY_CODE)) AS code,
          LTRIM(RTRIM(COMPANY_NAME)) AS name,
          LTRIM(RTRIM(ADDRESS))      AS address,
          LTRIM(RTRIM(PHONE))        AS phone
        FROM dbo.tb_COMPANY
        WHERE LTRIM(RTRIM(COMPANY_CODE)) = LTRIM(RTRIM(@code))
      `);

    // Fallback — return first company if not found
    if (!result.recordset.length) {
      const fallback = await posPool.request()
        .query(`SELECT TOP 1
          LTRIM(RTRIM(COMPANY_CODE)) AS code,
          LTRIM(RTRIM(COMPANY_NAME)) AS name,
          LTRIM(RTRIM(ADDRESS))      AS address,
          LTRIM(RTRIM(PHONE))        AS phone
        FROM dbo.tb_COMPANY`);

      if (!fallback.recordset.length)
        return res.status(404).json({ success: false, message: 'Company not found.' });

      return res.json({ success: true, company: fallback.recordset[0] });
    }

    res.json({ success: true, company: result.recordset[0] });
  } catch (err) {
    console.error('[companyInfo]', err.message);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};