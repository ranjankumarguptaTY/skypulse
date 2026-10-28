import { v2 as cloudinary } from 'cloudinary';

export const initCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Cloudinary configured');
  } else {
    console.warn('Cloudinary not configured — file uploads will be disabled');
  }
};

export default cloudinary;
