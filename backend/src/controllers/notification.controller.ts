import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Get all notifications for current user
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete all notifications for current user
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ 
      message: 'All notifications deleted', 
      deletedCount: result.count 
    });
  } catch (error) {
    next(error);
  }
};

// Create notification (internal use - called from other controllers)
export const createNotification = async (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  relatedId?: string;
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        relatedId: data.relatedId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create notification via API (POST route handler)
export const createNotificationHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, message, type, targetUserId, relatedId, metadata } = req.body;

    if (!title || !message || !type || !targetUserId) {
      throw new AppError('title, message, type, and targetUserId are required', 400);
    }

    const notification = await createNotification({
      userId: targetUserId,
      type,
      title,
      message,
      metadata,
      relatedId,
    });

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

// Notify all managers about a failure report
export const notifyManagers = async (failureReport: {
  id: string;
  title: string;
  plant: string;
  severity: string;
  reportedByName: string;
}) => {
  try {
    // Get all managers
    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });

    // Create notifications for each manager
    const notifications = managers.map((manager) =>
      createNotification({
        userId: manager.id,
        type: 'FAILURE_REPORT',
        title: `Neuer Schadensbericht: ${failureReport.title}`,
        message: `${failureReport.reportedByName} hat einen ${failureReport.severity} Schaden in ${failureReport.plant} gemeldet: ${failureReport.title}`,
        metadata: {
          failureReportId: failureReport.id,
          plant: failureReport.plant,
          severity: failureReport.severity,
        },
        relatedId: failureReport.id,
      })
    );

    await Promise.all(notifications);
    console.log(`Created ${notifications.length} notifications for managers`);
  } catch (error) {
    console.error('Error notifying managers:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
};

// Delete old notifications (cleanup)
export const deleteOldNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        isRead: true,
      },
    });

    res.json({ message: `Deleted ${deleted.count} old notifications` });
  } catch (error) {
    next(error);
  }
};
