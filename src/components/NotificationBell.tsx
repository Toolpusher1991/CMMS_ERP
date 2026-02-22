import React, { useState, useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { Notification } from "@/services/notification.service";

interface NotificationBellProps {
  onNavigate?: (
    page:
      | "dashboard"
      | "projects"
      | "workorders"
      | "actions"
      | "tender"
      | "failures"
      | "admin"
  ) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigate,
}) => {
  const {
    notifications,
    unreadCount,
    fetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteAll,
    startPolling,
  } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { toast } = useToast();

  // Load notifications and start polling
  useEffect(() => {
    fetchNotifications(showUnreadOnly);
    const cleanup = startPolling(30000);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnreadOnly]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Clear all notifications (delete)
  const handleClearAll = async () => {
    try {
      await deleteAll();
      toast({
        title: "Inbox geleert",
        description: "Alle Benachrichtigungen wurden gelöscht.",
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Benachrichtigungen konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Navigate to related content
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    await handleMarkAsRead(notification.id);

    // Navigate based on type and relatedId (if onNavigate callback provided)
    if (notification.relatedId && onNavigate) {
      switch (notification.type) {
        case "FAILURE_REPORT":
          onNavigate("failures");
          break;
        case "ACTION_ASSIGNED":
        case "ACTION_COMPLETED":
        case "ACTION_STATUS_REQUEST":
        case "MATERIAL_REQUEST":
          onNavigate("actions");
          break;
        case "COMMENT_MENTION":
          onNavigate("projects");
          break;
        default:
          // Just mark as read, no navigation
          break;
      }
    }

    // Close popover after navigation
    setIsOpen(false);
  }; // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
    if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FAILURE_REPORT":
        return "⚠️";
      case "ACTION_ASSIGNED":
        return "📋";
      case "ACTION_COMPLETED":
        return "✅";
      case "COMMENT_MENTION":
        return "💬";
      default:
        return "🔔";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Benachrichtigungen</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs"
                  title="Inbox leeren"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Alle als gelesen
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!showUnreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnreadOnly(false)}
              className="flex-1"
            >
              Alle
            </Button>
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnreadOnly(true)}
              className="flex-1"
            >
              Ungelesen ({unreadCount})
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`mb-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
