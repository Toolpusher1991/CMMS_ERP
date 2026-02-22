import express from 'express';
import {
  getAllTenderConfigurations,
  createTenderConfiguration,
  updateTenderConfiguration,
  toggleContractStatus,
  deleteTenderConfiguration,
  getTenderConfiguration
} from '../controllers/tender.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTenderSchema, updateTenderSchema } from '../schemas/tender.schema';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/tender - Get all tender configurations for current user
router.get('/', getAllTenderConfigurations);

// POST /api/tender - Create a new tender configuration
router.post('/', validate(createTenderSchema), createTenderConfiguration);

// GET /api/tender/:id - Get a specific tender configuration
router.get('/:id', getTenderConfiguration);

// PUT /api/tender/:id - Update a tender configuration
router.put('/:id', validate(updateTenderSchema), updateTenderConfiguration);

// PATCH /api/tender/:id/contract-status - Toggle contract status
router.patch('/:id/contract-status', toggleContractStatus);

// DELETE /api/tender/:id - Delete a tender configuration
router.delete('/:id', deleteTenderConfiguration);

export default router;