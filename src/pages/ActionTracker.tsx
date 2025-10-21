import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
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

interface Action {
  id: string;
  plant: "T208" | "T207" | "T700" | "T46";
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  const [currentAction, setCurrentAction] = useState<Partial<Action>>({
    plant: "T208",
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

  // Backend laden
  useEffect(() => {
    setIsMounted(true);
    loadActions();

    return () => {
      setIsMounted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.request<ApiAction[]>("/actions");

      const loadedActions: Action[] = response.map((item: ApiAction) => ({
        id: item.id,
        plant: item.plant as Action["plant"],
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
    }
    setExpandedRows(newExpanded);
  };

  const openNewDialog = () => {
    setIsEditMode(false);
    setPendingFiles([]);
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
    setCurrentAction(action);
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

      if (isEditMode && currentAction.id) {
        // Update
        await apiClient.request(`/actions/${currentAction.id}`, {
          method: "PUT",
          body: JSON.stringify({
            plant: currentAction.plant,
            title: currentAction.title,
            description: currentAction.description,
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
            title: currentAction.title,
            description: currentAction.description,
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

  const removeFile = (fileId: string) => {
    setCurrentAction({
      ...currentAction,
      files: currentAction.files?.filter((f) => f.id !== fileId) || [],
    });
  };

  const filteredActions = actions.filter((a) => a.plant === activeTab);

  const getActionStats = (plant: string) => {
    const plantActions = actions.filter((a) => a.plant === plant);
    return {
      total: plantActions.length,
      open: plantActions.filter((a) => a.status === "OPEN").length,
      inProgress: plantActions.filter((a) => a.status === "IN_PROGRESS").length,
      completed: plantActions.filter((a) => a.status === "COMPLETED").length,
    };
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
                  return (
                    <TabsTrigger key={plant} value={plant}>
                      {plant} ({stats.total})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {["T208", "T207", "T700", "T46"].map((plant) => (
                <TabsContent key={plant} value={plant}>
                  {filteredActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Keine Actions</h3>
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
                          {filteredActions.map((action) => (
                            <React.Fragment key={action.id}>
                              <TableRow className="cursor-pointer hover:bg-muted/50">
                                <TableCell onClick={() => toggleRow(action.id)}>
                                  {expandedRows.has(action.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </TableCell>
                                <TableCell
                                  className="font-medium"
                                  onClick={() => toggleRow(action.id)}
                                >
                                  {action.title}
                                </TableCell>
                                <TableCell onClick={() => toggleRow(action.id)}>
                                  <Badge
                                    variant={
                                      action.status === "COMPLETED"
                                        ? "default"
                                        : action.status === "IN_PROGRESS"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {action.status === "OPEN" && "Offen"}
                                    {action.status === "IN_PROGRESS" &&
                                      "In Bearbeitung"}
                                    {action.status === "COMPLETED" &&
                                      "Abgeschlossen"}
                                  </Badge>
                                </TableCell>
                                <TableCell onClick={() => toggleRow(action.id)}>
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
                                <TableCell onClick={() => toggleRow(action.id)}>
                                  {action.assignedTo}
                                </TableCell>
                                <TableCell onClick={() => toggleRow(action.id)}>
                                  {action.dueDate}
                                </TableCell>
                                <TableCell onClick={() => toggleRow(action.id)}>
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
                                      onClick={() => openEditDialog(action)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(action.id)}
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
                                    className="bg-muted/50"
                                  >
                                    <div className="p-4 space-y-4">
                                      <div>
                                        <Label className="text-sm font-semibold">
                                          Beschreibung
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {action.description}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label className="text-sm font-semibold">
                                            Status ändern
                                          </Label>
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
                                            <SelectTrigger className="mt-1">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="OPEN">
                                                Offen
                                              </SelectItem>
                                              <SelectItem value="IN_PROGRESS">
                                                In Bearbeitung
                                              </SelectItem>
                                              <SelectItem value="COMPLETED">
                                                Abgeschlossen
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold">
                                            Erstellt
                                          </Label>
                                          <p className="text-sm mt-2">
                                            {action.createdAt} von{" "}
                                            {action.createdBy}
                                          </p>
                                        </div>
                                        {action.completedAt && (
                                          <div>
                                            <Label className="text-sm font-semibold">
                                              Abgeschlossen am
                                            </Label>
                                            <p className="text-sm mt-2">
                                              {action.completedAt}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {action.files.length > 0 && (
                                        <div>
                                          <Label className="text-sm font-semibold mb-2 block">
                                            Angehängte Dateien (
                                            {action.files.length})
                                          </Label>
                                          <div className="grid grid-cols-6 gap-2">
                                            {action.files.map((file) => (
                                              <div
                                                key={file.id}
                                                className="relative group border rounded-lg p-2 hover:shadow transition"
                                              >
                                                {file.isPhoto ? (
                                                  <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="w-full aspect-square object-cover rounded"
                                                  />
                                                ) : (
                                                  <div className="w-full aspect-square flex items-center justify-center bg-muted rounded">
                                                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                                                  </div>
                                                )}
                                                <p
                                                  className="text-xs truncate mt-1"
                                                  title={file.name}
                                                >
                                                  {file.name}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
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
                      setCurrentAction({ ...currentAction, priority: value })
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
                      <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Zugewiesen an *</Label>
                  <Input
                    id="assignedTo"
                    value={currentAction.assignedTo}
                    onChange={(e) =>
                      setCurrentAction({
                        ...currentAction,
                        assignedTo: e.target.value,
                      })
                    }
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={currentAction.dueDate}
                    onChange={(e) =>
                      setCurrentAction({
                        ...currentAction,
                        dueDate: e.target.value,
                      })
                    }
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
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
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
    </div>
  );
};

export default ActionTracker;
