import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRigs } from "@/hooks/useRigs";
import { isMobileDevice } from "@/lib/device-detection";
import { getActiveLocations } from "@/config/locations";
import { useUserList } from "@/hooks/useQueryHooks";
import {
  PhotoViewDialog,
  TaskDialog,
  ActionFilterCard,
} from "@/components/action-tracker";
import type {
  Action,
  ActionFile,
  ActionTask,
  ActionTrackerProps,
  ApiAction,
  ApiActionFile,
  MaterialItem,
  UserListItem,
} from "@/components/action-tracker/types";
import {
  formatDateForInput,
  extractPhotoFromDescription,
  parseMaterialsFromDescription,
  isOverdue,
} from "@/components/action-tracker/types";
import { useActionFilters } from "@/components/action-tracker/useActionFilters";
import { ActionTrackerSkeleton } from "@/components/ui/skeleton";
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
  Calendar,
  Image as ImageIcon,
  Download,
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  exportActionsToExcelProfessional,
  importActionsFromExcel,
  downloadActionTemplate,
} from "@/services/excel.service";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  plant: string;
}

const ActionTracker = ({
  initialActionId,
  showOnlyMyActions = false,
  onNavigateBack,
}: ActionTrackerProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    Record<string, string>
  >({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [actionToComplete, setActionToComplete] = useState<string | null>(null);
  const [photoViewDialogOpen, setPhotoViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // -- React Query: users (shared, deduplicated across pages) --
  const { data: userListData } = useUserList();
  const users: UserListItem[] = useMemo(() => userListData ?? [], [userListData]);

  // -- React Query: actions --
  const transformActions = useCallback((response: ApiAction[]): Action[] => {
    return response.map((item: ApiAction) => ({
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
        : formatDateForInput(new Date()),
      files: (item.actionFiles || []).map((file: ApiActionFile) => ({
        id: file.id,
        name: file.originalName || file.filename,
        type: file.fileType || "application/octet-stream",
        url:
          file.filePath ||
          `${import.meta.env.VITE_API_URL || "http://localhost:5137"}/api/actions/files/${file.filename}`,
        uploadedAt: file.uploadedAt,
        isPhoto: file.isPhoto || false,
      })),
      comments: [],
      tasks: [],
    }));
  }, []);

  const { data: actionsData, isLoading } = useQuery({
    queryKey: queryKeys.actions.list(),
    queryFn: async () => {
      const response = await apiClient.request<ApiAction[]>("/actions");
      return transformActions(response);
    },
  });
  const actions: Action[] = useMemo(() => actionsData ?? [], [actionsData]);

  /** Invalidate actions query (replaces old loadActions) */
  const refreshActions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.actions.all });
  }, [queryClient]);

  // Material Management State
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Task Management State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTaskActionId, setCurrentTaskActionId] = useState<string | null>(
    null,
  );
  const [currentTask, setCurrentTask] = useState<Partial<ActionTask>>({
    title: "",
    description: "",
    assignedUser: "",
    dueDate: "",
    completed: false,
  });

  const [currentAction, setCurrentAction] = useState<Partial<Action>>({
    plant: "",
    category: "ALLGEMEIN",
    location: "",
    title: "",
    description: "",
    status: "OPEN",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
    files: [],
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const uploadInProgressRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  // Derive availableUsers from React Query user list
  const availableUsers: User[] = React.useMemo(() => {
    const allUsers = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email || "",
      role: u.role || "USER",
      plant: u.assignedPlant || "",
    }));
    if (
      currentUser?.assignedPlant &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "MANAGER"
    ) {
      return allUsers.filter(
        (u) => !u.plant || u.plant === currentUser.assignedPlant,
      );
    }
    return allUsers;
  }, [users, currentUser]);

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] =
    useState(getActiveLocations());
  const [availableRigs, setAvailableRigs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const { rigs: loadedRigs } = useRigs();

  // Filter hook (manages all 6 filter states + computed results)
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    disciplineFilter,
    setDisciplineFilter,
    priorityFilter,
    setPriorityFilter,
    userFilter,
    setUserFilter,
    locationFilter,
    setLocationFilter,
    getFilteredActionsForCategory,
    getActionStats,
    getCategoryStats,
  } = useActionFilters(actions, users);

  // Mobile States
  const [mobileFilter, setMobileFilter] = useState<
    "all" | "open" | "progress" | "completed"
  >("all");
  const [showList, setShowList] = useState(false);
  const [selectedActionForEdit, setSelectedActionForEdit] =
    useState<Action | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Set user filter when showOnlyMyActions changes
  useEffect(() => {
    if (showOnlyMyActions && currentUser) {
      const userName = `${currentUser.firstName} ${currentUser.lastName}`;
      setUserFilter(userName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyMyActions]);

  // Listen for location changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "customLocations") {
        setAvailableLocations(getActiveLocations());
      }
    };

    // Listen for same-tab location updates (custom event dispatched when locations change)
    const handleLocalUpdate = () => {
      setAvailableLocations(getActiveLocations());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("locationsUpdated", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("locationsUpdated", handleLocalUpdate);
    };
  }, []);

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

  // Initialize rig data and category tabs when rigs load
  useEffect(() => {
    if (loadedRigs.length > 0) {
      setAvailableRigs(loadedRigs);
      setActiveTab(loadedRigs[0].name);
      const categoryDefaults: Record<string, string> = {};
      loadedRigs.forEach((r) => {
        categoryDefaults[r.name] = "alle";
      });
      setActiveCategoryTab(categoryDefaults);
    }
  }, [loadedRigs]);

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
    setPhotoFile(null);
    setPhotoPreview(null);
    setMaterials([]); // Reset materials for new action
    setCurrentAction({
      plant: activeTab, // Use active tab as default
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      assignedTo: "",
      dueDate: "",
      files: [],
    });
    setSelectedAssignees([]);
    // Reload locations to get any newly added ones
    setAvailableLocations(getActiveLocations());
    setIsDialogOpen(true);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    // Reload locations to get any newly added ones
    setAvailableLocations(getActiveLocations());
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation - plant, location and title are required
    if (
      !currentAction.plant ||
      !currentAction.location ||
      !currentAction.title
    ) {
      toast({
        title: "Fehler",
        description:
          "Bitte w�hlen Sie eine Anlage, einen Standort und geben Sie einen Titel ein.",
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
          "Bitte f�llen Sie alle Pflichtfelder aus (Zugewiesen an, F�lligkeitsdatum).",
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
              `?? ${m.mmNumber} | ${m.description} | ${m.quantity} ${
                m.unit
              } | ${m.status || "NICHT_BESTELLT"}`,
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
            location: currentAction.location,
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

        if (isMounted.current) {
          toast({
            variant: "success" as const,
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
            location: currentAction.location,
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

        if (isMounted.current) {
          toast({
            variant: "success" as const,
            title: "Action erstellt",
            description: `${currentAction.title} wurde erfolgreich erstellt.`,
          });
        }
      }

      // Upload files if any (including photo from mobile)
      const filesToUpload = [...pendingFiles];
      if (photoFile) {
        filesToUpload.push(photoFile);
      }

      if (filesToUpload.length > 0 && !uploadInProgressRef.current) {
        uploadInProgressRef.current = true;
        setIsUploadingFiles(true);

        const formData = new FormData();
        filesToUpload.forEach((file) => {
          formData.append("files", file);
        });

        try {
          await apiClient.post(`/actions/${actionId}/files`, formData);

          if (isMounted.current) {
            toast({
              variant: "success" as const,
              title: "Dateien hochgeladen",
              description: `${filesToUpload.length} Datei(en) erfolgreich hochgeladen.`,
            });
          }

          setPendingFiles([]);
          setPhotoFile(null);
          setPhotoPreview(null);
        } catch (uploadError) {
          console.error("Fehler beim Datei-Upload:", uploadError);
          if (isMounted.current) {
            toast({
              title: "Upload-Fehler",
              description: "Dateien konnten nicht hochgeladen werden.",
              variant: "destructive",
            });
          }
        } finally {
          setIsUploadingFiles(false);
          uploadInProgressRef.current = false;
        }
      }

      refreshActions();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      if (isMounted.current) {
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
            message: `Action "${action.title}" f�r ${action.plant} wurde abgeschlossen.`,
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

      refreshActions();
    } catch (error) {
      console.error("Fehler beim �ndern des Status:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht ge�ndert werden.",
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
            message: `Action "${action?.title}" f�r ${action?.plant} wurde abgeschlossen.`,
            type: "ACTION_COMPLETED",
            targetRoles: ["ADMIN", "MANAGER"],
            relatedId: actionToComplete,
          });
        } catch (notifError) {
          console.error("Notification error:", notifError);
          // Continue even if notification fails
        }

        toast({
          variant: "success" as const,
          title: "Action abgeschlossen",
          description: `${action?.title} wurde als abgeschlossen markiert.`,
        });

        refreshActions();
        setCompleteDialogOpen(false);
        setActionToComplete(null);
      } catch (error) {
        console.error("Fehler beim Abschlie�en:", error);
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
          variant: "success" as const,
          title: "Action gel�scht",
          description: `${action?.title} wurde erfolgreich gel�scht.`,
        });

        refreshActions();
        setDeleteDialogOpen(false);
        setActionToDelete(null);
      } catch (error) {
        console.error("Fehler beim L�schen:", error);
        toast({
          title: "Fehler",
          description: "Action konnte nicht gel�scht werden.",
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

    // Pr�fen ob es eine bestehende Aufgabe ist (hat ID) oder eine neue
    const isEditMode = !!currentTask.id;

    if (isEditMode) {
      // Aufgabe aktualisieren
      queryClient.setQueryData<Action[]>(queryKeys.actions.list(), (prev) =>
        (prev ?? []).map((action) =>
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
                    : task,
                ),
              }
            : action,
        ),
      );

      toast({
        variant: "success" as const,
        title: "Aufgabe aktualisiert",
        description: "Die Aufgabe wurde erfolgreich ge�ndert.",
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

      queryClient.setQueryData<Action[]>(queryKeys.actions.list(), (prev) =>
        (prev ?? []).map((action) =>
          action.id === currentTaskActionId
            ? { ...action, tasks: [...action.tasks, newTask] }
            : action,
        ),
      );

      toast({
        variant: "success" as const,
        title: "Aufgabe erstellt",
        description: "Die Aufgabe wurde erfolgreich hinzugef�gt.",
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
    queryClient.setQueryData<Action[]>(queryKeys.actions.list(), (prev) =>
      (prev ?? []).map((action) =>
        action.id === actionId
          ? {
              ...action,
              tasks: action.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task,
              ),
            }
          : action,
      ),
    );
  };

  const handleDeleteTask = (actionId: string, taskId: string) => {
    queryClient.setQueryData<Action[]>(queryKeys.actions.list(), (prev) =>
      (prev ?? []).map((action) =>
        action.id === actionId
          ? {
              ...action,
              tasks: action.tasks.filter((task) => task.id !== taskId),
            }
          : action,
      ),
    );

    toast({
      variant: "success" as const,
      title: "Aufgabe gel�scht",
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
    if (!files || uploadInProgressRef.current) return;

    // Speichere die echten File-Objekte f�r den Upload
    const fileArray = Array.from(files);

    // �berpr�fe auf Duplikate basierend auf Dateiname, Gr��e und Type
    const existingFileSignatures = pendingFiles.map(
      (f) => `${f.name}-${f.size}-${f.type}`,
    );
    const newFiles = fileArray.filter((file) => {
      const signature = `${file.name}-${file.size}-${file.type}`;
      return !existingFileSignatures.includes(signature);
    });

    if (newFiles.length === 0) {
      toast({
        title: "Datei bereits hinzugef�gt",
        description:
          "Diese Datei(en) wurden bereits zur Upload-Liste hinzugef�gt.",
        variant: "destructive",
      });
      return;
    }

    setPendingFiles([...pendingFiles, ...newFiles]);

    // Erstelle Preview-Objekte f�r die UI
    const newFileObjects: ActionFile[] = newFiles.map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      isPhoto: file.type.startsWith("image/"),
    }));

    setCurrentAction({
      ...currentAction,
      files: [...(currentAction.files || []), ...newFileObjects],
    });

    if (isMounted.current) {
      toast({
        title: "Dateien hinzugef�gt",
        description: `${newFiles.length} Datei(en) wurden hinzugef�gt.`,
      });
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      // If editing an existing action, delete from backend
      if (isEditMode && currentAction.id) {
        await apiClient.delete(`/actions/${currentAction.id}/files/${fileId}`);

        toast({
          title: "Datei gel�scht",
          description: "Die Datei wurde erfolgreich entfernt.",
        });
      }

      // Update local state
      setCurrentAction({
        ...currentAction,
        files: currentAction.files?.filter((f) => f.id !== fileId) || [],
      });
    } catch (error) {
      console.error("Fehler beim L�schen der Datei:", error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht gel�scht werden.",
        variant: "destructive",
      });
    }
  };

  // Excel Export Handler
  const handleExport = async () => {
    // Get all actions from current plant tab
    const filteredActions = actions.filter((a) => a.plant === activeTab);

    // Use professional export
    await exportActionsToExcelProfessional(
      filteredActions,
      `MaintAIn_${activeTab}_Actions_${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
    );

    toast({
      title: "Export erfolgreich",
      description: `${filteredActions.length} Actions von ${activeTab} wurden mit Dashboard exportiert.`,
    });
  };

  // Excel Import Handler
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedActions = await importActionsFromExcel(file);

      // Send to backend
      for (const action of importedActions) {
        if (action.id) {
          // Update existing action
          await apiClient.put(`/actions/${action.id}`, action);
        } else {
          // Create new action
          await apiClient.post("/actions", {
            ...action,
            createdBy: currentUser?.email || "System",
          });
        }
      }

      // Refresh actions
      refreshActions();

      toast({
        title: "Import erfolgreich",
        description: `${importedActions.length} Actions wurden importiert.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import fehlgeschlagen",
        description: "Fehler beim Importieren der Excel-Datei.",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = "";
  };

  const isMobile = isMobileDevice();

  // Mobile View: Enhanced with action list and filters
  if (isMobile) {
    // Get current user's actions
    const myActions = actions
      .filter((action) => {
        // Filter by status
        if (mobileFilter === "open" && action.status !== "OPEN") return false;
        if (mobileFilter === "progress" && action.status !== "IN_PROGRESS")
          return false;
        if (mobileFilter === "completed" && action.status !== "COMPLETED")
          return false;

        // Show user's own actions
        return (
          action.createdBy === currentUser?.email ||
          action.assignedTo === currentUser?.email ||
          action.assignedUsers?.includes(currentUser?.id || "")
        );
      })
      .sort((a, b) => {
        // Sort: overdue first, then by due date
        const aOverdue = isOverdue(a.dueDate, a.status);
        const bOverdue = isOverdue(b.dueDate, b.status);

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        return 0;
      });

    const openCount = myActions.filter((a) => a.status === "OPEN").length;
    const progressCount = myActions.filter(
      (a) => a.status === "IN_PROGRESS",
    ).length;

    return (
      <div className="p-3 space-y-3 pb-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() =>
            onNavigateBack ? onNavigateBack() : window.history.back()
          }
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zur�ck
        </Button>

        {/* Header Card */}
        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="h-6 w-6" />
              Action Points
            </CardTitle>
            <CardDescription className="text-slate-300">
              {myActions.length} Meine Actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={openNewDialog}
              className="w-full h-16 text-lg bg-white text-slate-800 hover:bg-slate-100"
              size="lg"
            >
              <Plus className="h-6 w-6 mr-2" />
              Neue Action erstellen
            </Button>

            {/* Toggle View Button */}
            <Button
              onClick={() => setShowList(!showList)}
              variant="outline"
              className="w-full h-12 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              {showList ? "�bersicht anzeigen" : "Meine Actions anzeigen"}
            </Button>
          </CardContent>
        </Card>

        {!showList ? (
          // Overview Cards
          <>
            {/* Status Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={mobileFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("all")}
                className="shrink-0"
              >
                Alle ({myActions.length})
              </Button>
              <Button
                variant={mobileFilter === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("open")}
                className="shrink-0"
              >
                Offen ({openCount})
              </Button>
              <Button
                variant={mobileFilter === "progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("progress")}
                className="shrink-0"
              >
                In Arbeit ({progressCount})
              </Button>
              <Button
                variant={mobileFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("completed")}
                className="shrink-0"
              >
                Erledigt (
                {myActions.filter((a) => a.status === "COMPLETED").length})
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">
                      {openCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Offen</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-500">
                      {progressCount}
                    </p>
                    <p className="text-sm text-muted-foreground">In Arbeit</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // Action List
          <>
            {/* Status Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={mobileFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("all")}
                className="shrink-0"
              >
                Alle
              </Button>
              <Button
                variant={mobileFilter === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("open")}
                className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Offen
              </Button>
              <Button
                variant={mobileFilter === "progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("progress")}
                className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
              >
                In Arbeit
              </Button>
              <Button
                variant={mobileFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileFilter("completed")}
                className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
              >
                Erledigt
              </Button>
            </div>

            {/* Action Cards */}
            {myActions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">
                    {mobileFilter === "all"
                      ? "Keine Actions vorhanden"
                      : `Keine ${
                          mobileFilter === "open"
                            ? "offenen"
                            : mobileFilter === "progress"
                              ? "aktiven"
                              : "erledigten"
                        } Actions`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myActions.map((action) => {
                  const overdueClass = isOverdue(action.dueDate, action.status)
                    ? "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20"
                    : "";

                  return (
                    <Card
                      key={action.id}
                      className={`${overdueClass} ${
                        action.status === "COMPLETED" ? "opacity-70" : ""
                      } cursor-pointer transition-all hover:shadow-md active:scale-95`}
                      onClick={() => {
                        setSelectedActionForEdit(action);
                        setShowEditDialog(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="shrink-0 text-xs font-bold"
                              >
                                {action.plant}
                              </Badge>
                              <Badge
                                className={`shrink-0 text-xs font-semibold ${
                                  action.status === "COMPLETED"
                                    ? "bg-green-500"
                                    : action.status === "IN_PROGRESS"
                                      ? "bg-blue-500"
                                      : "bg-yellow-500 text-black"
                                }`}
                              >
                                {action.status === "OPEN" && "Offen"}
                                {action.status === "IN_PROGRESS" && "In Arbeit"}
                                {action.status === "COMPLETED" && "? Erledigt"}
                              </Badge>
                            </div>
                            <CardTitle
                              className={`text-base leading-tight ${
                                action.status === "COMPLETED"
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {action.title}
                            </CardTitle>
                          </div>

                          {/* Priority Indicator */}
                          <div
                            className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              action.priority === "URGENT"
                                ? "bg-red-500"
                                : action.priority === "HIGH"
                                  ? "bg-orange-500"
                                  : action.priority === "MEDIUM"
                                    ? "bg-yellow-500"
                                    : "bg-gray-400"
                            }`}
                          >
                            <span className="text-white text-xs font-bold">
                              {action.priority === "URGENT" && "!!!"}
                              {action.priority === "HIGH" && "!!"}
                              {action.priority === "MEDIUM" && "!"}
                              {action.priority === "LOW" && "�"}
                            </span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {action.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {action.description}
                          </p>
                        )}

                        {/* Location Display */}
                        {action.location && (
                          <div className="flex items-center gap-1 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {action.location}
                            </Badge>
                          </div>
                        )}

                        {/* Info Row */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <UserIcon className="h-3 w-3" />
                            <span className="truncate">
                              {action.assignedTo?.split("@")[0] ||
                                "Nicht zugewiesen"}
                            </span>
                          </div>
                          {action.dueDate && (
                            <div
                              className={`flex items-center gap-1 font-medium ${
                                isOverdue(action.dueDate, action.status)
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(action.dueDate).toLocaleDateString(
                                  "de-DE",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Files & Tasks indicators */}
                        {(action.files.length > 0 ||
                          action.tasks.length > 0) && (
                          <div className="flex gap-2 mt-2">
                            {action.files.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {action.files.length}
                              </Badge>
                            )}
                            {action.tasks.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <ListTodo className="h-3 w-3 mr-1" />
                                {
                                  action.tasks.filter(
                                    (t: ActionTask) => t.completed,
                                  ).length
                                }
                                /{action.tasks.length}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Edit Action Dialog (Mobile Popup) */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Action bearbeiten</DialogTitle>
              <DialogDescription className="text-sm">
                M�chten Sie diese Action bearbeiten?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {selectedActionForEdit && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedActionForEdit.plant}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        selectedActionForEdit.status === "COMPLETED"
                          ? "bg-green-500"
                          : selectedActionForEdit.status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : "bg-yellow-500 text-black"
                      }`}
                    >
                      {selectedActionForEdit.status === "OPEN" && "Offen"}
                      {selectedActionForEdit.status === "IN_PROGRESS" &&
                        "In Arbeit"}
                      {selectedActionForEdit.status === "COMPLETED" &&
                        "Erledigt"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm">
                    {selectedActionForEdit.title}
                  </p>
                  {selectedActionForEdit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {selectedActionForEdit.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedActionForEdit) {
                    // Parse materials from description
                    const parsedMaterials = parseMaterialsFromDescription(
                      selectedActionForEdit.description,
                    );
                    const descriptionWithoutMaterials =
                      selectedActionForEdit.description
                        .split("--- Materialien ---")[0]
                        .trim();

                    setMaterials(parsedMaterials);
                    setCurrentAction({
                      ...selectedActionForEdit,
                      description: descriptionWithoutMaterials,
                    });
                    setSelectedAssignees(
                      selectedActionForEdit.assignedUsers || [],
                    );
                    setIsDialogOpen(true);
                    setShowEditDialog(false);
                    setShowList(false); // Zur�ck zur �bersicht
                  }
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-800"
              >
                Bearbeiten
              </Button>
              <Button
                onClick={() => {
                  if (selectedActionForEdit) {
                    handleDelete(selectedActionForEdit.id);
                    setShowEditDialog(false);
                  }
                }}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                L�schen
              </Button>
              <Button
                onClick={() => setShowEditDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Dialog with button-based selection */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Action erstellen</DialogTitle>
              <DialogDescription>
                W�hlen Sie Anlage und Priorit�t aus
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Plant Selection */}
              <div className="space-y-2">
                <Label>Anlage *</Label>
                <Select
                  value={currentAction.plant}
                  onValueChange={(v) =>
                    setCurrentAction({ ...currentAction, plant: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Anlage ausw�hlen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRigs.map((rig) => (
                      <SelectItem key={rig.id} value={rig.name}>
                        {rig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selection - Button Grid with colors (NO EMOJIS) */}
              <div className="space-y-2">
                <Label>Priorit�t *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      currentAction.priority === "LOW" ? "default" : "outline"
                    }
                    onClick={() =>
                      setCurrentAction({ ...currentAction, priority: "LOW" })
                    }
                    className={cn(
                      "h-12 text-base font-semibold",
                      currentAction.priority === "LOW" &&
                        "bg-green-500 hover:bg-green-600 text-white",
                    )}
                  >
                    Niedrig
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentAction.priority === "MEDIUM"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setCurrentAction({ ...currentAction, priority: "MEDIUM" })
                    }
                    className={cn(
                      "h-12 text-base font-semibold",
                      currentAction.priority === "MEDIUM" &&
                        "bg-yellow-500 hover:bg-yellow-600 text-white",
                    )}
                  >
                    Mittel
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentAction.priority === "HIGH" ? "default" : "outline"
                    }
                    onClick={() =>
                      setCurrentAction({ ...currentAction, priority: "HIGH" })
                    }
                    className={cn(
                      "h-12 text-base font-semibold",
                      currentAction.priority === "HIGH" &&
                        "bg-orange-500 hover:bg-orange-600 text-white",
                    )}
                  >
                    Hoch
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentAction.priority === "URGENT"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setCurrentAction({ ...currentAction, priority: "URGENT" })
                    }
                    className={cn(
                      "h-12 text-base font-semibold",
                      currentAction.priority === "URGENT" &&
                        "bg-red-500 hover:bg-red-600 text-white",
                    )}
                  >
                    Dringend
                  </Button>
                </div>
              </div>

              {/* Location Selection - Dropdown */}
              <div className="space-y-2">
                <Label>Standort</Label>
                <Select
                  value={currentAction.location || ""}
                  onValueChange={(value) =>
                    setCurrentAction({
                      ...currentAction,
                      location: value,
                    })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Standort ausw�hlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
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

              {/* Assignee Selection - Dropdown filtered by selected plant */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Verantwortlich</Label>
                <Select
                  value={currentAction.assignedTo}
                  onValueChange={(value) =>
                    setCurrentAction({ ...currentAction, assignedTo: value })
                  }
                >
                  <SelectTrigger id="assignedTo" className="h-12 text-base">
                    <SelectValue placeholder="Person ausw�hlen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => {
                        // Show only users from selected plant + managers/admins
                        if (!currentAction.plant) return false;

                        // Check if user is manager/admin by role
                        const isManager =
                          user.role === "MANAGER" || user.role === "ADMIN";

                        // Check if user has no plant assigned (likely admin/manager)
                        const hasNoPlantAssignment = !user.assignedPlant;

                        // Check if user is assigned to the selected plant
                        const isSamePlant =
                          user.assignedPlant === currentAction.plant;

                        return isManager || hasNoPlantAssignment || isSamePlant;
                      })
                      .map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.firstName} {user.lastName} (
                          {user.role || "USER"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Upload like FailureReporting */}
              <div className="space-y-2">
                <Label>Foto hinzuf�gen</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute(
                          "capture",
                          "environment",
                        );
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full h-12"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Kamera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full h-12"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Galerie
                  </Button>
                </div>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="w-full mt-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Foto entfernen
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-md border"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-12"
                disabled={isUploadingFiles}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                className="h-12"
                disabled={isUploadingFiles}
              >
                {isUploadingFiles ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    L�dt hoch...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop View: Full functionality
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() =>
          onNavigateBack ? onNavigateBack() : window.history.back()
        }
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zur�ck
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Action Tracker
              </CardTitle>
              <CardDescription>
                Aufgabenverfolgung f�r alle Anlagen
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={downloadActionTemplate}
                variant="outline"
                size="sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Template
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => document.getElementById("excel-upload")?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Neue Action
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ActionTrackerSkeleton />
          ) : (
            <>
              {/* Filter Card */}
              <ActionFilterCard
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                disciplineFilter={disciplineFilter}
                onDisciplineChange={setDisciplineFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                locationFilter={locationFilter}
                onLocationChange={setLocationFilter}
                userFilter={userFilter}
                onUserChange={setUserFilter}
                users={users}
                availableLocations={availableLocations}
              />

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                {/* Rig Selector Dropdown - scales for 20+ rigs */}
                <div className="flex items-center gap-3">
                  <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full sm:w-72 h-12 bg-muted/30">
                      <SelectValue placeholder="Anlage ausw�hlen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRigs.map((rig) => {
                        const stats = getActionStats(rig.name);
                        const openCount = stats.open + stats.inProgress;
                        return (
                          <SelectItem key={rig.id} value={rig.name}>
                            <div className="flex items-center gap-3 py-1">
                              <span className="font-bold">{rig.name}</span>
                              {openCount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="px-1.5 py-0 text-[10px] font-bold h-4"
                                >
                                  {openCount} Offen
                                </Badge>
                              )}
                              {openCount === 0 && stats.total > 0 && (
                                <Badge
                                  variant="outline"
                                  className="px-1.5 py-0 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 h-4"
                                >
                                  Alle erledigt
                                </Badge>
                              )}
                              {stats.total === 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  Keine Actions
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {availableRigs.length} Anlagen
                  </span>
                </div>

                {availableRigs.map((rig) => (
                  <TabsContent key={rig.id} value={rig.name}>
                    {/* Nested Category Tabs */}
                    <Tabs
                      value={activeCategoryTab[rig.name] || "alle"}
                      onValueChange={(value) =>
                        setActiveCategoryTab({
                          ...activeCategoryTab,
                          [rig.name]: value,
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
                              {getCategoryStats(rig.name, "allgemein")} Actions
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
                              {getCategoryStats(rig.name, "rigmoves")} Actions
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
                              {getCategoryStats(rig.name, "alle")} Actions
                            </Badge>
                          </div>
                        </TabsTrigger>
                      </TabsList>

                      {["allgemein", "rigmoves", "alle"].map((category) => {
                        const categoryActions = getFilteredActionsForCategory(
                          rig.name,
                          category,
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
                                  Erstellen Sie die erste Action f�r {rig.name}
                                </p>
                                <Button onClick={openNewDialog}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Action erstellen
                                </Button>
                              </div>
                            ) : (
                              <div className="rounded-md border overflow-x-auto -webkit-overflow-scrolling-touch">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b">
                                      <TableHead className="w-[32px] py-2 h-9"></TableHead>
                                      <TableHead className="w-[45px] py-2 h-9 text-xs font-semibold">
                                        Nr.
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Titel
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Kategorie
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Standort
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Status
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Priorit�t
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        Zugewiesen
                                      </TableHead>
                                      <TableHead className="py-2 h-9 text-xs font-semibold">
                                        F�llig
                                      </TableHead>
                                      <TableHead className="text-center py-2 h-9 w-[70px] text-xs font-semibold">
                                        Tasks
                                      </TableHead>
                                      <TableHead className="text-center py-2 h-9 w-[70px] text-xs font-semibold">
                                        Dateien
                                      </TableHead>
                                      <TableHead className="text-right py-2 h-9 w-[90px] text-xs font-semibold">
                                        Aktionen
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {categoryActions.map((action, index) => (
                                      <React.Fragment key={action.id}>
                                        <TableRow
                                          id={`action-${action.id}`}
                                          className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                                            isOverdue(
                                              action.dueDate,
                                              action.status,
                                            )
                                              ? "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500"
                                              : ""
                                          }`}
                                        >
                                          <TableCell className="py-2">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              {expandedRows.has(action.id) ? (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                              ) : (
                                                <ChevronRight className="h-3.5 w-3.5" />
                                              )}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <span className="font-medium text-muted-foreground text-xs">
                                              #{index + 1}
                                            </span>
                                          </TableCell>
                                          <TableCell
                                            className="py-2 max-w-[250px]"
                                            onClick={() => toggleRow(action.id)}
                                          >
                                            <div className="space-y-0.5">
                                              <div
                                                className={`font-medium text-sm leading-tight ${
                                                  action.status === "COMPLETED"
                                                    ? "line-through text-muted-foreground"
                                                    : ""
                                                }`}
                                              >
                                                {action.title}
                                              </div>
                                              {action.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                  {action.description}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <Badge
                                              variant="outline"
                                              className={`text-xs font-medium ${
                                                action.discipline === "MECHANIK"
                                                  ? "border-cyan-500 text-cyan-700 dark:text-cyan-400"
                                                  : action.discipline ===
                                                      "ELEKTRIK"
                                                    ? "border-purple-500 text-purple-700 dark:text-purple-400"
                                                    : action.discipline ===
                                                        "ANLAGE"
                                                      ? "border-pink-500 text-pink-700 dark:text-pink-400"
                                                      : "border-gray-400 text-gray-600 dark:text-gray-400"
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
                                          <TableCell className="py-2">
                                            <span className="text-xs text-muted-foreground">
                                              {action.location || "-"}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <Badge
                                              variant="outline"
                                              className={`text-xs font-medium ${
                                                action.status === "COMPLETED"
                                                  ? "border-green-500 text-green-700 dark:text-green-400"
                                                  : action.status ===
                                                      "IN_PROGRESS"
                                                    ? "border-blue-500 text-blue-700 dark:text-blue-400"
                                                    : "border-yellow-500 text-yellow-700 dark:text-yellow-400"
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
                                          <TableCell className="py-2">
                                            <Badge
                                              variant="outline"
                                              className={`text-xs font-medium ${
                                                action.priority === "URGENT"
                                                  ? "border-red-500 text-red-700 dark:text-red-400"
                                                  : action.priority === "HIGH"
                                                    ? "border-orange-500 text-orange-700 dark:text-orange-400"
                                                    : action.priority ===
                                                        "MEDIUM"
                                                      ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                                                      : "border-gray-500 text-gray-700 dark:text-gray-400"
                                              }`}
                                            >
                                              {action.priority}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <div className="flex items-center gap-1.5">
                                              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                              <span className="text-xs">
                                                {action.assignedTo ||
                                                  "Nicht zugewiesen"}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <span
                                              className={`text-xs font-medium ${
                                                isOverdue(
                                                  action.dueDate,
                                                  action.status,
                                                )
                                                  ? "text-red-600 dark:text-red-400"
                                                  : ""
                                              }`}
                                            >
                                              {action.dueDate
                                                ? new Date(
                                                    action.dueDate,
                                                  ).toLocaleDateString("de-DE")
                                                : "-"}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs px-2"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              <ListTodo className="h-3 w-3 mr-1" />
                                              {
                                                action.tasks.filter(
                                                  (t) => t.completed,
                                                ).length
                                              }
                                              /{action.tasks.length}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs px-2"
                                              onClick={() =>
                                                toggleRow(action.id)
                                              }
                                            >
                                              <Paperclip className="h-3 w-3 mr-1" />
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
                                                    : "Action abschlie�en"
                                                }
                                              >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                  openEditDialog(action)
                                                }
                                                title="Action bearbeiten"
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                  handleDelete(action.id)
                                                }
                                                title="Action l�schen"
                                              >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
                                                            "--- Materialien ---",
                                                          )[0]
                                                          .split("\n")
                                                          .filter(
                                                            (line) =>
                                                              !line.startsWith(
                                                                "?? Photo:",
                                                              ),
                                                          )
                                                          .join("\n")
                                                          .trim()}
                                                      </p>
                                                      {/* Zeige Foto-Thumbnail wenn Cloudinary URL vorhanden */}
                                                      {(() => {
                                                        const photoUrl =
                                                          extractPhotoFromDescription(
                                                            action.description,
                                                          );
                                                        if (
                                                          photoUrl &&
                                                          (photoUrl.startsWith(
                                                            "http://",
                                                          ) ||
                                                            photoUrl.startsWith(
                                                              "https://",
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
                                                                    photoUrl,
                                                                  );
                                                                  setPhotoViewDialogOpen(
                                                                    true,
                                                                  );
                                                                }}
                                                              />
                                                            </div>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                      {/* Zeige Foto-Button nur f�r alte lokale Dateien */}
                                                      {(() => {
                                                        const photoFilename =
                                                          extractPhotoFromDescription(
                                                            action.description,
                                                          );
                                                        if (
                                                          photoFilename &&
                                                          !photoFilename.startsWith(
                                                            "http://",
                                                          ) &&
                                                          !photoFilename.startsWith(
                                                            "https://",
                                                          )
                                                        ) {
                                                          return (
                                                            <div className="pt-3 border-t">
                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={async () => {
                                                                  try {
                                                                    const blob =
                                                                      await apiClient.request<Blob>(
                                                                        `/failure-reports/photo/${photoFilename}`,
                                                                        {
                                                                          responseType:
                                                                            "blob",
                                                                        },
                                                                      );

                                                                    const photoUrl =
                                                                      URL.createObjectURL(
                                                                        blob,
                                                                      );
                                                                    setSelectedPhoto(
                                                                      photoUrl,
                                                                    );
                                                                    setPhotoViewDialogOpen(
                                                                      true,
                                                                    );

                                                                    setTimeout(
                                                                      () =>
                                                                        URL.revokeObjectURL(
                                                                          photoUrl,
                                                                        ),
                                                                      10000,
                                                                    );
                                                                  } catch (error) {
                                                                    console.error(
                                                                      "? Error loading photo:",
                                                                      error,
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
                                                              action.id,
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
                                                                      task.id,
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
                                                                                u,
                                                                              ) =>
                                                                                u.id ===
                                                                                task.assignedUser,
                                                                            );
                                                                          return user
                                                                            ? `${user.firstName} ${user.lastName}`
                                                                            : task.assignedUser;
                                                                        })()}
                                                                      </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                      <span className="text-xs text-muted-foreground">
                                                                        F�llig:{" "}
                                                                        {new Date(
                                                                          task.dueDate,
                                                                        ).toLocaleDateString(
                                                                          "de-DE",
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
                                                                        },
                                                                      );
                                                                      setCurrentTaskActionId(
                                                                        action.id,
                                                                      );
                                                                      setTaskDialogOpen(
                                                                        true,
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
                                                                        task.id,
                                                                      )
                                                                    }
                                                                    title="L�schen"
                                                                  >
                                                                    <X className="h-3 w-3" />
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            ),
                                                          )}
                                                        </div>
                                                      )}
                                                    </CardContent>
                                                  </Card>
                                                </div>

                                                {/* Angeh�ngte Dateien Card */}
                                                {action.files.length > 0 && (
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <CardTitle className="text-base flex items-center gap-2">
                                                        ?? Angeh�ngte Dateien
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
                                                                    className="w-full aspect-square object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => {
                                                                      setSelectedPhoto(
                                                                        file.url,
                                                                      );
                                                                      setPhotoViewDialogOpen(
                                                                        true,
                                                                      );
                                                                    }}
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
                                                          ),
                                                        )}
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                )}

                                                {/* Material-Liste Card */}
                                                {(() => {
                                                  const materials =
                                                    parseMaterialsFromDescription(
                                                      action.description,
                                                    );
                                                  if (materials.length === 0)
                                                    return null;

                                                  return (
                                                    <Card className="border">
                                                      <CardHeader className="bg-muted/50 pb-2 pt-3">
                                                        <div className="flex items-center justify-between">
                                                          <CardTitle className="text-base flex items-center gap-2">
                                                            ?? Bestellte
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
                                                                  status?: MaterialItem["status"],
                                                                ) => {
                                                                  switch (
                                                                    status
                                                                  ) {
                                                                    case "GELIEFERT":
                                                                      return (
                                                                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                                                          ??
                                                                          Geliefert
                                                                        </Badge>
                                                                      );
                                                                    case "UNTERWEGS":
                                                                      return (
                                                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                          ??
                                                                          Unterwegs
                                                                        </Badge>
                                                                      );
                                                                    case "BESTELLT":
                                                                      return (
                                                                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                                                          ??
                                                                          Bestellt
                                                                        </Badge>
                                                                      );
                                                                    default:
                                                                      return (
                                                                        <Badge
                                                                          variant="outline"
                                                                          className="border-2"
                                                                        >
                                                                          ?
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
                                                                          material.status,
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
                                                            },
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
                ? "�ndern Sie die Action-Details"
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
                    <Select
                      value={currentAction.plant}
                      onValueChange={(v) =>
                        setCurrentAction({ ...currentAction, plant: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Anlage ausw�hlen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRigs.map((rig) => (
                          <SelectItem key={rig.id} value={rig.name}>
                            {rig.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="location">Standort</Label>
                    <Select
                      value={currentAction.location || ""}
                      onValueChange={(value) =>
                        setCurrentAction({
                          ...currentAction,
                          location: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Standort ausw�hlen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TD">TD</SelectItem>
                        <SelectItem value="DW">DW</SelectItem>
                        <SelectItem value="MP1">MP1</SelectItem>
                        <SelectItem value="MP2">MP2</SelectItem>
                        <SelectItem value="MP3">MP3</SelectItem>
                        <SelectItem value="PCR">PCR</SelectItem>
                        <SelectItem value="Generatoren">Generatoren</SelectItem>
                        <SelectItem value="Grid Container">
                          Grid Container
                        </SelectItem>
                        <SelectItem value="Mud System">Mud System</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Label htmlFor="priority">Priorit�t</Label>
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
                          <SelectValue placeholder="User ausw�hlen" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => {
                              // Admins und Manager k�nnen immer ausgew�hlt werden
                              if (!user.assignedPlant) return true;
                              // User muss zur ausgew�hlten Anlage geh�ren
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
                        Zus�tzliche Zust�ndige
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
                                ? `${selectedAssignees.length} User ausgew�hlt`
                                : "User ausw�hlen..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="User suchen..." />
                              <CommandEmpty>Keine User gefunden.</CommandEmpty>
                              <CommandGroup>
                                {availableUsers
                                  .filter((user) => {
                                    // Show only users from selected plant + managers/admins
                                    if (!currentAction.plant) return false;

                                    // Check if user is manager/admin by role
                                    const isManager =
                                      user.role === "MANAGER" ||
                                      user.role === "ADMIN";

                                    // Check if user has no plant assigned (likely admin/manager)
                                    const hasNoPlantAssignment = !user.plant;

                                    // Check if user is assigned to the selected plant
                                    const isSamePlant =
                                      user.plant === currentAction.plant;

                                    return (
                                      isManager ||
                                      hasNoPlantAssignment ||
                                      isSamePlant
                                    );
                                  })
                                  .map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      onSelect={() => {
                                        const isSelected =
                                          selectedAssignees.includes(user.id);
                                        if (isSelected) {
                                          setSelectedAssignees(
                                            selectedAssignees.filter(
                                              (id) => id !== user.id,
                                            ),
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
                                            : "opacity-0",
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

                        {/* Ausgew�hlte User anzeigen */}
                        {selectedAssignees.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedAssignees.map((userId) => {
                              const user = availableUsers.find(
                                (u) => u.id === userId,
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
                                          (id) => id !== userId,
                                        ),
                                      );
                                    }}
                                    className="ml-1 hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
                                  >
                                    �
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">F�lligkeitsdatum *</Label>
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
                        placeholder="F�lligkeitsdatum w�hlen"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dateien anh�ngen</Label>
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
                        Dateien ausw�hlen
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
                      Material hinzuf�gen
                    </Button>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Noch keine Materialien hinzugef�gt
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
                                    <SelectItem value="m�">m�</SelectItem>
                                    <SelectItem value="m�">m�</SelectItem>
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
                                      ? Nicht bestellt
                                    </SelectItem>
                                    <SelectItem
                                      value="BESTELLT"
                                      className="text-base"
                                    >
                                      ?? Bestellt
                                    </SelectItem>
                                    <SelectItem
                                      value="UNTERWEGS"
                                      className="text-base"
                                    >
                                      ?? Unterwegs
                                    </SelectItem>
                                    <SelectItem
                                      value="GELIEFERT"
                                      className="text-base"
                                    >
                                      ?? Geliefert
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
                                      materials.filter((_, i) => i !== index),
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
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploadingFiles}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isUploadingFiles}>
              {isUploadingFiles ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  L�dt hoch...
                </>
              ) : isEditMode ? (
                "Speichern"
              ) : (
                "Erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Action wirklich l�schen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionToDelete && (
                <>
                  <p className="mb-2">
                    Sie sind dabei, die folgende Action zu l�schen:
                  </p>
                  <p className="font-semibold text-foreground">
                    "{actions.find((a) => a.id === actionToDelete)?.title}"
                  </p>
                  <p className="mt-3">
                    Diese Aktion kann nicht r�ckg�ngig gemacht werden. Die
                    Action wird dauerhaft aus der Datenbank entfernt.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Endg�ltig l�schen
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
            <AlertDialogTitle>Action abschlie�en?</AlertDialogTitle>
            <AlertDialogDescription>
              M�chten Sie diese Action wirklich als abgeschlossen markieren? Die
              Manager werden �ber den Abschluss benachrichtigt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmComplete}
              className="bg-green-600"
            >
              Abschlie�en
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo View Dialog */}
      <PhotoViewDialog
        open={photoViewDialogOpen}
        onOpenChange={(open) => {
          setPhotoViewDialogOpen(open);
          if (!open) setSelectedPhoto(null);
        }}
        photoUrl={selectedPhoto}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={currentTask}
        onTaskChange={setCurrentTask}
        onSave={handleSaveTask}
        availableUsers={availableUsers}
        currentActionPlant={
          actions.find((a) => a.id === currentTaskActionId)?.plant
        }
      />
    </div>
  );
};

export default ActionTracker;
