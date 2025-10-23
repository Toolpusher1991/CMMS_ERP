import { apiClient } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: string;
  relatedId?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

class NotificationService {
  // Get all notifications for current user
  async getNotifications(unreadOnly: boolean = false): Promise<NotificationsResponse> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await apiClient.get(`/notifications${params}`);
    return response as NotificationsResponse;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    return response as Notification;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiClient.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Poll for new notifications
  pollNotifications(
    callback: (data: NotificationsResponse) => void,
    interval: number = 30000 // 30 seconds
  ): () => void {
    const poll = async () => {
      try {
        const data = await this.getNotifications();
        callback(data);
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export const notificationService = new NotificationService();
