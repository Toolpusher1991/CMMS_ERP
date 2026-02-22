import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { chat, getQuickActions } from '../controllers/chatbot.controller';
import { validate } from '../middleware/validate.middleware';
import { chatSchema } from '../schemas/chatbot.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/chatbot/chat - Send message to chatbot
router.post('/chat', validate(chatSchema), chat);

// GET /api/chatbot/quick-actions - Get quick action suggestions
router.get('/quick-actions', getQuickActions);

export default router;
