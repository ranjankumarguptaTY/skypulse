import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import FileModel from '../models/File.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* ─── Upload file (goes through server → Cloudinary) ─── */
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Stream upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'skypulse',
          resource_type: 'auto',
          ...(req.file.mimetype.startsWith('image/') && {
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          }),
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const record = await FileModel.create({
      cloudinaryId: result.public_id,
      cloudinaryUrl: result.secure_url,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user.stationId,
    });

    res.status(201).json({
      fileId: record._id,
      cloudinaryUrl: record.cloudinaryUrl,
      originalName: record.originalName,
      fileSize: record.fileSize,
      fileType: record.fileType,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

/* ─── Download / access a file ─── */
router.get('/:fileId/download', protect, async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.fileId);
    if (!file || file.deleted) {
      return res.status(404).json({ message: 'File not found or expired' });
    }

    // Track first download (starts the 5-day expiry countdown)
    const already = file.downloadedBy.some(
      (d) => d.stationId === req.user.stationId
    );
    if (!already) {
      file.downloadedBy.push({
        stationId: req.user.stationId,
        downloadedAt: new Date(),
      });
      if (!file.firstDownloadAt && req.user.stationId !== file.uploadedBy) {
        file.firstDownloadAt = new Date();
        file.expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      }
      await file.save();
    }

    res.json({
      cloudinaryUrl: file.cloudinaryUrl,
      originalName: file.originalName,
      fileType: file.fileType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
