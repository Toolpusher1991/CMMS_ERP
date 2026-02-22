import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as inspectionController from '../controllers/inspection-report.controller';
import { cloudinaryInspectionAttachmentsUpload } from '../lib/cloudinary';
import multer from 'multer';
import { validate } from '../middleware/validate.middleware';
import {
  createInspectionReportSchema,
  updateInspectionReportSchema,
  updateInspectionItemSchema,
} from '../schemas/inspection-report.schema';

const router = express.Router();
const pdfUpload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// Parse PDF and create report
router.post(
  '/parse-pdf',
  pdfUpload.single('pdf'),
  inspectionController.parsePDFAndCreateReport
);

// Inspection Reports
router.get('/', inspectionController.getInspectionReports);
router.get('/:id', inspectionController.getInspectionReport);
router.post('/', validate(createInspectionReportSchema), inspectionController.createInspectionReport);
router.put('/:id', validate(updateInspectionReportSchema), inspectionController.updateInspectionReport);
router.delete('/:id', inspectionController.deleteInspectionReport);

// Inspection Items
router.put('/items/:itemId', validate(updateInspectionItemSchema), inspectionController.updateInspectionItem);

// Attachments - with Cloudinary upload
router.post(
  '/:id/attachments',
  cloudinaryInspectionAttachmentsUpload.array('files', 10),
  inspectionController.uploadAttachment
);
router.delete('/:id/attachments/:attachmentId', inspectionController.deleteAttachment);

export default router;
