import cron from 'node-cron';
import { v2 as cloudinary } from 'cloudinary';
import FileModel from '../models/File.js';

export const startFileCleanup = () => {
  // Run daily at 02:00
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Running file cleanup…');

    try {
      const expired = await FileModel.find({
        expiresAt: { $lte: new Date() },
        deleted: false,
      });

      console.log(`[Scheduler] Found ${expired.length} expired file(s)`);

      for (const file of expired) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryId, {
            resource_type: 'auto',
          });
          file.deleted = true;
          await file.save();
          console.log(`[Scheduler] Deleted: ${file.cloudinaryId}`);
        } catch (err) {
          console.error(`[Scheduler] Failed to delete ${file.cloudinaryId}:`, err.message);
        }
      }

      console.log('[Scheduler] File cleanup complete');
    } catch (err) {
      console.error('[Scheduler] Cleanup error:', err);
    }
  });

  console.log('[Scheduler] File cleanup cron started (daily at 02:00)');
};
