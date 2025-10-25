import { Router } from 'express';
import { getUserQRCode, listUsersWithQRCodes } from '../controllers/qr-code.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Nur für ADMIN und MANAGER
router.get('/users/:userId/qr-code', authenticate, getUserQRCode);
router.get('/users/qr-codes', authenticate, listUsersWithQRCodes);

export default router;
