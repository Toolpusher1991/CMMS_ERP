import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRigs } from "@/hooks/useRigs";
import { getUserListCache, setUserListCache } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import type {
  Action,
  ActionUser,
  ApiAction,
  ApiActionFile,
  UserListItem,
} from "./types";
import { formatDateForInput as formatDate } from "./types";

/**
 * Hook that manages action data loading (actions + users) and CRUD operations.
 * Extracted from ActionTracker to reduce the main component's complexity.
 */
export function useActionData() {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { rigs: loadedRigs } = useRigs();
  const [actions, setActions] = useState<Action[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ActionUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const loadActions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.request<ApiAction[]>("/actions");

      const loadedActions: Action[] = response.map((item: ApiAction) => ({
        id: item.id,
        plant: item.plant,
        location: item.location,
        category: item.category as Action["category"],
        discipline: item.discipline as Action["discipline"],
        title: item.title,
        description: item.description || "",
        status: item.status as Action["status"],
        priority: item.priority as Action["priority"],
        assignedTo: item.assignedTo || "",
        assignedUsers: item.assignedUsers || [],
        dueDate: item.dueDate ? item.dueDate.split("T")[0] : "",
        completedAt: item.completedAt
          ? item.completedAt.split("T")[0]
          : undefined,
        createdBy: item.createdBy || "System",
        createdAt: item.createdAt
          ? item.createdAt.split("T")[0]
          : formatDate(new Date()),
        files: (item.actionFiles || []).map((file: ApiActionFile) => ({
          id: file.id,
          name: file.originalName || file.filename,
          type: file.fileType || "application/octet-stream",
          url:
            file.filePath ||
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5137"
            }/api/actions/files/${file.filename}`,
          uploadedAt: file.uploadedAt,
          isPhoto: file.isPhoto || false,
        })),
        comments: [],
        tasks: [],
      }));

      setActions(loadedActions);
      if (isMounted) {
        toast({
          variant: "success" as const,
          title: "Actions geladen",
          description: `${loadedActions.length} Actions erfolgreich geladen.`,
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden der Actions:", error);
      if (
        isMounted &&
        error instanceof Error &&
        !error.message.includes("Token refresh failed")
      ) {
        toast({
          title: "Fehler",
          description: "Actions konnten nicht geladen werden.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [isMounted, toast]);

  const processUsers = useCallback((userList: UserListItem[]) => {
    const allUsers: ActionUser[] = userList.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || "",
      role: user.role || "USER",
      plant: user.assignedPlant || "",
    }));

    const filteredUsers =
      currentUser?.assignedPlant &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "MANAGER"
        ? allUsers.filter(
            (user) =>
              !user.plant || user.plant === currentUser.assignedPlant,
          )
        : allUsers;

    setAvailableUsers(filteredUsers);
  }, [currentUser]);

  const loadUsers = useCallback(async () => {
    try {
      const cached = getUserListCache();
      if (cached) {
        const cachedUsers = cached.users as UserListItem[];
        setUsers(cachedUsers);
        processUsers(cachedUsers);
        return;
      }

      const response = await apiClient.request<UserListItem[]>("/users/list");
      setUserListCache(response);
      setUsers(response);
      processUsers(response);
    } catch (error) {
      console.error("Fehler beim Laden der User:", error);
    }
  }, [processUsers]);

  // Toggle action completion
  const toggleComplete = useCallback(
    async (action: Action) => {
      try {
        const newStatus =
          action.status === "COMPLETED" ? "OPEN" : "COMPLETED";

        await apiClient.request(`/actions/${action.id}`, {
          method: "PUT",
          body: JSON.stringify({
            status: newStatus,
            completedAt:
              newStatus === "COMPLETED" ? new Date().toISOString() : null,
          }),
        });

        if (newStatus === "COMPLETED") {
          try {
            await apiClient.post("/notifications", {
              title: "Action abgeschlossen",
              message: `Action "${action.title}" für ${action.plant} wurde abgeschlossen.`,
              type: "ACTION_COMPLETED",
              targetRoles: ["ADMIN", "MANAGER"],
              relatedId: action.id,
            });
          } catch (notifError) {
            console.error("Notification error:", notifError);
          }
        }

        toast({
          variant: "success" as const,
          title:
            newStatus === "COMPLETED"
              ? "Action abgeschlossen"
              : "Action reaktiviert",
          description: `${action.title} wurde als ${
            newStatus === "COMPLETED" ? "abgeschlossen" : "offen"
          } markiert.`,
        });

        await loadActions();
      } catch (error) {
        console.error("Fehler beim Ändern des Status:", error);
        toast({
          title: "Fehler",
          description: "Status konnte nicht geändert werden.",
          variant: "destructive",
        });
      }
    },
    [loadActions, toast],
  );

  // Delete action
  const deleteAction = useCallback(
    async (actionId: string) => {
      try {
        const action = actions.find((a) => a.id === actionId);
        await apiClient.request(`/actions/${actionId}`, { method: "DELETE" });
        toast({
          variant: "success" as const,
          title: "Action gelöscht",
          description: `${action?.title} wurde erfolgreich gelöscht.`,
        });
        await loadActions();
      } catch (error) {
        console.error("Fehler beim Löschen:", error);
        toast({
          title: "Fehler",
          description: "Action konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    },
    [actions, loadActions, toast],
  );

  return {
    actions,
    setActions,
    users,
    availableUsers,
    isLoading,
    isMounted,
    loadedRigs,
    currentUser,
    loadActions,
    loadUsers,
    toggleComplete,
    deleteAction,
  };
}
