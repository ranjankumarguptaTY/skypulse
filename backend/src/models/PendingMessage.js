import mongoose from 'mongoose';

const pendingMessageSchema = new mongoose.Schema(
  {
    fromStation: { type: String, required: true, index: true },
    toStation: { type: String, required: true, index: true },
    encryptedPayload: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'file', 'image'],
      default: 'text',
    },
    fileMetadata: {
      fileId: String,
      cloudinaryUrl: String,
      fileName: String,
      fileSize: Number,
      fileType: String,
    },
    delivered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient query of undelivered messages
pendingMessageSchema.index({ toStation: 1, delivered: 1 });

// Auto-delete undelivered messages after 30 days
pendingMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('PendingMessage', pendingMessageSchema);
