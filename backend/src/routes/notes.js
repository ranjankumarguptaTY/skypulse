import express from 'express';
import Note from '../models/Note.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* ─── List notes (active) ─── */
router.get('/', protect, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      isArchived: false,
    }).sort({ isPinned: -1, updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── List archived notes ─── */
router.get('/archived', protect, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      isArchived: true,
    }).sort({ updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── Create note ─── */
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, color, labels } = req.body;
    const note = await Note.create({
      userId: req.user._id,
      title: title || '',
      content: content || '',
      color: color || '#1e1e2e',
      labels: labels || [],
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── Update note ─── */
router.put('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const { title, content, color, isPinned, isArchived, labels } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;
    if (labels !== undefined) note.labels = labels;

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── Delete note ─── */
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
