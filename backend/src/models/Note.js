import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    color: { type: String, default: '#1e1e2e' },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    labels: [{ type: String }],
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, isArchived: 1, isPinned: -1 });

export default mongoose.model('Note', noteSchema);
