const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../middleware/logger');

// Mock user store (in production, use database)
const users = new Map();
let userId = 1;

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Missing required fields' }
      });
    }

    // Check if user exists
    const userExists = Array.from(users.values()).find(u => u.email === email || u.username === username);
    if (userExists) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: userId++,
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.set(newUser.id, newUser);

    // Generate token
    const token = generateToken(newUser);

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: 'Registration failed' }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email and password required' }
      });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Login failed' }
    });
  }
});

module.exports = router;
