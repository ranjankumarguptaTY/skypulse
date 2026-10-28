import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    cloudinaryId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    originalName: String,
    fileSize: Number,
    fileType: String,
    uploadedBy: { type: String, required: true },
    downloadedBy: [
      {
        stationId: String,
        downloadedAt: Date,
      },
    ],
    firstDownloadAt: Date,
    expiresAt: Date,
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Sparse index on expiresAt for the cleanup scheduler
fileSchema.index({ expiresAt: 1 }, { sparse: true });
fileSchema.index({ deleted: 1 });

export default mongoose.model('File', fileSchema);
