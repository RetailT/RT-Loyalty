// controllers/authController.js
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' });

    const pool   = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT TOP 1
          IDX, USER_NAME, PASSWORD, DEPARTMENT, LOGIN
        FROM tb_USERS
        WHERE USER_NAME = @username
      `);

    const user = result.recordset[0];

    console.log('DB user found:', user
      ? { IDX: user.IDX, USER_NAME: user.USER_NAME, LOGIN: user.LOGIN, PASSWORD: user.PASSWORD }
      : 'NOT FOUND');

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // LOGIN = 'T' = active, 'F' = disabled
    console.log('LOGIN value:', JSON.stringify(user.LOGIN));
    if (user.LOGIN && user.LOGIN.trim() === 'F')
      return res.status(401).json({ success: false, message: 'Account is disabled.' });

    // Support plain-text and bcrypt passwords
    const isBcrypt = user.PASSWORD && user.PASSWORD.startsWith('$2');
    const isMatch  = isBcrypt
      ? await bcrypt.compare(password, user.PASSWORD)
      : password === user.PASSWORD;

    console.log('Password check:', {
      isBcrypt,
      inputPassword: password,
      dbPassword:    user.PASSWORD,
      isMatch,
    });

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signToken({
      userid:     user.IDX,
      username:   user.USER_NAME,
      department: user.DEPARTMENT,
    });

    res.json({
      success: true,
      token,
      user: {
        userid:     user.IDX,
        username:   user.USER_NAME,
        department: user.DEPARTMENT,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, password, department } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' });

    const pool = await getPool();

    const exists = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT TOP 1 IDX FROM tb_USERS WHERE USER_NAME = @username');
    if (exists.recordset.length)
      return res.status(409).json({ success: false, message: 'Username already exists.' });

    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username',   sql.NVarChar, username)
      .input('password',   sql.NVarChar, hashed)
      .input('department', sql.Char,     department || null)
      .query(`
        INSERT INTO tb_USERS (USER_NAME, PASSWORD, DEPARTMENT, LOGIN, INSERT_TIME)
        VALUES (@username, @password, @department, 'T', GETDATE())
      `);

    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('userid', sql.Numeric, req.user.userid)
      .query('SELECT IDX, USER_NAME, DEPARTMENT, LOGIN FROM tb_USERS WHERE IDX = @userid');

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'User not found.' });

    const u = result.recordset[0];
    res.json({
      success: true,
      user: {
        userid:     u.IDX,
        username:   u.USER_NAME,
        department: u.DEPARTMENT,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required.' });

    const pool   = await getPool();
    const result = await pool.request()
      .input('userid', sql.Numeric, req.user.userid)
      .query('SELECT TOP 1 PASSWORD FROM tb_USERS WHERE IDX = @userid');

    const user = result.recordset[0];
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    const isBcrypt = user.PASSWORD && user.PASSWORD.startsWith('$2');
    const isMatch  = isBcrypt
      ? await bcrypt.compare(currentPassword, user.PASSWORD)
      : currentPassword === user.PASSWORD;

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Current password incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('userid',   sql.Numeric,  req.user.userid)
      .input('password', sql.NVarChar, hashed)
      .query('UPDATE tb_USERS SET PASSWORD = @password WHERE IDX = @userid');

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { login, register, getMe, changePassword };