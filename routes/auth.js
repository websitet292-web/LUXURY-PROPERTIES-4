const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, fileStore } = require('../db/database');
const { JWT_SECRET, authenticateUser } = require('../middleware/auth');

// POST: /api/auth/user/login
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = null;
    if (db.isNative) {
      user = await db.get(
        `SELECT * FROM users WHERE email = ? OR username = ?`,
        [email.toLowerCase().trim(), email.toLowerCase().trim()]
      );
    } else {
      user = fileStore.data.users.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim() || u.username.toLowerCase() === email.toLowerCase().trim()
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact administrator.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = { ...user };
    delete safeUser.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST: /api/auth/user/register
router.post('/user/register', async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
    }

    let existing = null;
    if (db.isNative) {
      existing = await db.get(`SELECT id FROM users WHERE email = ? OR username = ?`, [email.toLowerCase().trim(), username.trim()]);
    } else {
      existing = fileStore.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() || u.username.toLowerCase() === username.toLowerCase().trim());
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email or username already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const displayName = name || username;
    const initialBalance = 0.00;
    const initialNegative = 0.00;

    let newUserId;
    if (db.isNative) {
      const result = await db.run(
        `INSERT INTO users (username, email, password_hash, phone, name, status, balance, negative_balance, total_deposit, total_earnings, total_withdrawn)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0.00, 0.00, 0.00)`,
        [username.trim(), email.toLowerCase().trim(), passwordHash, phone || '', displayName, initialBalance, initialNegative]
      );
      newUserId = result.lastID;
    } else {
      newUserId = fileStore.data.users.length + 1;
      const newUser = {
        id: newUserId,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        phone: phone || '',
        name: displayName,
        status: 'active',
        balance: initialBalance,
        negative_balance: initialNegative,
        total_deposit: 0.00,
        total_earnings: 0.00,
        total_withdrawn: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fileStore.data.users.push(newUser);
      fileStore.save();
    }

    const token = jwt.sign(
      { id: newUserId, username, email: email.toLowerCase().trim(), role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUserId,
        username,
        email: email.toLowerCase().trim(),
        name: displayName,
        phone: phone || '',
        balance: initialBalance,
        negative_balance: initialNegative,
        total_deposit: 0,
        total_earnings: 0,
        total_withdrawn: 0
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST: /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin email and password.' });
    }

    let admin = null;
    if (db.isNative) {
      admin = await db.get(
        `SELECT * FROM admins WHERE email = ? OR username = ?`,
        [email.toLowerCase().trim(), email.toLowerCase().trim()]
      );
    } else {
      admin = fileStore.data.admins.find(
        a => a.email.toLowerCase() === email.toLowerCase().trim() || a.username.toLowerCase() === email.toLowerCase().trim()
      );
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email, name: admin.name, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Admin authentication granted',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during admin login.' });
  }
});

// GET: /api/auth/me
router.get('/me', authenticateUser, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      let admin;
      if (db.isNative) {
        admin = await db.get(`SELECT id, username, email, name FROM admins WHERE id = ?`, [req.user.id]);
      } else {
        admin = fileStore.data.admins.find(a => a.id === req.user.id);
      }
      return res.json({ success: true, role: 'admin', user: admin });
    }

    let user;
    if (db.isNative) {
      user = await db.get(`SELECT id, username, email, name, phone, status, balance, negative_balance, total_deposit, total_earnings, total_withdrawn FROM users WHERE id = ?`, [req.user.id]);
    } else {
      user = fileStore.data.users.find(u => u.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, role: 'user', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving profile.' });
  }
});

module.exports = router;
