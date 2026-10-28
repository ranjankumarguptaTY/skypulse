import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        'MONGODB_URI is not set! Please add MONGODB_URI in your Render Environment Variables tab.'
      );
    }

    // Clean any accidental whitespace or wrapping quotes from Render dashboard
    uri = uri.trim().replace(/^["']|["']$/g, '');

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
