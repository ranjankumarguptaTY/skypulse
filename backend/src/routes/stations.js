import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* ─── Lookup station by Mobile Number or Station ID ─── */
router.post('/lookup', protect, async (req, res) => {
  try {
    const { phoneNumber, stationId } = req.body;

    if (!phoneNumber && !stationId) {
      return res.status(400).json({ message: 'Mobile number or Station ID required' });
    }

    let query;
    if (phoneNumber) {
      const clean = phoneNumber.trim().replace(/[\s-]/g, '');
      query = { phoneNumber: clean };
    } else {
      query = { stationId: stationId.trim().toLowerCase() };
    }

    const targetUser = await User.findOne(query).select('stationId phoneNumber isOnline lastSeen');

    if (!targetUser) {
      return res.status(404).json({
        message: 'No registered user found with this mobile number. The person must register on SkyPulse first.',
      });
    }

    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Cannot add your own mobile number.' });
    }

    res.json({
      found: true,
      stationId: targetUser.stationId,
      phoneNumber: targetUser.phoneNumber,
      isOnline: targetUser.isOnline,
      lastSeen: targetUser.lastSeen,
    });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ message: 'Server error during lookup' });
  }
});

/* ─── Save / Update Contact Notification Mask (Receiver Controlled) ─── */
router.post('/contact-mask', protect, async (req, res) => {
  try {
    const { contactStationId, mask } = req.body;
    if (!contactStationId) {
      return res.status(400).json({ message: 'contactStationId required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.contactMasks) {
      user.contactMasks = new Map();
    }

    if (mask && mask.trim()) {
      user.contactMasks.set(contactStationId.toLowerCase(), mask.trim());
    } else {
      user.contactMasks.delete(contactStationId.toLowerCase());
    }

    await user.save();
    res.json({ success: true, contactStationId, mask: mask?.trim() || null });
  } catch (error) {
    console.error('Contact mask update error:', error);
    res.status(500).json({ message: 'Failed to update contact mask' });
  }
});

/* ─── Check online status ─── */
router.get('/status/:stationId', protect, async (req, res) => {
  try {
    const station = await User.findOne({
      stationId: req.params.stationId.toLowerCase(),
    }).select('isOnline lastSeen');

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json({ isOnline: station.isOnline, lastSeen: station.lastSeen });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
