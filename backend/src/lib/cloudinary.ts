import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for failure report images
const failureReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cmms-erp/failure-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1920, height: 1920, crop: 'limit' }], // Max size
  } as any,
});

// Create Cloudinary storage for project files (all types)
const projectFilesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cmms-erp/project-files',
    resource_type: 'auto', // Allows all file types (images, videos, documents, etc.)
  } as any,
});

export const cloudinaryUpload = multer({ 
  storage: failureReportStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const cloudinaryProjectFilesUpload = multer({
  storage: projectFilesStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for project files
});

export { cloudinary };
