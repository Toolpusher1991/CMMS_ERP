import { create } from "zustand";
import {
  notificationService,
  type Notification,
} from "@/services/notification.service";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  fetch: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAll: () => Promise<void>;
  startPolling: (interval?: number) => () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const data = await notificationService.getNotifications(unreadOnly);
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
      });
    } catch (error) {
      console.error("Fehler beim Laden der Benachrichtigungen:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Fehler beim Markieren als gelesen:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Fehler beim Markieren aller als gelesen:", error);
    }
  },

  deleteAll: async () => {
    try {
      await notificationService.deleteAllNotifications();
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error("Fehler beim Löschen der Benachrichtigungen:", error);
    }
  },

  startPolling: (interval = 30000) => {
    const cleanup = notificationService.pollNotifications((data) => {
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
      });
    }, interval);

    return cleanup;
  },
}));
