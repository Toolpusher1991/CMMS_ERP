import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as inspectionController from '../controllers/inspection-report.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Inspection Reports
router.get('/', inspectionController.getInspectionReports);
router.get('/:id', inspectionController.getInspectionReport);
router.post('/', inspectionController.createInspectionReport);
router.put('/:id', inspectionController.updateInspectionReport);
router.delete('/:id', inspectionController.deleteInspectionReport);

// Inspection Items
router.put('/items/:itemId', inspectionController.updateInspectionItem);

// Attachments
router.post('/:id/attachments', inspectionController.uploadAttachment);
router.delete('/attachments/:attachmentId', inspectionController.deleteAttachment);

export default router;
