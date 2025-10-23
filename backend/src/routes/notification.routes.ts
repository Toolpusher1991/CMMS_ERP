import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications for current user
router.get('/', getNotifications);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/cleanup - Delete old notifications (admin only)
router.delete('/cleanup', deleteOldNotifications);

export default router;
