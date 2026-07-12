const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate a random avatar color
function randomAvatarColor() {
  const colors = [
    '#E50914', '#B81D24', '#221F1F', '#F5F5F1',
    '#564d4d', '#831010', '#00a8e1', '#e87c03',
    '#46d369', '#6d56c1', '#2196F3', '#FF5722'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const avatarColor = randomAvatarColor();
    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, passwordHash, avatarColor]
    );

    const userId = rows[0].id;

    // Generate JWT
    const token = jwt.sign(
      { id: userId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: userId, username, email, avatar_color: avatarColor }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user by username or email
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1', [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_color: user.avatar_color
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, avatar_color, created_at FROM users WHERE id = $1', [req.user.id]
    );
    const user = rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
