import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { authService } from "@/services/auth.service";
import { isMobileDevice } from "@/lib/device-detection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Paperclip,
  X,
  Camera,
  CheckCircle2,
  ListTodo,
  User as UserIcon,
  Filter,
  Calendar,
  MessageSquare,
  Circle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ActionFile {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  isPhoto: boolean;
}

interface MaterialItem {
  id: string;
  mmNumber: string;
  description: string;
  quantity: number;
  unit: string;
  status?: "NICHT_BESTELLT" | "BESTELLT" | "UNTERWEGS" | "GELIEFERT";
}

interface ActionTask {
  id: string;
  title: string;
  description?: string;
  assignedUser?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

interface Action {
  id: string;
  plant: "T208" | "T207" | "T700" | "T46";
  category?: "ALLGEMEIN" | "RIGMOVE";
  discipline?: "MECHANIK" | "ELEKTRIK" | "ANLAGE";
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo: string;
  assignedUsers?: string[]; // Multi-User Zuweisung
  dueDate: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  files: ActionFile[];
  materials?: MaterialItem[];
  comments?: Comment[];
  tasks: ActionTask[];
}

interface ApiActionFile {
  id: string;
  filename: string;
  originalName?: string;
  fileType?: string;
  filePath?: string; // Cloudinary URL
  uploadedAt: string;
  isPhoto?: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  plant: string;
}

interface ApiAction {
  id: string;
  plant: string;
  category?: string;
  discipline?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  assignedUsers?: string[];
  dueDate?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt?: string;
  actionFiles?: ApiActionFile[];
}

interface ActionTrackerProps {
  initialActionId?: string;
  showOnlyMyActions?: boolean;
}

// Global cache for user list (outside component to persist across mounts)
interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  assignedPlant?: string;
}

const userListCache: {
  data: UserListItem[] | null;
  timestamp: number;
  maxAge: number;
} = {
  data: null,
  timestamp: 0,
  maxAge: 5 * 60 * 1000, // 5 minutes
};

const ActionTracker = ({
  initialActionId,
  showOnlyMyActions = false,
}: ActionTrackerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("T208");
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    Record<string, string>
  >({ T208: "alle", T207: "alle", T700: "alle", T46: "alle" });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<string | null>(null);
  const [photoViewDialogOpen, setPhotoViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  // Material Management State
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Task Management State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTaskActionId, setCurrentTaskActionId] = useState<string | null>(
    null
  );
  const [currentTask, setCurrentTask] = useState<Partial<ActionTask>>({
    title: "",
    description: "",
    assignedUser: "",
    dueDate: "",
    completed: false,
  });

  const [users, setUsers] = useState<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      assignedPlant?: string;
    }>
  >([]);

  const [currentAction, setCurrentAction] = useState<Partial<Action>>({
    plant: "T208",
    category: "ALLGEMEIN",
    title: "",
    description: "",
    status: "OPEN",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
    files: [],
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [actions, setActions] = useState<Action[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  // Helper function to format date without timezone issues
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Extrahiere Foto-Dateinamen oder URL aus Beschreibung (von Failure Reports)
  const extractPhotoFromDescription = (description: string): string | null => {
    const match = description.match(/📸 Photo: (.+?)(?:\n|$)/i);
    return match ? match[1].trim() : null;
  };

  // Parse materials from description
  const parseMaterialsFromDescription = (
    description: string
  ): MaterialItem[] => {
    const materialsSection = description.split("--- Materialien ---")[1];
    if (!materialsSection) return [];

    const lines = materialsSection.trim().split("\n");
    return lines
      .filter((line) => line.startsWith("📦"))
      .map((line, index) => {
        // Format: 📦 MM-Nr | Beschreibung | Menge Einheit | Status
        const parts = line
          .substring(2)
          .split("|")
          .map((p) => p.trim());
        const [mmNumber, description, quantityUnit, status] = parts;

        // Parse quantity and unit
        const qtyMatch = quantityUnit?.match(/^(\d+)\s*(.+)$/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        const unit = qtyMatch ? qtyMatch[2] : "Stk";

        return {
          id: `${Date.now()}-${index}`,
          mmNumber: mmNumber || "",
          description: description || "",
          quantity,
          unit,
          status: (status as MaterialItem["status"]) || "NICHT_BESTELLT",
        };
      });
  };

  // Check if action is overdue
  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === "COMPLETED") return false;
    return new Date(dueDate) < new Date();
  };

  // Backend laden
  useEffect(() => {
    setIsMounted(true);
    loadActions();
    loadUsers();

    // Set user filter to current user if showOnlyMyActions is true
    if (showOnlyMyActions) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userName = `${currentUser.firstName} ${currentUser.lastName}`;
        setUserFilter(userName);
      }
    }

    return () => {
      setIsMounted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyMyActions]);

  // Expand row if initialActionId is provided
  useEffect(() => {
    if (initialActionId && actions.length > 0) {
      const actionExists = actions.find((a) => a.id === initialActionId);
      if (actionExists) {
        // Switch to the correct tab (Plant)
        setActiveTab(actionExists.plant);

        setExpandedRows(new Set([initialActionId]));

        // Scroll to the action after a short delay
        setTimeout(() => {
          const element = document.getElementById(`action-${initialActionId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [initialActionId, actions]);

  const loadUsers = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (
        userListCache.data &&
        now - userListCache.timestamp < userListCache.maxAge
      ) {
        console.log("Using cached user list");
        setUsers(userListCache.data);

        // Process cached data
        const currentUser = authService.getCurrentUser();
        const allUsers = userListCache.data.map((user) => ({
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
            ? allUsers.filter((u) => u.plant === currentUser.assignedPlant)
            : allUsers;

        setAvailableUsers(filteredUsers);
        return;
      }

      // Fetch from API
      const response = await apiClient.request<
        Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          role?: string;
          assignedPlant?: string;
        }>
      >("/users/list");

      // Update cache
      userListCache.data = response;
      userListCache.timestamp = Date.now();

      setUsers(response);

      // Alle User laden für Multi-User Assignment
      const currentUser = authService.getCurrentUser();
      const allUsers = response.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || "",
        role: user.role || "USER",
        plant: user.assignedPlant || "",
      }));

      // Filter users by current user's plant (unless admin/manager)
      const filteredUsers =
        currentUser?.assignedPlant &&
        currentUser.role !== "ADMIN" &&
        currentUser.role !== "MANAGER"
          ? allUsers.filter(
              (user) =>
                !user.plant || // Users without plant assignment (admins/managers)
                user.plant === currentUser.assignedPlant // Same plant users
            )
          : allUsers; // Show all users for admins/managers

      console.log("Loaded users:", filteredUsers); // Debug log
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Fehler beim Laden der User:", error);
    }
  };

  const loadActions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.request<ApiAction[]>("/actions");

      const loadedActions: Action[] = response.map((item: ApiAction) => ({
        id: item.id,
        plant: item.plant as Action["plant"],
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
          : formatDateForInput(new Date()),
        files: (item.actionFiles || []).map((file: ApiActionFile) => ({
          id: file.id,
          name: file.originalName || file.filename,
          type: file.fileType || "application/octet-stream",
          url:
            file.filePath ||
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5137"
            }/api/actions/files/${file.filename}`, // Use Cloudinary URL or fallback
          uploadedAt: file.uploadedAt,
          isPhoto: file.isPhoto || false,
        })),
        comments: [], // Kommentare werden später geladen
        tasks: [], // Tasks werden erstmal leer initialisiert
      }));

      setActions(loadedActions);
      if (isMounted) {
        toast({
          title: "Actions geladen",
          description: `${loadedActions.length} Actions erfolgreich geladen.`,
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden der Actions:", error);
      // Nur Toast anzeigen wenn Component mounted ist und kein Token-Refresh-Fehler
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
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const openNewDialog = () => {
    setIsEditMode(false);
    setPendingFiles([]);
    setMaterials([]); // Reset materials for new action
    setCurrentAction({
      plant: activeTab as Action["plant"],
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      assignedTo: "",
      dueDate: "",
      files: [],
    });
    setSelectedAssignees([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (action: Action) => {
    setIsEditMode(true);
    setPendingFiles([]);

    // Parse materials from description using the new format
    const parsedMaterials = parseMaterialsFromDescription(action.description);

    // Remove material section from description for editing
    const descriptionWithoutMaterials = action.description
      .split("--- Materialien ---")[0]
      .trim();

    setMaterials(parsedMaterials);
    setCurrentAction({
      ...action,
      description: descriptionWithoutMaterials,
    });
    setSelectedAssignees(action.assignedUsers || []);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation - relaxed for mobile (only title required)
    if (!currentAction.title) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein.",
        variant: "destructive",
      });
      return;
    }

    // Desktop: require assignedTo and dueDate
    if (
      !isMobileDevice() &&
      (!currentAction.assignedTo || !currentAction.dueDate)
    ) {
      toast({
        title: "Fehler",
        description:
          "Bitte füllen Sie alle Pflichtfelder aus (Zugewiesen an, Fälligkeitsdatum).",
        variant: "destructive",
      });
      return;
    }

    try {
      let actionId: string;

      // Append materials to description if any
      let descriptionWithMaterials = currentAction.description;
      if (materials.length > 0) {
        const materialsText = materials
          .map(
            (m) =>
              `📦 ${m.mmNumber} | ${m.description} | ${m.quantity} ${
                m.unit
              } | ${m.status || "NICHT_BESTELLT"}`
          )
          .join("\n");
        descriptionWithMaterials = currentAction.description
          ? `${currentAction.description}\n\n--- Materialien ---\n${materialsText}`
          : `--- Materialien ---\n${materialsText}`;
      }

      if (isEditMode && currentAction.id) {
        // Update
        await apiClient.request(`/actions/${currentAction.id}`, {
          method: "PUT",
          body: JSON.stringify({
            plant: currentAction.plant,
            category: currentAction.category,
            discipline: currentAction.discipline,
            title: currentAction.title,
            description: descriptionWithMaterials,
            status: currentAction.status,
            priority: currentAction.priority,
            assignedTo: currentAction.assignedTo,
            assignedUsers: selectedAssignees,
            dueDate: currentAction.dueDate,
          }),
        });

        actionId = currentAction.id;

        if (isMounted) {
          toast({
            title: "Action aktualisiert",
            description: `${currentAction.title} wurde erfolgreich aktualisiert.`,
          });
        }
      } else {
        // Create
        const response = await apiClient.request<{ id: string }>("/actions", {
          method: "POST",
          body: JSON.stringify({
            plant: currentAction.plant,
            category: currentAction.category,
            discipline: currentAction.discipline,
            title: currentAction.title,
            description: descriptionWithMaterials,
            status: currentAction.status,
            priority: currentAction.priority,
            assignedTo: currentAction.assignedTo,
            assignedUsers: selectedAssignees,
            dueDate: currentAction.dueDate,
          }),
        });

        actionId = response.id;

        if (isMounted) {
          toast({
            title: "Action erstellt",
            description: `${currentAction.title} wurde erfolgreich erstellt.`,
          });
        }
      }

      // Upload files if any
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((file) => {
          formData.append("files", file);
        });

        await apiClient.post(`/actions/${actionId}/files`, formData);

        if (isMounted) {
          toast({
            title: "Dateien hochgeladen",
            description: `${pendingFiles.length} Datei(en) erfolgreich hochgeladen.`,
          });
        }

        setPendingFiles([]);
      }

      await loadActions();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      if (isMounted) {
        toast({
          title: "Fehler",
          description: "Action konnte nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = (id: string) => {
    setActionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Old handleComplete with dialog - commented out as we now use direct toggle
  // const handleComplete = (id: string) => {
  //   setActionToComplete(id);
  //   setCompleteDialogOpen(true);
  // };

  const handleToggleComplete = async (action: Action) => {
    try {
      const newStatus = action.status === "COMPLETED" ? "OPEN" : "COMPLETED";

      await apiClient.request(`/actions/${action.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          completedAt:
            newStatus === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });

      // Send notification only when completing
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
  };

  const confirmComplete = async () => {
    if (actionToComplete) {
      try {
        const action = actions.find((a) => a.id === actionToComplete);

        await apiClient.request(`/actions/${actionToComplete}`, {
          method: "PUT",
          body: JSON.stringify({
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
          }),
        });

        // Send notification to managers
        try {
          await apiClient.post("/notifications", {
            title: "Action abgeschlossen",
            message: `Action "${action?.title}" für ${action?.plant} wurde abgeschlossen.`,
            type: "ACTION_COMPLETED",
            targetRoles: ["ADMIN", "MANAGER"],
            relatedId: actionToComplete,
          });
        } catch (notifError) {
          console.error("Notification error:", notifError);
          // Continue even if notification fails
        }

        toast({
          title: "Action abgeschlossen",
          description: `${action?.title} wurde als abgeschlossen markiert.`,
        });

        await loadActions();
        setCompleteDialogOpen(false);
        setActionToComplete(null);
      } catch (error) {
        console.error("Fehler beim Abschließen:", error);
        toast({
          title: "Fehler",
          description: "Action konnte nicht abgeschlossen werden.",
          variant: "destructive",
        });
      }
    }
  };

  const confirmDelete = async () => {
    if (actionToDelete) {
      try {
        const action = actions.find((a) => a.id === actionToDelete);

        await apiClient.request(`/actions/${actionToDelete}`, {
          method: "DELETE",
        });

        toast({
          title: "Action gelöscht",
          description: `${action?.title} wurde erfolgreich gelöscht.`,
        });

        await loadActions();
        setDeleteDialogOpen(false);
        setActionToDelete(null);
      } catch (error) {
        console.error("Fehler beim Löschen:", error);
        toast({
          title: "Fehler",
          description: "Action konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    }
  };

  // Task Management Functions
  const handleOpenTaskDialog = (actionId: string) => {
    setCurrentTaskActionId(actionId);
    setCurrentTask({
      title: "",
      description: "",
      assignedUser: "",
      dueDate: "",
      completed: false,
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!currentTaskActionId || !currentTask.title) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie mindestens einen Titel ein.",
        variant: "destructive",
      });
      return;
    }

    // Prüfen ob es eine bestehende Aufgabe ist (hat ID) oder eine neue
    const isEditMode = !!currentTask.id;

    if (isEditMode) {
      // Aufgabe aktualisieren
      setActions((prevActions) =>
        prevActions.map((action) =>
          action.id === currentTaskActionId
            ? {
                ...action,
                tasks: action.tasks.map((task) =>
                  task.id === currentTask.id
                    ? {
                        ...task,
                        title: currentTask.title || task.title,
                        description: currentTask.description || "",
                        assignedUser: currentTask.assignedUser || "",
                        dueDate: currentTask.dueDate || "",
                      }
                    : task
                ),
              }
            : action
        )
      );

      toast({
        title: "Aufgabe aktualisiert",
        description: "Die Aufgabe wurde erfolgreich geändert.",
      });
    } else {
      // Neue Aufgabe erstellen
      const newTask: ActionTask = {
        id: Date.now().toString(),
        title: currentTask.title,
        description: currentTask.description || "",
        assignedUser: currentTask.assignedUser || "",
        dueDate: currentTask.dueDate || "",
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setActions((prevActions) =>
        prevActions.map((action) =>
          action.id === currentTaskActionId
            ? { ...action, tasks: [...action.tasks, newTask] }
            : action
        )
      );

      toast({
        title: "Aufgabe erstellt",
        description: "Die Aufgabe wurde erfolgreich hinzugefügt.",
      });
    }

    setTaskDialogOpen(false);
    setCurrentTask({
      title: "",
      description: "",
      assignedUser: "",
      dueDate: "",
      completed: false,
    });
  };

  const handleToggleTask = (actionId: string, taskId: string) => {
    setActions((prevActions) =>
      prevActions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              tasks: action.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : action
      )
    );
  };

  const handleDeleteTask = (actionId: string, taskId: string) => {
    setActions((prevActions) =>
      prevActions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              tasks: action.tasks.filter((task) => task.id !== taskId),
            }
          : action
      )
    );

    toast({
      title: "Aufgabe gelöscht",
      description: "Die Aufgabe wurde erfolgreich entfernt.",
    });
  };

  // Status change removed - now only via edit dialog or complete button
  // const handleStatusChange = async (
  //   id: string,
  //   newStatus: Action["status"]
  // ) => {
  //   try {
  //     await apiClient.request(`/actions/${id}`, {
  //       method: "PUT",
  //       body: JSON.stringify({
  //         status: newStatus,
  //       }),
  //     });
  //     toast({
  //       title: "Status aktualisiert",
  //       description: `Status wurde auf ${newStatus} gesetzt.`,
  //     });
  //     await loadActions();
  //   } catch (error) {
  //     console.error("Fehler beim Status-Update:", error);
  //     toast({
  //       title: "Fehler",
  //       description: "Status konnte nicht aktualisiert werden.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Speichere die echten File-Objekte für den Upload
    const fileArray = Array.from(files);
    setPendingFiles([...pendingFiles, ...fileArray]);

    // Erstelle Preview-Objekte für die UI
    const newFiles: ActionFile[] = fileArray.map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      isPhoto: file.type.startsWith("image/"),
    }));

    setCurrentAction({
      ...currentAction,
      files: [...(currentAction.files || []), ...newFiles],
    });

    if (isMounted) {
      toast({
        title: "Dateien hinzugefügt",
        description: `${newFiles.length} Datei(en) wurden hinzugefügt.`,
      });
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      // If editing an existing action, delete from backend
      if (isEditMode && currentAction.id) {
        await apiClient.delete(`/actions/${currentAction.id}/files/${fileId}`);

        toast({
          title: "Datei gelöscht",
          description: "Die Datei wurde erfolgreich entfernt.",
        });
      }

      // Update local state
      setCurrentAction({
        ...currentAction,
        files: currentAction.files?.filter((f) => f.id !== fileId) || [],
      });
    } catch (error) {
      console.error("Fehler beim Löschen der Datei:", error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get filtered actions based on plant and category
  const getFilteredActionsForCategory = (
    plant: string,
    category: string
  ): Action[] => {
    let filtered = actions.filter((a) => a.plant === plant);

    if (category === "allgemein") {
      // Allgemein: Actions without category or explicitly ALLGEMEIN
      filtered = filtered.filter(
        (a) => !a.category || a.category === "ALLGEMEIN"
      );
    } else if (category === "rigmoves") {
      // Rigmoves: Only RIGMOVE category
      filtered = filtered.filter((a) => a.category === "RIGMOVE");
    }
    // "alle" shows all actions for the plant

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.assignedTo?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Apply discipline filter
    if (disciplineFilter !== "all") {
      filtered = filtered.filter((a) => a.discipline === disciplineFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((a) => a.priority === priorityFilter);
    }

    // Apply user filter
    if (userFilter !== "all") {
      filtered = filtered.filter((a) => {
        const user = users.find(
          (u) => `${u.firstName} ${u.lastName}` === userFilter
        );
        return user ? a.assignedTo === user.email : false;
      });
    }

    // Sort by due date and status
    return filtered.sort((a, b) => {
      // COMPLETED actions always at the bottom
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;

      // For non-completed actions, sort by due date
      if (a.status !== "COMPLETED" && b.status !== "COMPLETED") {
        // Actions without due date go to the end
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && !b.dueDate) return 0;

        // Sort by due date (earliest first)
        const dateA = new Date(a.dueDate!).getTime();
        const dateB = new Date(b.dueDate!).getTime();
        return dateA - dateB;
      }

      return 0;
    });
  };

  const getActionStats = (plant: string) => {
    const plantActions = actions.filter((a) => a.plant === plant);
    return {
      total: plantActions.length,
      open: plantActions.filter((a) => a.status === "OPEN").length,
      inProgress: plantActions.filter((a) => a.status === "IN_PROGRESS").length,
      completed: plantActions.filter((a) => a.status === "COMPLETED").length,
    };
  };

  const getCategoryStats = (plant: string, category: string) => {
    return getFilteredActionsForCategory(plant, category).length;
  };

  const isMobile = isMobileDevice();

  // Mobile View: Compact list with cards
  if (isMobile) {
    const mobileFilteredActions = getFilteredActionsForCategory(
      activeTab,
      activeCategoryTab[activeTab] || "alle"
    );

    return (
      <div className="p-3 space-y-3 pb-20">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Action Points
            </CardTitle>
            <CardDescription className="text-blue-50">
              {mobileFilteredActions.length} Actions in {activeTab}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={openNewDialog}
              className="w-full h-14 text-base bg-white text-blue-600 hover:bg-blue-50"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neue Action erstellen
            </Button>
          </CardContent>
        </Card>

        {/* Plant Selector */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anlage</Label>
              <Select
                value={activeTab}
                onValueChange={(value: "T208" | "T207" | "T700" | "T46") =>
                  setActiveTab(value)
                }
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["T208", "T207", "T700", "T46"].map((plant) => {
                    const stats = getActionStats(plant);
                    const openCount = stats.open + stats.inProgress;
                    return (
                      <SelectItem key={plant} value={plant}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{plant}</span>
                          {openCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {openCount} offen
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        {mobileFilteredActions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Keine Actions für {activeTab}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {mobileFilteredActions.map((action: Action) => {
              const isExpanded = expandedRows.has(action.id);
              const overdueClass = isOverdue(action.dueDate, action.status)
                ? "border-red-500 border-l-4"
                : "";

              return (
                <Card
                  key={action.id}
                  className={`${overdueClass} ${
                    action.status === "COMPLETED" ? "opacity-60" : ""
                  }`}
                >
                  <CardHeader
                    className="pb-3 cursor-pointer"
                    onClick={() => toggleRow(action.id)}
                  >
                    {/* Title & Status Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className={`text-base leading-tight ${
                            action.status === "COMPLETED"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {action.title}
                        </CardTitle>
                        {action.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {action.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs font-semibold shrink-0 ${
                          action.status === "COMPLETED"
                            ? "bg-green-500"
                            : action.status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {action.status === "OPEN" && "Geplant"}
                        {action.status === "IN_PROGRESS" && "Aktiv"}
                        {action.status === "COMPLETED" && "✓"}
                      </Badge>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Priority Badge */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          action.priority === "URGENT"
                            ? "bg-red-500/10 text-red-700 border-red-500/20"
                            : action.priority === "HIGH"
                            ? "bg-orange-500/10 text-orange-700 border-orange-500/20"
                            : action.priority === "MEDIUM"
                            ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                        }`}
                      >
                        {action.priority === "URGENT" && "🔥 Dringend"}
                        {action.priority === "HIGH" && "⚠️ Hoch"}
                        {action.priority === "MEDIUM" && "📋 Mittel"}
                        {action.priority === "LOW" && "📌 Niedrig"}
                      </Badge>

                      {/* Discipline Badge */}
                      {action.discipline && (
                        <Badge
                          className={`text-xs ${
                            action.discipline === "MECHANIK"
                              ? "bg-cyan-500"
                              : action.discipline === "ELEKTRIK"
                              ? "bg-purple-500"
                              : "bg-pink-500"
                          }`}
                        >
                          {action.discipline === "MECHANIK" && "🔧"}
                          {action.discipline === "ELEKTRIK" && "⚡"}
                          {action.discipline === "ANLAGE" && "🏭"}
                        </Badge>
                      )}

                      {/* Tasks & Files */}
                      {action.tasks.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <ListTodo className="h-3 w-3 mr-1" />
                          {
                            action.tasks.filter((t: ActionTask) => t.completed)
                              .length
                          }
                          /{action.tasks.length}
                        </Badge>
                      )}
                      {action.files.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {action.files.length}
                        </Badge>
                      )}
                    </div>

                    {/* Assignee & Due Date */}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{action.assignedTo || "Nicht zugewiesen"}</span>
                      </div>
                      {action.dueDate && (
                        <div
                          className={`flex items-center gap-1 ${
                            isOverdue(action.dueDate, action.status)
                              ? "text-red-600 font-semibold"
                              : ""
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(action.dueDate).toLocaleDateString(
                              "de-DE",
                              { day: "2-digit", month: "2-digit" }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <CardContent className="pt-0 space-y-3 border-t">
                      {/* Description */}
                      {action.description && (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            Beschreibung
                          </Label>
                          <p className="text-sm">{action.description}</p>
                        </div>
                      )}

                      {/* Tasks */}
                      {action.tasks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            Aufgaben (
                            {
                              action.tasks.filter(
                                (t: ActionTask) => t.completed
                              ).length
                            }
                            /{action.tasks.length})
                          </Label>
                          <div className="space-y-1">
                            {action.tasks.map((task: ActionTask) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span
                                  className={
                                    task.completed
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {action.files.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            Dateien ({action.files.length})
                          </Label>
                          <div className="space-y-1">
                            {action.files.map((file: ActionFile) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-2 text-sm bg-muted p-2 rounded"
                              >
                                <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate flex-1">
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments Count */}
                      {action.comments && action.comments.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>{action.comments.length} Kommentare</span>
                        </div>
                      )}

                      {/* Info Footer */}
                      <div className="pt-2 text-xs text-muted-foreground border-t">
                        <div className="flex justify-between">
                          <span>
                            Erstellt:{" "}
                            {new Date(action.createdAt).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                          {action.category && (
                            <Badge variant="outline" className="text-xs">
                              {action.category === "ALLGEMEIN"
                                ? "Allgemein"
                                : "Rigmove"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                        💡 Bearbeitung nur am Desktop/Tablet möglich
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog - same as desktop */}
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-full h-full m-0 max-h-full overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Action bearbeiten" : "Neue Action erstellen"}
                </DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Aufgabe für das Team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Plant Selection */}
                <div className="space-y-2">
                  <Label htmlFor="plant">Anlage *</Label>
                  <Select
                    value={currentAction.plant}
                    onValueChange={(value: "T208" | "T207" | "T700" | "T46") =>
                      setCurrentAction({ ...currentAction, plant: value })
                    }
                  >
                    <SelectTrigger id="plant" className="h-12 text-base">
                      <SelectValue placeholder="Anlage wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T208">T208</SelectItem>
                      <SelectItem value="T207">T207</SelectItem>
                      <SelectItem value="T700">T700</SelectItem>
                      <SelectItem value="T46">T46</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={currentAction.title}
                    onChange={(e) =>
                      setCurrentAction({
                        ...currentAction,
                        title: e.target.value,
                      })
                    }
                    placeholder="Kurze Beschreibung"
                    className="h-12 text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={currentAction.description}
                    onChange={(e) =>
                      setCurrentAction({
                        ...currentAction,
                        description: e.target.value,
                      })
                    }
                    placeholder="Detaillierte Beschreibung..."
                    rows={4}
                    className="text-base"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität *</Label>
                  <Select
                    value={currentAction.priority}
                    onValueChange={(
                      value: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                    ) =>
                      setCurrentAction({ ...currentAction, priority: value })
                    }
                  >
                    <SelectTrigger id="priority" className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Niedrig</SelectItem>
                      <SelectItem value="MEDIUM">Mittel</SelectItem>
                      <SelectItem value="HIGH">Hoch</SelectItem>
                      <SelectItem value="CRITICAL">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12"
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSave} className="h-12">
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Desktop View: Full functionality
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Action Tracker
              </CardTitle>
              <CardDescription>
                Aufgabenverfolgung für alle Anlagen
              </CardDescription>
            </div>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Action
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Lade Actions...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filter Card */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-semibold text-sm">Filter</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                    <div className="space-y-2">
                      <Label>Suche</Label>
                      <Input
                        placeholder="Action suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status filtern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Status</SelectItem>
                          <SelectItem value="OPEN">Geplant</SelectItem>
                          <SelectItem value="IN_PROGRESS">Aktiv</SelectItem>
                          <SelectItem value="COMPLETED">
                            Abgeschlossen
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kategorie</Label>
                      <Select
                        value={disciplineFilter}
                        onValueChange={setDisciplineFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie filtern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Kategorien</SelectItem>
                          <SelectItem value="MECHANIK">Mechanik</SelectItem>
                          <SelectItem value="ELEKTRIK">Elektrisch</SelectItem>
                          <SelectItem value="ANLAGE">Anlage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priorität</Label>
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priorität filtern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Prioritäten</SelectItem>
                          <SelectItem value="LOW">Niedrig</SelectItem>
                          <SelectItem value="MEDIUM">Mittel</SelectItem>
                          <SelectItem value="HIGH">Hoch</SelectItem>
                          <SelectItem value="URGENT">Dringend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="User filtern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle User</SelectItem>
                          {users.map((user) => {
                            const fullName = `${user.firstName} ${user.lastName}`;
                            return (
                              <SelectItem key={user.id} value={fullName}>
                                {fullName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-4 h-20 bg-muted/30 p-2 gap-2">
                  {["T208", "T207", "T700", "T46"].map((plant) => {
                    const stats = getActionStats(plant);
                    const openCount = stats.open + stats.inProgress;
                    return (
                      <TabsTrigger
                        key={plant}
                        value={plant}
                        className="relative flex-col h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm hover:shadow-md py-2 px-3"
                      >
                        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                          <span className="text-base font-bold leading-tight">
                            {plant}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {openCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] opacity-70 leading-tight">
                                  Offen:
                                </span>
                                <Badge
                                  variant="destructive"
                                  className="px-1.5 py-0 text-[10px] font-bold leading-tight h-4"
                                >
                                  {openCount}
                                </Badge>
                              </div>
                            )}
                            {openCount === 0 && stats.total > 0 && (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 leading-tight h-4"
                              >
                                ✓ Alle erledigt
                              </Badge>
                            )}
                            {stats.total === 0 && (
                              <span className="text-[10px] opacity-60 leading-tight">
                                Keine Actions
                              </span>
                            )}
                          </div>
                        </div>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {["T208", "T207", "T700", "T46"].map((plant) => (
                  <TabsContent key={plant} value={plant}>
                    {/* Nested Category Tabs */}
                    <Tabs
                      value={activeCategoryTab[plant] || "alle"}
                      onValueChange={(value) =>
                        setActiveCategoryTab({
                          ...activeCategoryTab,
                          [plant]: value,
                        })
                      }
                      className="space-y-4"
                    >
                      <TabsList className="grid w-full grid-cols-3 h-16 bg-muted/30 p-2 gap-2">
                        <TabsTrigger
                          value="allgemein"
                          className="flex-col h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm hover:shadow-md py-2 px-3"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
                            <span className="text-sm font-semibold leading-tight">
                              Allgemein
                            </span>
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] data-[state=active]:bg-primary-foreground/20 leading-tight h-4"
                            >
                              {getCategoryStats(plant, "allgemein")} Actions
                            </Badge>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="rigmoves"
                          className="flex-col h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm hover:shadow-md py-2 px-3"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
                            <span className="text-sm font-semibold leading-tight">
                              Rigmoves
                            </span>
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] data-[state=active]:bg-primary-foreground/20 leading-tight h-4"
                            >
                              {getCategoryStats(plant, "rigmoves")} Actions
                            </Badge>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="alle"
                          className="flex-col h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm hover:shadow-md py-2 px-3"
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
                            <span className="text-sm font-semibold leading-tight">
                              Alle
                            </span>
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] data-[state=active]:bg-primary-foreground/20 leading-tight h-4"
                            >
                              {getCategoryStats(plant, "alle")} Actions
                            </Badge>
                          </div>
                        </TabsTrigger>
                      </TabsList>

                      {["allgemein", "rigmoves", "alle"].map((category) => {
                        const categoryActions = getFilteredActionsForCategory(
                          plant,
                          category
                        );
                        return (
                          <TabsContent key={category} value={category}>
                            {categoryActions.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">
                                  Keine Actions
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Erstellen Sie die erste Action für {plant}
                                </p>
                                <Button onClick={openNewDialog}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Action erstellen
                                </Button>
                              </div>
                            ) : (
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[40px] py-3 text-base"></TableHead>
                                      <TableHead className="w-[40px] py-3 text-base">
                                        Nr.
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Titel
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Kategorie
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Status
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Priorität
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Zugewiesen an
                                      </TableHead>
                                      <TableHead className="py-3 text-base">
                                        Fälligkeitsdatum
                                      </TableHead>
                                      <TableHead className="text-center py-3 text-base">
                                        Aufgaben
                                      </TableHead>
                                      <TableHead className="text-center py-3 text-base">
                                        Dateien
                                      </TableHead>
                                      <TableHead className="text-right py-3 text-base">
                                        Aktionen
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {categoryActions.map((action, index) => (
                                      <React.Fragment key={action.id}>
                                        <TableRow
                                          id={`action-${action.id}`}
                                          className={`hover:bg-muted/50 transition-colors ${
                                            isOverdue(
                                              action.dueDate,
                                              action.status
                                            )
                                              ? "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500"
                                              : ""
                                          }`}
                                        >
                                          <TableCell className="py-3">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              {expandedRows.has(action.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <span className="font-medium text-muted-foreground text-base">
                                              {index + 1}
                                            </span>
                                          </TableCell>
                                          <TableCell
                                            className="py-3"
                                            onClick={() => toggleRow(action.id)}
                                          >
                                            <div className="space-y-1">
                                              <div
                                                className={`font-medium text-base ${
                                                  action.status === "COMPLETED"
                                                    ? "line-through text-muted-foreground"
                                                    : ""
                                                }`}
                                              >
                                                {action.title}
                                              </div>
                                              {action.description && (
                                                <div className="text-sm text-muted-foreground line-clamp-1">
                                                  {action.description}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <Badge
                                              className={`text-sm font-semibold ${
                                                action.discipline === "MECHANIK"
                                                  ? "bg-cyan-500 text-white hover:bg-cyan-600"
                                                  : action.discipline ===
                                                    "ELEKTRIK"
                                                  ? "bg-purple-500 text-white hover:bg-purple-600"
                                                  : action.discipline ===
                                                    "ANLAGE"
                                                  ? "bg-pink-500 text-white hover:bg-pink-600"
                                                  : "bg-gray-500 text-white hover:bg-gray-600"
                                              }`}
                                            >
                                              {action.discipline ===
                                                "MECHANIK" && "Mechanik"}
                                              {action.discipline ===
                                                "ELEKTRIK" && "Elektrisch"}
                                              {action.discipline === "ANLAGE" &&
                                                "Anlage"}
                                              {!action.discipline && "-"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <Badge
                                              className={`text-sm font-semibold ${
                                                action.status === "COMPLETED"
                                                  ? "bg-green-500 text-white hover:bg-green-600"
                                                  : action.status ===
                                                    "IN_PROGRESS"
                                                  ? "bg-green-500 text-white hover:bg-green-600"
                                                  : "bg-yellow-500 text-black hover:bg-yellow-600"
                                              }`}
                                            >
                                              {action.status === "OPEN" &&
                                                "Geplant"}
                                              {action.status ===
                                                "IN_PROGRESS" && "Aktiv"}
                                              {action.status === "COMPLETED" &&
                                                "Abgeschlossen"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <Badge
                                              className={`text-sm ${
                                                action.priority === "URGENT"
                                                  ? "bg-red-500/10 text-red-700 border-red-500/20"
                                                  : action.priority === "HIGH"
                                                  ? "bg-orange-500/10 text-orange-700 border-orange-500/20"
                                                  : action.priority === "MEDIUM"
                                                  ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                                  : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                                              }`}
                                            >
                                              {action.priority}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-base">
                                                {action.assignedTo ||
                                                  "Nicht zugewiesen"}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <span
                                              className={`text-base font-medium ${
                                                isOverdue(
                                                  action.dueDate,
                                                  action.status
                                                )
                                                  ? "text-red-600 dark:text-red-400"
                                                  : ""
                                              }`}
                                            >
                                              {action.dueDate
                                                ? new Date(
                                                    action.dueDate
                                                  ).toLocaleDateString("de-DE")
                                                : "-"}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-8 text-sm"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              <ListTodo className="h-3.5 w-3.5 mr-1" />
                                              {
                                                action.tasks.filter(
                                                  (t) => t.completed
                                                ).length
                                              }
                                              /{action.tasks.length}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-8 text-sm"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              <Paperclip className="h-3.5 w-3.5 mr-1" />
                                              {action.files.length}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="text-right py-3">
                                            <div className="flex justify-end gap-1">
                                              <Button
                                                variant={
                                                  action.status === "COMPLETED"
                                                    ? "outline"
                                                    : "default"
                                                }
                                                size="icon"
                                                className={`h-8 w-8 ${
                                                  action.status === "COMPLETED"
                                                    ? "text-muted-foreground"
                                                    : "bg-green-600 hover:bg-green-700"
                                                }`}
                                                onClick={() =>
                                                  handleToggleComplete(action)
                                                }
                                                title={
                                                  action.status === "COMPLETED"
                                                    ? "Action reaktivieren"
                                                    : "Action abschließen"
                                                }
                                              >
                                                <CheckCircle2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  openEditDialog(action)
                                                }
                                                title="Action bearbeiten"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  handleDelete(action.id)
                                                }
                                                title="Action löschen"
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>

                                        {expandedRows.has(action.id) && (
                                          <TableRow>
                                            <TableCell
                                              colSpan={11}
                                              className="p-0 bg-muted/30"
                                            >
                                              <div className="p-6 space-y-6">
                                                {/* Beschreibung & Kommentare Grid */}
                                                <div className="grid grid-cols-2 gap-6">
                                                  {/* Beschreibung Card */}
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Beschreibung
                                                      </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                      <p className="text-sm whitespace-pre-wrap">
                                                        {/* Zeige Beschreibung ohne Foto-Zeile und ohne Material-Abschnitt */}
                                                        {action.description
                                                          .split(
                                                            "--- Materialien ---"
                                                          )[0]
                                                          .split("\n")
                                                          .filter(
                                                            (line) =>
                                                              !line.startsWith(
                                                                "📸 Photo:"
                                                              )
                                                          )
                                                          .join("\n")
                                                          .trim()}
                                                      </p>
                                                      {/* Zeige Foto-Thumbnail wenn Cloudinary URL vorhanden */}
                                                      {(() => {
                                                        const photoUrl =
                                                          extractPhotoFromDescription(
                                                            action.description
                                                          );
                                                        if (
                                                          photoUrl &&
                                                          (photoUrl.startsWith(
                                                            "http://"
                                                          ) ||
                                                            photoUrl.startsWith(
                                                              "https://"
                                                            ))
                                                        ) {
                                                          return (
                                                            <div className="pt-3 border-t">
                                                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                                                Foto
                                                              </p>
                                                              <img
                                                                src={photoUrl}
                                                                alt="Schadensbericht Foto"
                                                                className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => {
                                                                  setSelectedPhoto(
                                                                    photoUrl
                                                                  );
                                                                  setPhotoViewDialogOpen(
                                                                    true
                                                                  );
                                                                }}
                                                              />
                                                            </div>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                      {/* Zeige Foto-Button nur für alte lokale Dateien */}
                                                      {(() => {
                                                        const photoFilename =
                                                          extractPhotoFromDescription(
                                                            action.description
                                                          );
                                                        if (
                                                          photoFilename &&
                                                          !photoFilename.startsWith(
                                                            "http://"
                                                          ) &&
                                                          !photoFilename.startsWith(
                                                            "https://"
                                                          )
                                                        ) {
                                                          return (
                                                            <div className="pt-3 border-t">
                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={async () => {
                                                                  try {
                                                                    console.log(
                                                                      "📷 Loading photo via API:",
                                                                      photoFilename
                                                                    );
                                                                    const blob =
                                                                      await apiClient.request<Blob>(
                                                                        `/failure-reports/photo/${photoFilename}`,
                                                                        {
                                                                          responseType:
                                                                            "blob",
                                                                        }
                                                                      );

                                                                    const photoUrl =
                                                                      URL.createObjectURL(
                                                                        blob
                                                                      );
                                                                    setSelectedPhoto(
                                                                      photoUrl
                                                                    );
                                                                    setPhotoViewDialogOpen(
                                                                      true
                                                                    );

                                                                    setTimeout(
                                                                      () =>
                                                                        URL.revokeObjectURL(
                                                                          photoUrl
                                                                        ),
                                                                      10000
                                                                    );
                                                                  } catch (error) {
                                                                    console.error(
                                                                      "❌ Error loading photo:",
                                                                      error
                                                                    );
                                                                    toast({
                                                                      title:
                                                                        "Fehler",
                                                                      description:
                                                                        "Foto konnte nicht geladen werden.",
                                                                      variant:
                                                                        "destructive",
                                                                    });
                                                                  }
                                                                }}
                                                              >
                                                                <Camera className="h-4 w-4 mr-2" />
                                                                Foto anzeigen
                                                              </Button>
                                                            </div>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                    </CardContent>
                                                  </Card>

                                                  {/* Aufgaben Card */}
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                          <ListTodo className="h-4 w-4" />
                                                          Aufgaben (
                                                          {action.tasks.length})
                                                        </CardTitle>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          className="h-7"
                                                          onClick={() =>
                                                            handleOpenTaskDialog(
                                                              action.id
                                                            )
                                                          }
                                                        >
                                                          <Plus className="h-3 w-3 mr-1" />
                                                          Neu
                                                        </Button>
                                                      </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                      {action.tasks.length ===
                                                      0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                          Keine Aufgaben
                                                          vorhanden
                                                        </p>
                                                      ) : (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                          {action.tasks.map(
                                                            (task) => (
                                                              <div
                                                                key={task.id}
                                                                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
                                                              >
                                                                <input
                                                                  type="checkbox"
                                                                  checked={
                                                                    task.completed
                                                                  }
                                                                  onChange={() =>
                                                                    handleToggleTask(
                                                                      action.id,
                                                                      task.id
                                                                    )
                                                                  }
                                                                  className="mt-1 h-4 w-4 rounded border-gray-300"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                  <div
                                                                    className={`text-sm font-medium ${
                                                                      task.completed
                                                                        ? "line-through text-muted-foreground"
                                                                        : ""
                                                                    }`}
                                                                  >
                                                                    {task.title}
                                                                  </div>
                                                                  {task.description && (
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                      {
                                                                        task.description
                                                                      }
                                                                    </div>
                                                                  )}
                                                                  <div className="flex items-center gap-2 mt-1">
                                                                    {task.assignedUser && (
                                                                      <span className="text-xs flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {(() => {
                                                                          const user =
                                                                            availableUsers.find(
                                                                              (
                                                                                u
                                                                              ) =>
                                                                                u.id ===
                                                                                task.assignedUser
                                                                            );
                                                                          return user
                                                                            ? `${user.firstName} ${user.lastName}`
                                                                            : task.assignedUser;
                                                                        })()}
                                                                      </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                      <span className="text-xs text-muted-foreground">
                                                                        Fällig:{" "}
                                                                        {new Date(
                                                                          task.dueDate
                                                                        ).toLocaleDateString(
                                                                          "de-DE"
                                                                        )}
                                                                      </span>
                                                                    )}
                                                                  </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => {
                                                                      setCurrentTask(
                                                                        {
                                                                          ...task,
                                                                        }
                                                                      );
                                                                      setCurrentTaskActionId(
                                                                        action.id
                                                                      );
                                                                      setTaskDialogOpen(
                                                                        true
                                                                      );
                                                                    }}
                                                                    title="Bearbeiten"
                                                                  >
                                                                    <Edit className="h-3 w-3" />
                                                                  </Button>
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                      handleDeleteTask(
                                                                        action.id,
                                                                        task.id
                                                                      )
                                                                    }
                                                                    title="Löschen"
                                                                  >
                                                                    <X className="h-3 w-3" />
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            )
                                                          )}
                                                        </div>
                                                      )}
                                                    </CardContent>
                                                  </Card>
                                                </div>

                                                {/* Angehängte Dateien Card */}
                                                {action.files.length > 0 && (
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <CardTitle className="text-base flex items-center gap-2">
                                                        📎 Angehängte Dateien
                                                        <Badge
                                                          variant="secondary"
                                                          className="ml-2"
                                                        >
                                                          {action.files.length}
                                                        </Badge>
                                                      </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                                        {action.files.map(
                                                          (file) => (
                                                            <div
                                                              key={file.id}
                                                              className="relative group"
                                                            >
                                                              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                                                                {file.isPhoto ? (
                                                                  <img
                                                                    src={
                                                                      file.url
                                                                    }
                                                                    alt={
                                                                      file.name
                                                                    }
                                                                    className="w-full aspect-square object-cover"
                                                                  />
                                                                ) : (
                                                                  <div className="w-full aspect-square flex items-center justify-center bg-muted">
                                                                    <Paperclip className="h-8 w-8 text-muted-foreground" />
                                                                  </div>
                                                                )}
                                                              </Card>
                                                              <p
                                                                className="text-xs truncate mt-1 text-center"
                                                                title={
                                                                  file.name
                                                                }
                                                              >
                                                                {file.name}
                                                              </p>
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                )}

                                                {/* Material-Liste Card */}
                                                {(() => {
                                                  const materials =
                                                    parseMaterialsFromDescription(
                                                      action.description
                                                    );
                                                  if (materials.length === 0)
                                                    return null;

                                                  return (
                                                    <Card className="border">
                                                      <CardHeader className="bg-muted/50 pb-2 pt-3">
                                                        <div className="flex items-center justify-between">
                                                          <CardTitle className="text-base flex items-center gap-2">
                                                            📦 Bestellte
                                                            Materialien
                                                          </CardTitle>
                                                          <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                          >
                                                            {materials.length}{" "}
                                                            {materials.length ===
                                                            1
                                                              ? "Material"
                                                              : "Materialien"}
                                                          </Badge>
                                                        </div>
                                                      </CardHeader>
                                                      <CardContent className="pt-3">
                                                        <div className="space-y-1.5">
                                                          {materials.map(
                                                            (material) => {
                                                              // Status Badge Farbe & Text
                                                              const getStatusBadge =
                                                                (
                                                                  status?: MaterialItem["status"]
                                                                ) => {
                                                                  switch (
                                                                    status
                                                                  ) {
                                                                    case "GELIEFERT":
                                                                      return (
                                                                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                                                          🟢
                                                                          Geliefert
                                                                        </Badge>
                                                                      );
                                                                    case "UNTERWEGS":
                                                                      return (
                                                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                          🔵
                                                                          Unterwegs
                                                                        </Badge>
                                                                      );
                                                                    case "BESTELLT":
                                                                      return (
                                                                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                                                          🟡
                                                                          Bestellt
                                                                        </Badge>
                                                                      );
                                                                    default:
                                                                      return (
                                                                        <Badge
                                                                          variant="outline"
                                                                          className="border-2"
                                                                        >
                                                                          ⚪
                                                                          Nicht
                                                                          bestellt
                                                                        </Badge>
                                                                      );
                                                                  }
                                                                };

                                                              return (
                                                                <div
                                                                  key={
                                                                    material.id
                                                                  }
                                                                  className="group p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                                                >
                                                                  <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                      <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                                                                          {
                                                                            material.mmNumber
                                                                          }
                                                                        </span>
                                                                        {getStatusBadge(
                                                                          material.status
                                                                        )}
                                                                      </div>
                                                                      <p className="text-xs line-clamp-1">
                                                                        {
                                                                          material.description
                                                                        }
                                                                      </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end justify-center bg-muted/50 px-2.5 py-2 rounded min-w-[60px]">
                                                                      <p className="text-lg font-bold text-primary">
                                                                        {
                                                                          material.quantity
                                                                        }
                                                                      </p>
                                                                      <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                                        {
                                                                          material.unit
                                                                        }
                                                                      </p>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              );
                                                            }
                                                          )}
                                                        </div>
                                                      </CardContent>
                                                    </Card>
                                                  );
                                                })()}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEditMode ? "Action bearbeiten" : "Neue Action erstellen"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Ändern Sie die Action-Details"
                : "Erstellen Sie eine neue Action"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Action Details</TabsTrigger>
                <TabsTrigger value="materials">Materialbestellung</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="space-y-4 py-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="plant">Anlage *</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        type="button"
                        variant={
                          currentAction.plant === "T208" ? "default" : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({ ...currentAction, plant: "T208" })
                        }
                        className="w-full"
                      >
                        T208
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.plant === "T207" ? "default" : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({ ...currentAction, plant: "T207" })
                        }
                        className="w-full"
                      >
                        T207
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.plant === "T700" ? "default" : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({ ...currentAction, plant: "T700" })
                        }
                        className="w-full"
                      >
                        T700
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.plant === "T46" ? "default" : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({ ...currentAction, plant: "T46" })
                        }
                        className="w-full"
                      >
                        T46
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Phasen *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={
                          currentAction.category === "ALLGEMEIN"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({
                            ...currentAction,
                            category: "ALLGEMEIN",
                          })
                        }
                        className="w-full"
                      >
                        Allgemein
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.category === "RIGMOVE"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({
                            ...currentAction,
                            category: "RIGMOVE",
                          })
                        }
                        className="w-full"
                      >
                        Rigmove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discipline">Fachbereich</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={
                          currentAction.discipline === "MECHANIK"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({
                            ...currentAction,
                            discipline: "MECHANIK",
                          })
                        }
                        className="w-full"
                      >
                        Mechanik
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.discipline === "ELEKTRIK"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({
                            ...currentAction,
                            discipline: "ELEKTRIK",
                          })
                        }
                        className="w-full"
                      >
                        Elektrik
                      </Button>
                      <Button
                        type="button"
                        variant={
                          currentAction.discipline === "ANLAGE"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCurrentAction({
                            ...currentAction,
                            discipline: "ANLAGE",
                          })
                        }
                        className="w-full"
                      >
                        Anlage
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={currentAction.title}
                      onChange={(e) =>
                        setCurrentAction({
                          ...currentAction,
                          title: e.target.value,
                        })
                      }
                      placeholder="z.B. Pumpe P-101 Wartung"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={currentAction.description}
                      onChange={(e) =>
                        setCurrentAction({
                          ...currentAction,
                          description: e.target.value,
                        })
                      }
                      placeholder="Detaillierte Beschreibung der Aufgabe..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priorität</Label>
                      <Select
                        value={currentAction.priority}
                        onValueChange={(value: Action["priority"]) =>
                          setCurrentAction({
                            ...currentAction,
                            priority: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Niedrig</SelectItem>
                          <SelectItem value="MEDIUM">Mittel</SelectItem>
                          <SelectItem value="HIGH">Hoch</SelectItem>
                          <SelectItem value="URGENT">Dringend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={currentAction.status}
                        onValueChange={(value: Action["status"]) =>
                          setCurrentAction({
                            ...currentAction,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Offen</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Bearbeitung
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            Abgeschlossen
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Zugewiesen an *</Label>
                      <Select
                        value={currentAction.assignedTo}
                        onValueChange={(value) =>
                          setCurrentAction({
                            ...currentAction,
                            assignedTo: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="User auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => {
                              // Admins und Manager können immer ausgewählt werden
                              if (!user.assignedPlant) return true;
                              // User muss zur ausgewählten Anlage gehören
                              return user.assignedPlant === currentAction.plant;
                            })
                            .map((user) => (
                              <SelectItem key={user.id} value={user.email}>
                                {user.firstName} {user.lastName}
                                {user.assignedPlant &&
                                  ` (${user.assignedPlant})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Multi-User Zuweisung */}
                    <div className="space-y-2">
                      <Label htmlFor="assignedUsers">
                        <Users className="w-4 h-4 inline mr-2" />
                        Zusätzliche Zuständige
                      </Label>
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {selectedAssignees.length > 0
                                ? `${selectedAssignees.length} User ausgewählt`
                                : "User auswählen..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="User suchen..." />
                              <CommandEmpty>Keine User gefunden.</CommandEmpty>
                              <CommandGroup>
                                {availableUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                      const isSelected =
                                        selectedAssignees.includes(user.id);
                                      if (isSelected) {
                                        setSelectedAssignees(
                                          selectedAssignees.filter(
                                            (id) => id !== user.id
                                          )
                                        );
                                      } else {
                                        setSelectedAssignees([
                                          ...selectedAssignees,
                                          user.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedAssignees.includes(user.id)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {user.firstName} {user.lastName}
                                    <Badge variant="outline" className="ml-2">
                                      {user.role}
                                    </Badge>
                                    {user.plant && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-1"
                                      >
                                        {user.plant}
                                      </Badge>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* Ausgewählte User anzeigen */}
                        {selectedAssignees.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedAssignees.map((userId) => {
                              const user = availableUsers.find(
                                (u) => u.id === userId
                              );
                              return user ? (
                                <Badge
                                  key={userId}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {user.firstName} {user.lastName}
                                  <button
                                    onClick={() => {
                                      setSelectedAssignees(
                                        selectedAssignees.filter(
                                          (id) => id !== userId
                                        )
                                      );
                                    }}
                                    className="ml-1 hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
                      <DatePicker
                        date={
                          currentAction.dueDate
                            ? new Date(currentAction.dueDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setCurrentAction({
                            ...currentAction,
                            dueDate: date ? formatDateForInput(date) : "",
                          })
                        }
                        placeholder="Fälligkeitsdatum wählen"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dateien anhängen</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                        className="flex-1"
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Dateien auswählen
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("camera-upload")?.click()
                        }
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Foto aufnehmen
                      </Button>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      id="camera-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {currentAction.files && currentAction.files.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {currentAction.files.map((file) => (
                          <div
                            key={file.id}
                            className="relative group border rounded-lg p-2"
                          >
                            {file.isPhoto ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full aspect-square object-cover rounded"
                              />
                            ) : (
                              <div className="w-full aspect-square flex items-center justify-center bg-slate-100 rounded">
                                <Paperclip className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 transition shadow-lg"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs truncate mt-1">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Material Ordering Tab */}
              <TabsContent value="materials" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Materialien</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const newMaterial = {
                          id: Date.now().toString(),
                          mmNumber: "",
                          description: "",
                          quantity: 1,
                          unit: "Stk",
                          status: "NICHT_BESTELLT" as const,
                        };
                        setMaterials([...materials, newMaterial]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Material hinzufügen
                    </Button>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Noch keine Materialien hinzugefügt
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">
                              MM-Nummer
                            </TableHead>
                            <TableHead className="w-[320px]">
                              Beschreibung
                            </TableHead>
                            <TableHead className="w-28">Menge</TableHead>
                            <TableHead className="w-28">Einheit</TableHead>
                            <TableHead className="w-[200px]">Status</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material, index) => (
                            <TableRow key={material.id}>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="h-11 text-base w-full"
                                  value={material.mmNumber}
                                  onChange={(e) => {
                                    const newMaterials = [...materials];
                                    newMaterials[index].mmNumber =
                                      e.target.value;
                                    setMaterials(newMaterials);
                                  }}
                                  placeholder="MM-Nummer"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  className="h-11 text-base w-full"
                                  value={material.description}
                                  onChange={(e) => {
                                    const newMaterials = [...materials];
                                    newMaterials[index].description =
                                      e.target.value;
                                    setMaterials(newMaterials);
                                  }}
                                  placeholder="Beschreibung"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  className="h-11 text-base"
                                  value={material.quantity}
                                  onChange={(e) => {
                                    const newMaterials = [...materials];
                                    newMaterials[index].quantity =
                                      parseInt(e.target.value) || 1;
                                    setMaterials(newMaterials);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={material.unit}
                                  onValueChange={(value) => {
                                    const newMaterials = [...materials];
                                    newMaterials[index].unit = value;
                                    setMaterials(newMaterials);
                                  }}
                                >
                                  <SelectTrigger className="h-11 text-base">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Stk">Stk</SelectItem>
                                    <SelectItem value="L">L</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="m²">m²</SelectItem>
                                    <SelectItem value="m³">m³</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={material.status || "NICHT_BESTELLT"}
                                  onValueChange={(value) => {
                                    const newMaterials = [...materials];
                                    newMaterials[index].status =
                                      value as MaterialItem["status"];
                                    setMaterials(newMaterials);
                                  }}
                                >
                                  <SelectTrigger className="h-11 text-base w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value="NICHT_BESTELLT"
                                      className="text-base"
                                    >
                                      ⚪ Nicht bestellt
                                    </SelectItem>
                                    <SelectItem
                                      value="BESTELLT"
                                      className="text-base"
                                    >
                                      🟡 Bestellt
                                    </SelectItem>
                                    <SelectItem
                                      value="UNTERWEGS"
                                      className="text-base"
                                    >
                                      🔵 Unterwegs
                                    </SelectItem>
                                    <SelectItem
                                      value="GELIEFERT"
                                      className="text-base"
                                    >
                                      🟢 Geliefert
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setMaterials(
                                      materials.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              {isEditMode ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Action löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Action wird
              dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Action abschließen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Action wirklich als abgeschlossen markieren? Die
              Manager werden über den Abschluss benachrichtigt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmComplete}
              className="bg-green-600"
            >
              Abschließen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo View Dialog */}
      <Dialog open={photoViewDialogOpen} onOpenChange={setPhotoViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0">
          {/* Close Button - Top Right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={() => {
              setPhotoViewDialogOpen(false);
              setSelectedPhoto(null);
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Full Screen Photo */}
          <div className="flex items-center justify-center bg-black/90 min-h-[80vh] p-4">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Failure Report Foto"
                className="max-w-full max-h-[85vh] object-contain"
                onError={() => {
                  console.error("Fehler beim Laden des Fotos:", selectedPhoto);
                  toast({
                    title: "Fehler",
                    description: "Foto konnte nicht geladen werden.",
                    variant: "destructive",
                  });
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentTask.id ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
            </DialogTitle>
            <DialogDescription>
              {currentTask.id
                ? "Bearbeiten Sie die Unteraufgabe für diese Action."
                : "Fügen Sie eine Unteraufgabe für diese Action hinzu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titel *</Label>
              <Input
                id="task-title"
                value={currentTask.title || ""}
                onChange={(e) =>
                  setCurrentTask({ ...currentTask, title: e.target.value })
                }
                placeholder="z.B. Kabel verlegen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Beschreibung</Label>
              <Textarea
                id="task-description"
                value={currentTask.description || ""}
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    description: e.target.value,
                  })
                }
                placeholder="Detaillierte Beschreibung der Aufgabe"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assigned">Zugewiesen an</Label>
              <Select
                value={currentTask.assignedUser || ""}
                onValueChange={(value) =>
                  setCurrentTask({ ...currentTask, assignedUser: value })
                }
              >
                <SelectTrigger id="task-assigned">
                  <SelectValue placeholder="User auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const currentAction = actions.find(
                      (a) => a.id === currentTaskActionId
                    );
                    if (!currentAction) return null;

                    const filteredUsers = availableUsers.filter(
                      (user) =>
                        // Alle Admins und Manager
                        user.role === "ADMIN" ||
                        user.role === "MANAGER" ||
                        // ODER User der gleichen Anlage
                        user.plant === currentAction.plant ||
                        // ODER wenn keine plant zugewiesen, dann alle User
                        !user.plant
                    );

                    if (filteredUsers.length === 0) {
                      return (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Keine verfügbaren User
                        </div>
                      );
                    }

                    return filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          {user.plant && (
                            <Badge variant="secondary" className="text-xs">
                              {user.plant}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-duedate">Fälligkeitsdatum</Label>
              <Input
                id="task-duedate"
                type="date"
                value={currentTask.dueDate || ""}
                onChange={(e) =>
                  setCurrentTask({ ...currentTask, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveTask}>
              {currentTask.id ? "Aufgabe speichern" : "Aufgabe erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionTracker;
