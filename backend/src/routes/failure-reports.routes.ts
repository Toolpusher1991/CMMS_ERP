import express from 'express';
import { authenticate as authenticateToken } from '../middleware/auth.middleware';
import * as failureReportController from '../controllers/failure-report.controller';
import { cloudinaryUpload } from '../lib/cloudinary';
import { validate } from '../middleware/validate.middleware';
import { updateFailureReportSchema, convertToActionSchema } from '../schemas/failure-report.schema';

const router = express.Router();

// GET all failure reports
router.get('/', authenticateToken, failureReportController.getFailureReports);

// GET single failure report
router.get('/:id', authenticateToken, failureReportController.getFailureReportById);

// CREATE new failure report with photo
router.post(
  '/',
  authenticateToken,
  cloudinaryUpload.single('photo'),
  async (req, res) => {
    try {
      // Add photo info to request body if photo was uploaded to Cloudinary
      if (req.file) {
        const cloudinaryFile = req.file as any;
        // Store the public_id as filename for reference
        req.body.photoFilename = cloudinaryFile.public_id || cloudinaryFile.filename;
        // Store the full Cloudinary URL
        req.body.photoPath = cloudinaryFile.secure_url || cloudinaryFile.url || cloudinaryFile.path;
      }
      
      await failureReportController.createFailureReport(req as any, res);
    } catch (error) {
      console.error('Error in failure report upload:', error);
      res.status(500).json({ error: 'Failed to upload failure report' });
    }
  }
);

// UPDATE failure report
router.put('/:id', authenticateToken, validate(updateFailureReportSchema), failureReportController.updateFailureReport);

// DELETE failure report
router.delete('/:id', authenticateToken, failureReportController.deleteFailureReport);

// CONVERT to action
router.post('/:id/convert-to-action', authenticateToken, validate(convertToActionSchema), failureReportController.convertToAction);

// Serve uploaded photos - Redirect to Cloudinary or return 404
router.get('/photo/:filename', async (req, res) => {
  try {
    // For Cloudinary images, redirect to the actual URL
    // The photoPath should be stored as full Cloudinary URL in database
    const { filename } = req.params;
    
    // If it's a Cloudinary URL pattern, redirect
    if (filename.includes('cloudinary')) {
      return res.redirect(filename);
    }
    
    // Otherwise, return 404 (old local files are gone)
    res.status(404).json({ 
      error: 'Photo not found',
      message: 'This photo was uploaded before Cloudinary migration. Please re-upload.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load photo' });
  }
});

export default router;
