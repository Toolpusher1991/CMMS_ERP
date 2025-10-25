import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { authService } from "@/services/auth.service";
import type { Comment } from "@/components/CommentSection";
import { CommentSection } from "@/components/CommentSection";
import {
  getActionComments,
  createActionComment,
  updateActionComment,
  deleteActionComment,
} from "@/services/comment.service";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronUp,
  Paperclip,
  X,
  Camera,
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

interface Action {
  id: string;
  plant: "T208" | "T207" | "T700" | "T46";
  category?: "ALLGEMEIN" | "RIGMOVE";
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo: string;
  dueDate: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  files: ActionFile[];
  materials?: MaterialItem[];
}

interface ApiActionFile {
  id: string;
  filename: string;
  originalName?: string;
  fileType?: string;
  uploadedAt: string;
  isPhoto?: boolean;
}

interface ApiAction {
  id: string;
  plant: string;
  category?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt?: string;
  actionFiles?: ApiActionFile[];
}

const ActionTracker = () => {
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
  const [photoViewDialogOpen, setPhotoViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  // Material Management State
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Comment Management State
  const [actionComments, setActionComments] = useState<
    Record<string, Comment[]>
  >({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});

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

  // Extrahiere Foto-Dateinamen aus Beschreibung (von Failure Reports)
  const extractPhotoFromDescription = (description: string): string | null => {
    const match = description.match(
      /📸 Photo: ([\w-]+\.(?:jpg|jpeg|png|gif|webp))/i
    );
    return match ? match[1] : null;
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

  // Backend laden
  useEffect(() => {
    setIsMounted(true);
    loadActions();
    loadUsers();

    return () => {
      setIsMounted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.request<
        Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          assignedPlant?: string;
        }>
      >("/users/list");
      setUsers(response);
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
        title: item.title,
        description: item.description || "",
        status: item.status as Action["status"],
        priority: item.priority as Action["priority"],
        assignedTo: item.assignedTo || "",
        dueDate: item.dueDate ? item.dueDate.split("T")[0] : "",
        completedAt: item.completedAt
          ? item.completedAt.split("T")[0]
          : undefined,
        createdBy: item.createdBy || "System",
        createdAt: item.createdAt
          ? item.createdAt.split("T")[0]
          : new Date().toISOString().split("T")[0],
        files: (item.actionFiles || []).map((file: ApiActionFile) => ({
          id: file.id,
          name: file.originalName || file.filename,
          type: file.fileType || "application/octet-stream",
          url: `http://localhost:3000/api/actions/files/${file.filename}`,
          uploadedAt: file.uploadedAt,
          isPhoto: file.isPhoto || false,
        })),
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
      // Load comments when expanding row
      if (!actionComments[id]) {
        loadComments(id);
      }
    }
    setExpandedRows(newExpanded);
  };

  // Load comments for action
  const loadComments = async (actionId: string) => {
    setLoadingComments((prev) => ({ ...prev, [actionId]: true }));
    try {
      const comments = await getActionComments(actionId);
      setActionComments((prev) => ({ ...prev, [actionId]: comments }));
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kommentare konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingComments((prev) => ({ ...prev, [actionId]: false }));
    }
  };

  // Add comment
  const handleAddComment = async (actionId: string, text: string) => {
    const newComment = await createActionComment(actionId, text);
    setActionComments((prev) => ({
      ...prev,
      [actionId]: [...(prev[actionId] || []), newComment],
    }));
  };

  // Update comment
  const handleUpdateComment = async (
    actionId: string,
    commentId: string,
    text: string
  ) => {
    const updatedComment = await updateActionComment(actionId, commentId, text);
    setActionComments((prev) => ({
      ...prev,
      [actionId]: (prev[actionId] || []).map((c) =>
        c.id === commentId ? updatedComment : c
      ),
    }));
  };

  // Delete comment
  const handleDeleteComment = async (actionId: string, commentId: string) => {
    await deleteActionComment(actionId, commentId);
    setActionComments((prev) => ({
      ...prev,
      [actionId]: (prev[actionId] || []).filter((c) => c.id !== commentId),
    }));
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
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !currentAction.title ||
      !currentAction.assignedTo ||
      !currentAction.dueDate
    ) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
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
            title: currentAction.title,
            description: descriptionWithMaterials,
            status: currentAction.status,
            priority: currentAction.priority,
            assignedTo: currentAction.assignedTo,
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
            title: currentAction.title,
            description: descriptionWithMaterials,
            status: currentAction.status,
            priority: currentAction.priority,
            assignedTo: currentAction.assignedTo,
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

  const handleStatusChange = async (
    id: string,
    newStatus: Action["status"]
  ) => {
    try {
      await apiClient.request(`/actions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      toast({
        title: "Status aktualisiert",
        description: `Status wurde auf ${newStatus} gesetzt.`,
      });

      await loadActions();
    } catch (error) {
      console.error("Fehler beim Status-Update:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

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

    return filtered;
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

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4">
                {["T208", "T207", "T700", "T46"].map((plant) => {
                  const stats = getActionStats(plant);
                  const openCount = stats.open + stats.inProgress;
                  return (
                    <TabsTrigger key={plant} value={plant} className="relative">
                      <div className="flex items-center gap-2">
                        <span>{plant}</span>
                        {openCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-1 px-1.5 py-0 text-xs font-bold"
                          >
                            {openCount}
                          </Badge>
                        )}
                        {openCount === 0 && stats.total > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 px-1.5 py-0 text-xs"
                          >
                            ✓
                          </Badge>
                        )}
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
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="allgemein">
                        <div className="flex items-center gap-2">
                          <span>Allgemein</span>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-xs"
                          >
                            {getCategoryStats(plant, "allgemein")}
                          </Badge>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger value="rigmoves">
                        <div className="flex items-center gap-2">
                          <span>Rigmoves</span>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-xs"
                          >
                            {getCategoryStats(plant, "rigmoves")}
                          </Badge>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger value="alle">
                        <div className="flex items-center gap-2">
                          <span>Alle</span>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-xs"
                          >
                            {getCategoryStats(plant, "alle")}
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
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="w-[50px]">
                                      Nr.
                                    </TableHead>
                                    <TableHead>Titel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priorität</TableHead>
                                    <TableHead>Zugewiesen an</TableHead>
                                    <TableHead>Fälligkeitsdatum</TableHead>
                                    <TableHead>Dateien</TableHead>
                                    <TableHead className="w-[100px]">
                                      Aktionen
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {categoryActions.map((action, index) => (
                                    <React.Fragment key={action.id}>
                                      <TableRow className="cursor-pointer hover:bg-muted/50">
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          {expandedRows.has(action.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          <span className="font-medium text-muted-foreground">
                                            {index + 1}
                                          </span>
                                        </TableCell>
                                        <TableCell
                                          className="font-medium"
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          {action.title}
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          <Badge
                                            variant={
                                              action.status === "COMPLETED"
                                                ? "default"
                                                : action.status ===
                                                  "IN_PROGRESS"
                                                ? "secondary"
                                                : "outline"
                                            }
                                          >
                                            {action.status === "OPEN" &&
                                              "Offen"}
                                            {action.status === "IN_PROGRESS" &&
                                              "In Bearbeitung"}
                                            {action.status === "COMPLETED" &&
                                              "Abgeschlossen"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          <Badge
                                            variant={
                                              action.priority === "URGENT" ||
                                              action.priority === "HIGH"
                                                ? "destructive"
                                                : "outline"
                                            }
                                          >
                                            {action.priority}
                                          </Badge>
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          {action.assignedTo}
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          {action.dueDate}
                                        </TableCell>
                                        <TableCell
                                          onClick={() => toggleRow(action.id)}
                                        >
                                          {action.files.length > 0 && (
                                            <span className="flex items-center gap-1 text-sm">
                                              <Paperclip className="h-3 w-3" />
                                              {action.files.length}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                openEditDialog(action)
                                              }
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                handleDelete(action.id)
                                              }
                                            >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>

                                      {expandedRows.has(action.id) && (
                                        <TableRow>
                                          <TableCell
                                            colSpan={8}
                                            className="bg-muted/50 p-0"
                                          >
                                            <div className="p-6 space-y-4">
                                              {/* Beschreibung Card */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-base flex items-center gap-2">
                                                    📋 Beschreibung
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
                                                  {/* Zeige Foto-Button wenn Foto in Beschreibung vorhanden */}
                                                  {extractPhotoFromDescription(
                                                    action.description
                                                  ) && (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="mt-3"
                                                      onClick={() => {
                                                        const photoFilename =
                                                          extractPhotoFromDescription(
                                                            action.description
                                                          );
                                                        if (photoFilename) {
                                                          const getApiUrl =
                                                            () => {
                                                              const hostname =
                                                                window.location
                                                                  .hostname;
                                                              if (
                                                                hostname !==
                                                                  "localhost" &&
                                                                hostname !==
                                                                  "127.0.0.1"
                                                              ) {
                                                                return `http://${hostname}:5137`;
                                                              }
                                                              return "http://localhost:5137";
                                                            };
                                                          setSelectedPhoto(
                                                            `${getApiUrl()}/uploads/failure-reports/${photoFilename}`
                                                          );
                                                          setPhotoViewDialogOpen(
                                                            true
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      <Camera className="h-4 w-4 mr-2" />
                                                      Foto vom Failure Report
                                                      ansehen
                                                    </Button>
                                                  )}
                                                </CardContent>
                                              </Card>

                                              {/* Status & Info Grid */}
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Card>
                                                  <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">
                                                      Status ändern
                                                    </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                    <Select
                                                      value={action.status}
                                                      onValueChange={(
                                                        value: Action["status"]
                                                      ) =>
                                                        handleStatusChange(
                                                          action.id,
                                                          value
                                                        )
                                                      }
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="OPEN">
                                                          🔴 Offen
                                                        </SelectItem>
                                                        <SelectItem value="IN_PROGRESS">
                                                          🟡 In Bearbeitung
                                                        </SelectItem>
                                                        <SelectItem value="COMPLETED">
                                                          🟢 Abgeschlossen
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </CardContent>
                                                </Card>

                                                <Card>
                                                  <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">
                                                      Erstellt
                                                    </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                    <div className="space-y-1">
                                                      <p className="text-sm font-medium">
                                                        {action.createdAt}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        von {action.createdBy}
                                                      </p>
                                                    </div>
                                                  </CardContent>
                                                </Card>

                                                {action.completedAt && (
                                                  <Card>
                                                    <CardHeader className="pb-3">
                                                      <CardTitle className="text-sm">
                                                        Abgeschlossen
                                                      </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <p className="text-sm font-medium">
                                                        {action.completedAt}
                                                      </p>
                                                    </CardContent>
                                                  </Card>
                                                )}
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
                                                                  src={file.url}
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
                                                              title={file.name}
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
                                                                        ⚪ Nicht
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

                                              {/* Comment Section */}
                                              {(() => {
                                                const currentUser =
                                                  authService.getCurrentUser();
                                                if (!currentUser) return null;

                                                return (
                                                  <CommentSection
                                                    comments={
                                                      actionComments[
                                                        action.id
                                                      ] || []
                                                    }
                                                    currentUserId={
                                                      currentUser.id
                                                    }
                                                    onAddComment={(text) =>
                                                      handleAddComment(
                                                        action.id,
                                                        text
                                                      )
                                                    }
                                                    onUpdateComment={(
                                                      commentId,
                                                      text
                                                    ) =>
                                                      handleUpdateComment(
                                                        action.id,
                                                        commentId,
                                                        text
                                                      )
                                                    }
                                                    onDeleteComment={(
                                                      commentId
                                                    ) =>
                                                      handleDeleteComment(
                                                        action.id,
                                                        commentId
                                                      )
                                                    }
                                                    isLoading={
                                                      loadingComments[action.id]
                                                    }
                                                  />
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Action bearbeiten" : "Neue Action erstellen"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Ändern Sie die Action-Details"
                : "Erstellen Sie eine neue Action"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Action Details</TabsTrigger>
              <TabsTrigger value="materials">Materialbestellung</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plant">Anlage *</Label>
                    <Select
                      value={currentAction.plant}
                      onValueChange={(value: Action["plant"]) =>
                        setCurrentAction({ ...currentAction, plant: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie eine Anlage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T208">T208</SelectItem>
                        <SelectItem value="T207">T207</SelectItem>
                        <SelectItem value="T700">T700</SelectItem>
                        <SelectItem value="T46">T46</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie *</Label>
                    <Select
                      value={currentAction.category || "ALLGEMEIN"}
                      onValueChange={(value) =>
                        setCurrentAction({
                          ...currentAction,
                          category: value as Action["category"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie eine Kategorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALLGEMEIN">Allgemein</SelectItem>
                        <SelectItem value="RIGMOVE">Rigmove</SelectItem>
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
                      rows={4}
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
                          setCurrentAction({ ...currentAction, status: value })
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
                            dueDate: date
                              ? date.toISOString().split("T")[0]
                              : "",
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
              </ScrollArea>
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
                          <TableHead>MM-Nummer</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead className="w-24">Menge</TableHead>
                          <TableHead className="w-24">Einheit</TableHead>
                          <TableHead className="w-32">Status</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material, index) => (
                          <TableRow key={material.id}>
                            <TableCell>
                              <Input
                                type="text"
                                className="h-9"
                                value={material.mmNumber}
                                onChange={(e) => {
                                  const newMaterials = [...materials];
                                  newMaterials[index].mmNumber = e.target.value;
                                  setMaterials(newMaterials);
                                }}
                                placeholder="MM-Nr."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                className="h-9"
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
                                className="h-9"
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
                                <SelectTrigger className="h-9">
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
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NICHT_BESTELLT">
                                    ⚪ Nicht bestellt
                                  </SelectItem>
                                  <SelectItem value="BESTELLT">
                                    🟡 Bestellt
                                  </SelectItem>
                                  <SelectItem value="UNTERWEGS">
                                    🔵 Unterwegs
                                  </SelectItem>
                                  <SelectItem value="GELIEFERT">
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

          <DialogFooter>
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

      {/* Photo View Dialog */}
      <Dialog open={photoViewDialogOpen} onOpenChange={setPhotoViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Foto vom Failure Report</DialogTitle>
            <DialogDescription>
              Dieses Foto wurde beim Erstellen des Failure Reports aufgenommen
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Failure Report Foto"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhotoViewDialogOpen(false);
                setSelectedPhoto(null);
              }}
            >
              Schließen
            </Button>
            {selectedPhoto && (
              <Button
                onClick={() => {
                  window.open(selectedPhoto, "_blank");
                }}
              >
                In neuem Tab öffnen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionTracker;
