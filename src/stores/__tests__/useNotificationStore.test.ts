import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotificationStore } from "@/stores/useNotificationStore";

// Mock notificationService
vi.mock("@/services/notification.service", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteAllNotifications: vi.fn(),
    pollNotifications: vi.fn(),
  },
}));

import { notificationService } from "@/services/notification.service";

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe("fetch", () => {
    it("should load notifications and update state", async () => {
      const mockData = {
        notifications: [
          {
            id: "1",
            title: "Test",
            message: "Hello",
            type: "ACTION_ASSIGNED",
            isRead: false,
            createdAt: "2026-01-01",
          },
        ],
        unreadCount: 1,
      };

      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockData,
      );

      await useNotificationStore.getState().fetch();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(mockData.notifications);
      expect(state.unreadCount).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(notificationService.getNotifications).mockRejectedValue(
        new Error("Network error"),
      );

      await useNotificationStore.getState().fetch();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("markAsRead", () => {
    it("should optimistically update notification as read", async () => {
      useNotificationStore.setState({
        notifications: [
          {
            id: "1",
            title: "Test",
            message: "Hello",
            type: "ACTION_ASSIGNED",
            isRead: false,
            createdAt: "2026-01-01",
          },
        ],
        unreadCount: 1,
      });

      vi.mocked(notificationService.markAsRead).mockResolvedValue(undefined);

      await useNotificationStore.getState().markAsRead("1");

      const state = useNotificationStore.getState();
      expect(state.notifications[0].isRead).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      useNotificationStore.setState({
        notifications: [
          {
            id: "1",
            title: "A",
            message: "A",
            type: "ACTION_ASSIGNED",
            isRead: false,
            createdAt: "2026-01-01",
          },
          {
            id: "2",
            title: "B",
            message: "B",
            type: "COMMENT_MENTION",
            isRead: false,
            createdAt: "2026-01-02",
          },
        ],
        unreadCount: 2,
      });

      vi.mocked(notificationService.markAllAsRead).mockResolvedValue(
        undefined,
      );

      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n) => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("deleteAll", () => {
    it("should clear all notifications", async () => {
      useNotificationStore.setState({
        notifications: [
          {
            id: "1",
            title: "A",
            message: "A",
            type: "ACTION_ASSIGNED",
            isRead: false,
            createdAt: "2026-01-01",
          },
        ],
        unreadCount: 1,
      });

      vi.mocked(notificationService.deleteAllNotifications).mockResolvedValue(
        undefined,
      );

      await useNotificationStore.getState().deleteAll();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("startPolling", () => {
    it("should call pollNotifications and return cleanup", () => {
      const mockCleanup = vi.fn();
      vi.mocked(notificationService.pollNotifications).mockReturnValue(
        mockCleanup,
      );

      const cleanup = useNotificationStore.getState().startPolling(5000);

      expect(notificationService.pollNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        5000,
      );
      expect(typeof cleanup).toBe("function");

      cleanup();
      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});
