import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* ─── Save FCM token ─── */
router.post('/token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findById(req.user._id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }
    res.json({ message: 'Token saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── Remove FCM token (logout) ─── */
router.delete('/token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
    await user.save();
    res.json({ message: 'Token removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
