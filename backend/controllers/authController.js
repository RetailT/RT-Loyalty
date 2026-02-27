const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'retailco_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── POST /api/auth/login ────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const db   = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password, role = 'staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const db = readDB();
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      id:        uuidv4(),
      name,
      email:     email.toLowerCase(),
      password:  hashed,
      role:      ['admin', 'staff'].includes(role) ? role : 'staff',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDB(db);

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
function getMe(req, res) {
  try {
    const db   = readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const db    = readDB();
    const index = db.users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, db.users[index].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    db.users[index].password = await bcrypt.hash(newPassword, 10);
    writeDB(db);

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { login, register, getMe, changePassword };