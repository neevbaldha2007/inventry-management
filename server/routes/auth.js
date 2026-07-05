const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(id, name, email, passwordHash);
    const token = jwt.sign({ id, name, email, role: 'manager' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id, name, email, role: 'manager' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request OTP (simulated)
router.post('/request-otp', (req, res) => {
  try {
    const { email } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }
    // In production, send real OTP via email/SMS
    res.json({ message: 'OTP sent to your email', otp_hint: 'Use 123456 for demo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP & Reset Password
router.post('/reset-password', (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (otp !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passwordHash, email);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { name, email } = req.body;
    const db = getDb();
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.user.id);
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
