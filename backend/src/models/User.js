import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fcmTokens: [{ type: String }],
    contactMasks: {
      type: Map,
      of: String,
      default: {},
    },
    notificationConfig: {
      displayName: { type: String, default: 'Weather Alert Service' },
      messageTemplate: {
        type: String,
        enum: ['weather', 'news', 'random'],
        default: 'weather',
      },
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
