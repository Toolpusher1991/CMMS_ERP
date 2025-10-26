import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { captureError } from '../lib/sentry';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface StatusRequestBody {
  involvedUsers: string[];
  message: string;
}

export const sendStatusRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id: actionId } = req.params;
    const { involvedUsers, message }: StatusRequestBody = req.body;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Action finden
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      include: {
        actionFiles: true
      }
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // Requester-Info laden
    const requester = await prisma.user.findUnique({
      where: { id: requesterId }
    });

    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    // Benachrichtigungen für alle beteiligten User erstellen
    const notifications = [];
    
    for (const userEmail of involvedUsers) {
      // User über Email finden
      const targetUser = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (targetUser) {
        const notification = await prisma.notification.create({
          data: {
            userId: targetUser.id,
            type: 'STATUS_REQUEST',
            title: `Status Abfrage für Action: ${action.title}`,
            message: `${requester.firstName} ${requester.lastName} bittet um ein Status-Update und Kommentar zu dieser Action: "${action.title}". Bitte kommentieren Sie den aktuellen Stand.`,
            relatedId: actionId,
            isRead: false,
            metadata: JSON.stringify({
              requesterId: requesterId,
              requesterName: `${requester.firstName} ${requester.lastName}`,
              actionTitle: action.title,
              originalMessage: message
            })
          }
        });
        notifications.push(notification);
      }
    }

    res.json({
      success: true,
      message: `Status-Abfrage an ${notifications.length} User gesendet`,
      notificationsSent: notifications.length
    });

  } catch (error) {
    console.error('Error sending status request:', error);
    captureError(error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
};