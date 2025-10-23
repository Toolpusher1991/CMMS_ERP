import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { chat, getQuickActions } from '../controllers/chatbot.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/chatbot/chat - Send message to chatbot
router.post('/chat', chat);

// GET /api/chatbot/quick-actions - Get quick action suggestions
router.get('/quick-actions', getQuickActions);

export default router;
