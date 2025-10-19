import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
