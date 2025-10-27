import express from 'express';
import { authenticate as authenticateToken } from '../middleware/auth.middleware';
import * as failureReportController from '../controllers/failure-report.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/failure-reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// GET all failure reports
router.get('/', authenticateToken, failureReportController.getFailureReports);

// GET single failure report
router.get('/:id', authenticateToken, failureReportController.getFailureReportById);

// CREATE new failure report with photo
router.post(
  '/',
  authenticateToken,
  upload.single('photo'),
  async (req, res) => {
    try {
      // Add photo info to request body if photo was uploaded
      if (req.file) {
        req.body.photoFilename = req.file.filename;
        req.body.photoPath = `/uploads/failure-reports/${req.file.filename}`;
      }
      
      await failureReportController.createFailureReport(req as any, res);
    } catch (error) {
      console.error('Error in failure report upload:', error);
      res.status(500).json({ error: 'Failed to upload failure report' });
    }
  }
);

// UPDATE failure report
router.put('/:id', authenticateToken, failureReportController.updateFailureReport);

// DELETE failure report
router.delete('/:id', authenticateToken, failureReportController.deleteFailureReport);

// CONVERT to action
router.post('/:id/convert-to-action', authenticateToken, failureReportController.convertToAction);

// Handle OPTIONS requests for photo route
router.options('/photo/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.status(200).end();
});

// Serve uploaded photos
router.get('/photo/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  // Set comprehensive CORS headers for image requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  if (fs.existsSync(filepath)) {
    // Set proper content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case '.webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
      default:
        res.setHeader('Content-Type', 'image/jpeg');
    }
    
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

export default router;
