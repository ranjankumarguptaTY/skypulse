import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// 180-day token to maintain login for months
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'skypulse_super_secret_jwt_2026', {
    expiresIn: '180d',
  });

/* ─── Register with Mobile Number ─── */
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, password, stationId } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 18) {
      return res.status(400).json({ message: 'Please enter a valid mobile number (8–18 digits)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if phone already registered
    const exists = await User.findOne({ phoneNumber: cleanPhone });
    if (exists) {
      return res.status(400).json({ message: 'This mobile number is already registered. Please login.' });
    }

    // Auto-generate or sanitize stationId
    const finalStationId = stationId?.trim()
      ? stationId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : `node-${cleanPhone.slice(-4)}`;

    // Verify stationId uniqueness
    const stationExists = await User.findOne({ stationId: finalStationId });
    const uniqueStationId = stationExists
      ? `${finalStationId}-${Math.floor(100 + Math.random() * 900)}`
      : finalStationId;

    const user = await User.create({
      phoneNumber: cleanPhone,
      stationId: uniqueStationId,
      password,
    });

    res.status(201).json({
      _id: user._id,
      phoneNumber: user.phoneNumber,
      stationId: user.stationId,
      notificationConfig: user.notificationConfig,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/* ─── Login with Mobile Number ─── */
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    user.lastSeen = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      phoneNumber: user.phoneNumber,
      stationId: user.stationId,
      notificationConfig: user.notificationConfig,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/* ─── Profile Check (Token Verification) ─── */
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    phoneNumber: req.user.phoneNumber,
    stationId: req.user.stationId,
    notificationConfig: req.user.notificationConfig,
    lastSeen: req.user.lastSeen,
  });
});

/* ─── Update notification preferences ─── */
router.put('/notification-config', protect, async (req, res) => {
  try {
    const { displayName, messageTemplate } = req.body;
    const user = await User.findById(req.user._id);

    user.notificationConfig = {
      displayName: displayName ?? user.notificationConfig.displayName,
      messageTemplate: messageTemplate ?? user.notificationConfig.messageTemplate,
    };
    await user.save();

    res.json(user.notificationConfig);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── Change password ─── */
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
