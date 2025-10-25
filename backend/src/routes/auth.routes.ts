import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  forgotPassword,
} from '../controllers/auth.controller';
import { qrLogin } from '../controllers/qr-auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/qr-login', qrLogin); // QR-Code Login für Mobile
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);

export default router;
