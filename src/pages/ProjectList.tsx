import React, { useState, useEffect } from "react";
import {
  projectService,
  type Project as BackendProject,
} from "@/services/project.service";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { fileService } from "@/services/file.service";
import type { User } from "@/services/auth.service";
import type { Comment } from "@/components/CommentSection";
import { CommentSection } from "@/components/CommentSection";
import {
  getProjectComments,
  createProjectComment,
  updateProjectComment,
  deleteProjectComment,
} from "@/services/comment.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  User as UserIcon,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  ListTodo,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Anlage = "T208" | "T207" | "T700" | "T46";
type Category = "Mechanisch" | "Elektrisch" | "Anlage";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedUser: string;
  assignedUserId?: string;
  dueDate: string;
  createdAt: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Project {
  id: string;
  name: string;
  anlage: Anlage;
  category: Category;
  status: "Aktiv" | "Abgeschlossen" | "Geplant";
  startDate: string;
  endDate: string;
  description: string;
  budget: number;
  assignedUser: string;
  assignedUserId?: string;
  progress: number;
  notes: string;
  tasks: Task[];
  files: FileAttachment[];
}

// Fallback Demo-Daten
const initialProjects: Project[] = [
  {
    id: "1",
    name: "Produktentwicklung Phase 1",
    anlage: "T208",
    category: "Mechanisch",
    status: "Aktiv",
    startDate: "2025-01-15",
    endDate: "2025-06-30",
    description: "Entwicklung neuer Produktlinie",
    budget: 150000,
    assignedUser: "Max Mustermann",
    progress: 65,
    notes: "Projekt läuft planmäßig. Nächstes Milestone: Q2 Review",
    tasks: [
      {
        id: "t1",
        title: "Technische Zeichnungen erstellen",
        description: "CAD-Zeichnungen für neue Komponenten",
        completed: true,
        assignedUser: "Max Mustermann",
        dueDate: "2025-02-15",
        createdAt: "2025-01-15",
      },
      {
        id: "t2",
        title: "Prototypen testen",
        description: "Erste Tests der Prototypen durchführen",
        completed: false,
        assignedUser: "Anna Schmidt",
        dueDate: "2025-03-20",
        createdAt: "2025-01-20",
      },
    ],
    files: [
      {
        id: "f1",
        name: "technische_spezifikation.pdf",
        type: "application/pdf",
        size: 2048576,
        url: "/files/spec.pdf",
        uploadedAt: "2025-01-20",
        uploadedBy: "Max Mustermann",
      },
    ],
  },
];

export default function AnlagenProjektManagement() {
  // State Management
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedAnlage, setSelectedAnlage] = useState<Anlage>("T208");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTaskUserId, setSelectedTaskUserId] = useState<string>("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Comment Management State
  const [projectComments, setProjectComments] = useState<
    Record<string, Comment[]>
  >({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});

  const [formData, setFormData] = useState<Partial<Project>>({
    name: "",
    anlage: "T208",
    category: "Mechanisch",
    status: "Geplant",
    startDate: "",
    endDate: "",
    description: "",
    budget: 0,
    assignedUser: "",
    progress: 0,
    notes: "",
    tasks: [],
    files: [],
  });

  const [taskFormData, setTaskFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    completed: false,
    assignedUser: "",
    dueDate: "",
  });

  // Delete Confirmation States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"project" | "task" | "file">(
    "project"
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    projectId?: string;
    taskId?: string;
    fileId?: string;
    name?: string;
  }>({});

  const anlagen: Anlage[] = ["T208", "T207", "T700", "T46"];
  const categories: Category[] = ["Mechanisch", "Elektrisch", "Anlage"];

  // Mapping Functions
  const mapBackendStatus = (
    status: string
  ): "Aktiv" | "Abgeschlossen" | "Geplant" => {
    switch (status) {
      case "IN_PROGRESS":
        return "Aktiv";
      case "COMPLETED":
        return "Abgeschlossen";
      case "PLANNED":
      default:
        return "Geplant";
    }
  };

  const mapFrontendStatus = (
    status: string
  ): "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" => {
    switch (status) {
      case "Aktiv":
        return "IN_PROGRESS";
      case "Abgeschlossen":
        return "COMPLETED";
      case "Geplant":
      default:
        return "PLANNED";
    }
  };

  // Note: Backend doesn't support category field yet, so we use frontend values
  const mapFrontendCategory = (
    category: Category
  ): "MECHANICAL" | "ELECTRICAL" | "FACILITY" => {
    switch (category) {
      case "Mechanisch":
        return "MECHANICAL";
      case "Elektrisch":
        return "ELECTRICAL";
      case "Anlage":
        return "FACILITY";
      default:
        return "MECHANICAL";
    }
  };

  // Load data from backend
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parallel laden für bessere Performance
      const [projectResponse, userResponse] = await Promise.all([
        projectService.getProjects({}),
        userService.getAllUsers(),
      ]);

      setUsers(userResponse.data);

      // Map backend projects to frontend format
      const mappedProjects: Project[] = projectResponse.projects.map(
        (p: BackendProject) => ({
          id: p.id,
          name: p.name,
          anlage: p.projectNumber as Anlage,
          category: "Mechanisch" as Category, // Default category since backend doesn't have this field
          status: mapBackendStatus(p.status),
          startDate: p.startDate || "",
          endDate: p.endDate || "",
          description: p.description || "",
          budget: p.totalBudget,
          assignedUser: p.manager
            ? `${p.manager.firstName} ${p.manager.lastName}`
            : "",
          assignedUserId: p.manager?.id,
          progress: p.progress,
          notes: "", // Default empty notes since backend doesn't have this field
          tasks: [], // Tasks will be managed separately via backend API
          files: [], // Files will be managed separately via file service
        })
      );

      setProjects(mappedProjects);

      toast({
        title: "Erfolgreich geladen",
        description: `${mappedProjects.length} Projekte wurden geladen.`,
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Fehler beim Laden der Daten. Verwende Demo-Daten.");
      setProjects(initialProjects);

      toast({
        title: "Fehler",
        description:
          "Daten konnten nicht geladen werden. Demo-Daten werden verwendet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Project CRUD Operations
  const handleCreate = () => {
    setEditingProject(null);
    setSelectedUserId("");
    setFormData({
      name: "",
      anlage: selectedAnlage,
      category: "Mechanisch",
      status: "Geplant",
      startDate: "",
      endDate: "",
      description: "",
      budget: 0,
      assignedUser: "",
      progress: 0,
      notes: "",
      tasks: [],
      files: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setSelectedUserId(project.assignedUserId || "");
    setFormData(project);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    setDeleteType("project");
    setDeleteTarget({ projectId: id, name: project?.name || "Projekt" });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "project" && deleteTarget.projectId) {
        await projectService.deleteProject(deleteTarget.projectId);
        setProjects(projects.filter((p) => p.id !== deleteTarget.projectId));

        toast({
          title: "Projekt gelöscht",
          description: "Das Projekt wurde erfolgreich gelöscht.",
        });
      } else if (
        deleteType === "task" &&
        deleteTarget.projectId &&
        deleteTarget.taskId
      ) {
        const updatedProjects = projects.map((p) => {
          if (p.id === deleteTarget.projectId) {
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== deleteTarget.taskId),
            };
          }
          return p;
        });
        setProjects(updatedProjects);

        toast({
          title: "Aufgabe gelöscht",
          description: "Die Aufgabe wurde erfolgreich gelöscht.",
        });
      } else if (
        deleteType === "file" &&
        deleteTarget.projectId &&
        deleteTarget.fileId
      ) {
        await fileService.deleteFile(deleteTarget.fileId);

        const updatedProjects = projects.map((p) => {
          if (p.id === deleteTarget.projectId) {
            return {
              ...p,
              files: p.files.filter((f) => f.id !== deleteTarget.fileId),
            };
          }
          return p;
        });
        setProjects(updatedProjects);

        toast({
          title: "Datei gelöscht",
          description: "Die Datei wurde erfolgreich gelöscht.",
        });
      }
    } catch (err) {
      console.error(`Failed to delete ${deleteType}:`, err);

      toast({
        title: "Fehler",
        description: `${
          deleteType === "project"
            ? "Projekt"
            : deleteType === "task"
            ? "Aufgabe"
            : "Datei"
        } konnte nicht gelöscht werden.`,
        variant: "destructive",
      });
    }

    setDeleteDialogOpen(false);
    setDeleteTarget({});
  };

  const handleSubmit = async () => {
    // Validierung der Pflichtfelder
    if (!formData.name || !formData.anlage) {
      toast({
        title: "Validierungsfehler",
        description:
          "Bitte füllen Sie alle Pflichtfelder aus (Name und Anlage).",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();

      if (editingProject) {
        // Update existing project
        const updateData = {
          projectNumber: formData.anlage,
          name: formData.name || "",
          description: formData.description,
          status: mapFrontendStatus(formData.status || "Geplant"),
          priority: "NORMAL" as const,
          progress: formData.progress || 0,
          totalBudget: formData.budget || 0,
          spentBudget: 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          category: mapFrontendCategory(formData.category || "Mechanisch"),
          notes: formData.notes,
          managerId: selectedUserId || undefined,
        };

        const updated = await projectService.updateProject(
          editingProject.id,
          updateData
        );

        const mappedProject: Project = {
          id: updated.id,
          name: updated.name,
          anlage: updated.projectNumber as Anlage,
          category: formData.category || "Mechanisch",
          status: mapBackendStatus(updated.status),
          startDate: updated.startDate || "",
          endDate: updated.endDate || "",
          description: updated.description || "",
          budget: updated.totalBudget,
          assignedUser: updated.manager
            ? `${updated.manager.firstName} ${updated.manager.lastName}`
            : "",
          assignedUserId: updated.manager?.id,
          progress: updated.progress,
          notes: formData.notes || "",
          tasks: formData.tasks || [],
          files: formData.files || [],
        };

        setProjects(
          projects.map((p) => (p.id === editingProject.id ? mappedProject : p))
        );

        toast({
          title: "Projekt aktualisiert",
          description: "Das Projekt wurde erfolgreich aktualisiert.",
        });
      } else {
        // Create new project
        const createData = {
          projectNumber: formData.anlage || selectedAnlage,
          name: formData.name || "",
          description: formData.description,
          status: mapFrontendStatus(formData.status || "Geplant"),
          priority: "NORMAL" as const,
          progress: formData.progress || 0,
          totalBudget: formData.budget || 0,
          spentBudget: 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          category: mapFrontendCategory(formData.category || "Mechanisch"),
          notes: formData.notes,
          createdBy: currentUser?.id,
          managerId: selectedUserId || undefined,
        };

        const created = await projectService.createProject(createData);

        const mappedProject: Project = {
          id: created.id,
          name: created.name,
          anlage: created.projectNumber as Anlage,
          category: formData.category || "Mechanisch",
          status: mapBackendStatus(created.status),
          startDate: created.startDate || "",
          endDate: created.endDate || "",
          description: created.description || "",
          budget: created.totalBudget,
          assignedUser: created.manager
            ? `${created.manager.firstName} ${created.manager.lastName}`
            : "",
          assignedUserId: created.manager?.id,
          progress: created.progress,
          notes: formData.notes || "",
          tasks: [],
          files: [],
        };

        setProjects([...projects, mappedProject]);

        toast({
          title: "Projekt erstellt",
          description: "Das Projekt wurde erfolgreich erstellt.",
        });
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to save project:", err);

      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gespeichert werden.",
        variant: "destructive",
      });

      // Fallback to local-only operation
      if (editingProject) {
        setProjects(
          projects.map((p) =>
            p.id === editingProject.id
              ? ({ ...formData, id: p.id } as Project)
              : p
          )
        );
      } else {
        const newProject: Project = {
          ...formData,
          id: Date.now().toString(),
          tasks: [],
          files: [],
        } as Project;
        setProjects([...projects, newProject]);
      }
      setIsDialogOpen(false);
    }
  };

  // Task Management
  const handleOpenTaskDialog = (project: Project, task?: Task) => {
    setSelectedProject(project);
    if (task) {
      setEditingTask(task);
      setTaskFormData(task);
      setSelectedTaskUserId(task.assignedUserId || "");
    } else {
      setEditingTask(null);
      setSelectedTaskUserId("");
      setTaskFormData({
        title: "",
        description: "",
        completed: false,
        assignedUser: "",
        dueDate: "",
      });
    }
    setIsTaskDialogOpen(true);
  };

  const handleSubmitTask = () => {
    if (!selectedProject) return;

    const updatedProjects = projects.map((p) => {
      if (p.id === selectedProject.id) {
        let updatedTasks: Task[];
        if (editingTask) {
          updatedTasks = p.tasks.map((t) =>
            t.id === editingTask.id
              ? ({
                  ...taskFormData,
                  id: t.id,
                  assignedUserId: selectedTaskUserId,
                } as Task)
              : t
          );
        } else {
          const newTask: Task = {
            ...taskFormData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            assignedUserId: selectedTaskUserId,
          } as Task;
          updatedTasks = [...p.tasks, newTask];
        }
        return { ...p, tasks: updatedTasks };
      }
      return p;
    });

    setProjects(updatedProjects);
    setIsTaskDialogOpen(false);

    toast({
      title: editingTask ? "Aufgabe aktualisiert" : "Aufgabe erstellt",
      description: "Die Aufgabe wurde erfolgreich gespeichert.",
    });
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        return { ...p, tasks: updatedTasks };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    setDeleteType("task");
    setDeleteTarget({
      projectId,
      taskId,
      name: task?.title || "Aufgabe",
    });
    setDeleteDialogOpen(true);
  };

  // File Management
  const handleOpenFileDialog = (project: Project) => {
    setSelectedProject(project);
    setUploadingFiles([]);
    setIsFileDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadingFiles(Array.from(files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (!selectedProject || uploadingFiles.length === 0) return;

    try {
      // Upload files to backend
      const uploadPromises = uploadingFiles.map((file) =>
        fileService.uploadFile(file)
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Get current user for uploadedBy field
      const currentUser = authService.getCurrentUser();
      const userName = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : "Unbekannt";

      // Create file attachments from upload results
      const newFiles: FileAttachment[] = uploadResults
        .filter((result) => result.success && result.data)
        .map((result) => ({
          id: result.data!.filename,
          name: result.data!.originalname,
          type: result.data!.mimetype,
          size: result.data!.size,
          url: result.data!.url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userName,
        }));

      // Update project with new files
      const updatedProjects = projects.map((p) => {
        if (p.id === selectedProject.id) {
          return { ...p, files: [...p.files, ...newFiles] };
        }
        return p;
      });

      setProjects(updatedProjects);
      setIsFileDialogOpen(false);
      setUploadingFiles([]);

      toast({
        title: "Dateien hochgeladen",
        description: `${newFiles.length} Datei(en) wurden erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error("Fehler beim Hochladen der Dateien:", error);

      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen der Dateien.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (projectId: string, fileId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const file = project?.files.find((f) => f.id === fileId);
    setDeleteType("file");
    setDeleteTarget({
      projectId,
      fileId,
      name: file?.name || "Datei",
    });
    setDeleteDialogOpen(true);
  };

  // Utility Functions
  const toggleRowExpansion = (projectId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
        // Load comments when expanding row
        if (!projectComments[projectId]) {
          loadComments(projectId);
        }
      }
      return newSet;
    });
  };

  // Load comments for project
  const loadComments = async (projectId: string) => {
    setLoadingComments((prev) => ({ ...prev, [projectId]: true }));
    try {
      const comments = await getProjectComments(projectId);
      setProjectComments((prev) => ({ ...prev, [projectId]: comments }));
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kommentare konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingComments((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Add comment
  const handleAddComment = async (projectId: string, text: string) => {
    const newComment = await createProjectComment(projectId, text);
    setProjectComments((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), newComment],
    }));
  };

  // Update comment
  const handleUpdateComment = async (
    projectId: string,
    commentId: string,
    text: string
  ) => {
    const updatedComment = await updateProjectComment(
      projectId,
      commentId,
      text
    );
    setProjectComments((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map((c) =>
        c.id === commentId ? updatedComment : c
      ),
    }));
  };

  // Delete comment
  const handleDeleteComment = async (projectId: string, commentId: string) => {
    await deleteProjectComment(projectId, commentId);
    setProjectComments((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((c) => c.id !== commentId),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aktiv":
        return "bg-green-500";
      case "Abgeschlossen":
        return "bg-blue-500";
      case "Geplant":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case "Mechanisch":
        return "bg-orange-500";
      case "Elektrisch":
        return "bg-purple-500";
      case "Anlage":
        return "bg-cyan-500";
      default:
        return "bg-gray-500";
    }
  };

  // Gantt-Diagramm Helper
  const calculateGanttData = (project: Project) => {
    const today = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    // Gesamtdauer in Tagen
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Verstrichene Tage
    const elapsedDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Prozentsatz der verstrichenen Zeit
    const timeProgress = Math.max(
      0,
      Math.min(100, (elapsedDays / totalDays) * 100)
    );

    // Status basierend auf Vergleich von Zeit und Fortschritt
    const isOnTrack = project.progress >= timeProgress - 10; // 10% Toleranz
    const isDelayed = project.progress < timeProgress - 10;
    const isAhead = project.progress > timeProgress + 10;

    return {
      totalDays,
      elapsedDays,
      timeProgress: Math.round(timeProgress),
      isOnTrack,
      isDelayed,
      isAhead,
      daysRemaining: totalDays - elapsedDays,
    };
  };

  const getFilteredProjects = (anlage: Anlage) => {
    return projects.filter((project) => {
      const matchesAnlage = project.anlage === anlage;
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      const matchesUser =
        userFilter === "all" || project.assignedUser === userFilter;
      const matchesCategory =
        categoryFilter === "all" || project.category === categoryFilter;
      const matchesSearch =
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesAnlage &&
        matchesStatus &&
        matchesUser &&
        matchesCategory &&
        matchesSearch
      );
    });
  };

  const getTotalBudget = (anlage: Anlage) => {
    return getFilteredProjects(anlage).reduce(
      (sum, project) => sum + project.budget,
      0
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="w-full p-6 space-y-6 bg-background">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Projekte...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Anlagen-Projekt-Management</h1>
              <p className="text-muted-foreground">
                Verwalten Sie Projekte, Aufgaben und Dateien für alle Anlagen
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" />
                Aktualisieren
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Neues Projekt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProject
                        ? "Projekt bearbeiten"
                        : "Neues Projekt erstellen"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProject
                        ? "Ändern Sie die Projektdetails."
                        : "Erstellen Sie ein neues Projekt."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                      <Label htmlFor="anlage">Anlage</Label>
                      <Select
                        value={formData.anlage}
                        onValueChange={(value: Anlage) =>
                          setFormData({ ...formData, anlage: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Anlage wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {anlagen.map((anlage) => (
                            <SelectItem key={anlage} value={anlage}>
                              {anlage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Kategorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: Category) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Projektname</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="z.B. Produktentwicklung Phase 1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(
                            value: "Aktiv" | "Abgeschlossen" | "Geplant"
                          ) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Geplant">Geplant</SelectItem>
                            <SelectItem value="Aktiv">Aktiv</SelectItem>
                            <SelectItem value="Abgeschlossen">
                              Abgeschlossen
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="assignedUser">Zugewiesener User</Label>
                        <Select
                          value={selectedUserId}
                          onValueChange={(value: string) => {
                            setSelectedUserId(value);
                            const user = users.find((u) => u.id === value);
                            if (user) {
                              setFormData({
                                ...formData,
                                assignedUser: `${user.firstName} ${user.lastName}`,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="User wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((user) => {
                                // Admins und Manager können immer ausgewählt werden
                                if (!user.assignedPlant) return true;
                                // User muss zur ausgewählten Anlage gehören
                                return user.assignedPlant === formData.anlage;
                              })
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                  {user.assignedPlant &&
                                    ` (${user.assignedPlant})`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">Startdatum</Label>
                        <DatePicker
                          date={
                            formData.startDate
                              ? new Date(formData.startDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFormData({
                              ...formData,
                              startDate: date
                                ? date.toISOString().split("T")[0]
                                : "",
                            })
                          }
                          placeholder="Startdatum wählen"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">Enddatum</Label>
                        <DatePicker
                          date={
                            formData.endDate
                              ? new Date(formData.endDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFormData({
                              ...formData,
                              endDate: date
                                ? date.toISOString().split("T")[0]
                                : "",
                            })
                          }
                          placeholder="Enddatum wählen"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="budget">Budget (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={formData.budget}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              budget: Number(e.target.value),
                            })
                          }
                          placeholder="z.B. 150000"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="progress">Fortschritt (%)</Label>
                        <Input
                          id="progress"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.progress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progress: Number(e.target.value),
                            })
                          }
                          placeholder="0-100"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Kurze Projektbeschreibung"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notizen</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Zusätzliche Informationen"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingProject ? "Speichern" : "Erstellen"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Task Dialog */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTask
                    ? "Aufgabe bearbeiten"
                    : "Neue Aufgabe erstellen"}
                </DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Aufgabe für das Projekt
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="taskTitle">Aufgabentitel</Label>
                  <Input
                    id="taskTitle"
                    value={taskFormData.title}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="z.B. Technische Zeichnungen erstellen"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taskDescription">Beschreibung</Label>
                  <Textarea
                    id="taskDescription"
                    value={taskFormData.description}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Detaillierte Beschreibung der Aufgabe"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taskUser">Zugewiesen an</Label>
                    <Select
                      value={selectedTaskUserId}
                      onValueChange={(value: string) => {
                        setSelectedTaskUserId(value);
                        const user = users.find((u) => u.id === value);
                        if (user) {
                          setTaskFormData({
                            ...taskFormData,
                            assignedUser: `${user.firstName} ${user.lastName}`,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="User wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user) => {
                            // Admins und Manager können immer ausgewählt werden
                            if (!user.assignedPlant) return true;
                            // User muss zur Anlage des ausgewählten Projekts gehören
                            return (
                              user.assignedPlant === selectedProject?.anlage
                            );
                          })
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                              {user.assignedPlant && ` (${user.assignedPlant})`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taskDueDate">Fälligkeitsdatum</Label>
                    <Input
                      id="taskDueDate"
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) =>
                        setTaskFormData({
                          ...taskFormData,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsTaskDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSubmitTask}>
                  {editingTask ? "Speichern" : "Erstellen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* File Upload Dialog */}
          <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Dateien hochladen</DialogTitle>
                <DialogDescription>
                  Laden Sie Dateien und Bilder für dieses Projekt hoch
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fileUpload">Dateien auswählen</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unterstützte Formate: Bilder, PDF, Word, Excel, Text
                  </p>
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Ausgewählte Dateien:</Label>
                    <div className="border rounded-md p-2 space-y-2">
                      {uploadingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsFileDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleUploadFiles}
                  disabled={uploadingFiles.length === 0}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Hochladen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <span className="font-semibold">Filter</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Suche</Label>
                  <Input
                    placeholder="Projekt suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="Geplant">Geplant</SelectItem>
                      <SelectItem value="Aktiv">Aktiv</SelectItem>
                      <SelectItem value="Abgeschlossen">
                        Abgeschlossen
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kategorien</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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
            value={selectedAnlage}
            onValueChange={(value) => setSelectedAnlage(value as Anlage)}
          >
            <TabsList className="grid w-full grid-cols-4">
              {anlagen.map((anlage) => (
                <TabsTrigger key={anlage} value={anlage}>
                  {anlage}
                  <Badge variant="secondary" className="ml-2">
                    {getFilteredProjects(anlage).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {anlagen.map((anlage) => (
              <TabsContent key={anlage} value={anlage} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Anlage {anlage}</CardTitle>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Gesamt-Budget
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(getTotalBudget(anlage))}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead className="w-[50px]">Nr.</TableHead>
                            <TableHead>Projektname</TableHead>
                            <TableHead>Kategorie</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Aufgaben</TableHead>
                            <TableHead>Dateien</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">
                              Fortschritt
                            </TableHead>
                            <TableHead className="text-right">
                              Aktionen
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredProjects(anlage).length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={11}
                                className="text-center text-muted-foreground"
                              >
                                Keine Projekte gefunden
                              </TableCell>
                            </TableRow>
                          ) : (
                            getFilteredProjects(anlage).map(
                              (project, index) => {
                                const isExpanded = expandedRows.has(project.id);
                                return (
                                  <React.Fragment key={project.id}>
                                    {/* Hauptzeile */}
                                    <TableRow className="hover:bg-muted/50">
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            toggleRowExpansion(project.id)
                                          }
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TableCell>
                                      <TableCell>
                                        <span className="font-medium text-muted-foreground">
                                          {index + 1}
                                        </span>
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {project.name}
                                        {project.description && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {project.description.substring(
                                              0,
                                              50
                                            )}
                                            {project.description.length > 50 &&
                                              "..."}
                                          </p>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={getCategoryColor(
                                            project.category
                                          )}
                                        >
                                          {project.category}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={getStatusColor(
                                            project.status
                                          )}
                                        >
                                          {project.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">
                                            {project.assignedUser ||
                                              "Nicht zugewiesen"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7"
                                          onClick={() =>
                                            handleOpenTaskDialog(project)
                                          }
                                        >
                                          <ListTodo className="h-3 w-3 mr-1" />
                                          {
                                            project.tasks.filter(
                                              (t) => t.completed
                                            ).length
                                          }
                                          /{project.tasks.length}
                                        </Button>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7"
                                          onClick={() =>
                                            handleOpenFileDialog(project)
                                          }
                                        >
                                          <FileText className="h-3 w-3 mr-1" />
                                          {project.files.length}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(project.budget)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="w-full max-w-[100px] bg-secondary rounded-full h-2">
                                            <div
                                              className="bg-primary h-2 rounded-full transition-all"
                                              style={{
                                                width: `${project.progress}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="text-sm font-medium min-w-[3ch]">
                                            {project.progress}%
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEdit(project)}
                                            title="Projekt bearbeiten"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              handleDelete(project.id)
                                            }
                                            title="Projekt löschen"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>

                                    {/* Erweiterte Detailzeile */}
                                    {isExpanded && (
                                      <TableRow>
                                        <TableCell
                                          colSpan={10}
                                          className="p-0 bg-muted/30"
                                        >
                                          <div className="p-6 space-y-6">
                                            {/* Projektinformationen */}
                                            <div className="grid grid-cols-2 gap-6">
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Projektinformationen
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                  {project.description && (
                                                    <div>
                                                      <p className="text-xs font-medium text-muted-foreground">
                                                        Beschreibung
                                                      </p>
                                                      <p className="text-sm mt-1">
                                                        {project.description}
                                                      </p>
                                                    </div>
                                                  )}
                                                  <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                      <p className="text-xs font-medium text-muted-foreground">
                                                        Startdatum
                                                      </p>
                                                      <p className="text-sm mt-1">
                                                        {project.startDate
                                                          ? new Date(
                                                              project.startDate
                                                            ).toLocaleDateString(
                                                              "de-DE"
                                                            )
                                                          : "Nicht gesetzt"}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-xs font-medium text-muted-foreground">
                                                        Enddatum
                                                      </p>
                                                      <p className="text-sm mt-1">
                                                        {project.endDate
                                                          ? new Date(
                                                              project.endDate
                                                            ).toLocaleDateString(
                                                              "de-DE"
                                                            )
                                                          : "Nicht gesetzt"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  {project.notes && (
                                                    <div>
                                                      <p className="text-xs font-medium text-muted-foreground">
                                                        Notizen
                                                      </p>
                                                      <p className="text-sm mt-1">
                                                        {project.notes}
                                                      </p>
                                                    </div>
                                                  )}

                                                  {/* Mini Gantt Timeline */}
                                                  {project.startDate &&
                                                    project.endDate &&
                                                    (() => {
                                                      const gantt =
                                                        calculateGanttData(
                                                          project
                                                        );
                                                      return (
                                                        <div className="pt-3 border-t">
                                                          <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                              Projektverlauf
                                                            </p>
                                                            <span
                                                              className={`text-xs font-medium ${
                                                                gantt.isDelayed
                                                                  ? "text-red-600"
                                                                  : gantt.isAhead
                                                                  ? "text-green-600"
                                                                  : "text-blue-600"
                                                              }`}
                                                            >
                                                              {gantt.isDelayed
                                                                ? "⚠️ Verzögert"
                                                                : gantt.isAhead
                                                                ? "✓ Vor Plan"
                                                                : "→ Im Plan"}
                                                            </span>
                                                          </div>

                                                          {/* Timeline Bar */}
                                                          <div className="relative h-6 bg-muted rounded-md overflow-hidden">
                                                            {/* Fortschrittsbalken */}
                                                            <div
                                                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                                              style={{
                                                                width: `${project.progress}%`,
                                                              }}
                                                            />
                                                            {/* Zeit-Marker (Heute) */}
                                                            <div
                                                              className="absolute top-0 h-full w-0.5 bg-red-500"
                                                              style={{
                                                                left: `${gantt.timeProgress}%`,
                                                              }}
                                                            >
                                                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                                                            </div>
                                                            {/* Prozentanzeige */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                              <span className="text-xs font-bold text-white drop-shadow-md">
                                                                {
                                                                  project.progress
                                                                }
                                                                %
                                                              </span>
                                                            </div>
                                                          </div>

                                                          {/* Legende */}
                                                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                                            <span>
                                                              {new Date(
                                                                project.startDate
                                                              ).toLocaleDateString(
                                                                "de-DE",
                                                                {
                                                                  day: "2-digit",
                                                                  month:
                                                                    "short",
                                                                }
                                                              )}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                              <span className="flex items-center gap-1">
                                                                <span className="w-3 h-3 bg-blue-500 rounded-sm" />
                                                                Fortschritt
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                <span className="w-0.5 h-3 bg-red-500" />
                                                                Heute
                                                              </span>
                                                            </div>
                                                            <span>
                                                              {new Date(
                                                                project.endDate
                                                              ).toLocaleDateString(
                                                                "de-DE",
                                                                {
                                                                  day: "2-digit",
                                                                  month:
                                                                    "short",
                                                                }
                                                              )}
                                                            </span>
                                                          </div>

                                                          {/* Zusätzliche Info */}
                                                          <div className="mt-2 text-xs text-muted-foreground">
                                                            {gantt.daysRemaining >
                                                            0 ? (
                                                              <span>
                                                                📅 Noch{" "}
                                                                {
                                                                  gantt.daysRemaining
                                                                }{" "}
                                                                Tage bis zum
                                                                Abschluss
                                                              </span>
                                                            ) : gantt.daysRemaining ===
                                                              0 ? (
                                                              <span className="text-orange-600 font-medium">
                                                                ⏰ Projekt endet
                                                                heute!
                                                              </span>
                                                            ) : (
                                                              <span className="text-red-600 font-medium">
                                                                ⚠️ Projekt
                                                                überfällig (
                                                                {Math.abs(
                                                                  gantt.daysRemaining
                                                                )}{" "}
                                                                Tage)
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })()}
                                                </CardContent>
                                              </Card>

                                              {/* Aufgaben */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                      <ListTodo className="h-4 w-4" />
                                                      Aufgaben (
                                                      {project.tasks.length})
                                                    </CardTitle>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-7"
                                                      onClick={() =>
                                                        handleOpenTaskDialog(
                                                          project
                                                        )
                                                      }
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" />
                                                      Neu
                                                    </Button>
                                                  </div>
                                                </CardHeader>
                                                <CardContent>
                                                  {project.tasks.length ===
                                                  0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                      Keine Aufgaben vorhanden
                                                    </p>
                                                  ) : (
                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                      {project.tasks.map(
                                                        (task) => (
                                                          <div
                                                            key={task.id}
                                                            className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 group"
                                                          >
                                                            <Checkbox
                                                              checked={
                                                                task.completed
                                                              }
                                                              onCheckedChange={() =>
                                                                handleToggleTask(
                                                                  project.id,
                                                                  task.id
                                                                )
                                                              }
                                                              className="mt-0.5"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                              <p
                                                                className={`text-sm font-medium ${
                                                                  task.completed
                                                                    ? "line-through text-muted-foreground"
                                                                    : ""
                                                                }`}
                                                              >
                                                                {task.title}
                                                              </p>
                                                              {task.description && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                  {
                                                                    task.description
                                                                  }
                                                                </p>
                                                              )}
                                                              <div className="flex items-center gap-3 mt-1">
                                                                {task.assignedUser && (
                                                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <UserIcon className="h-3 w-3" />
                                                                    {
                                                                      task.assignedUser
                                                                    }
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
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() =>
                                                                  handleOpenTaskDialog(
                                                                    project,
                                                                    task
                                                                  )
                                                                }
                                                              >
                                                                <Pencil className="h-3 w-3" />
                                                              </Button>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() =>
                                                                  handleDeleteTask(
                                                                    project.id,
                                                                    task.id
                                                                  )
                                                                }
                                                              >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
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

                                            {/* Dateien */}
                                            <Card>
                                              <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Dateien (
                                                    {project.files.length})
                                                  </CardTitle>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7"
                                                    onClick={() =>
                                                      handleOpenFileDialog(
                                                        project
                                                      )
                                                    }
                                                  >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Hochladen
                                                  </Button>
                                                </div>
                                              </CardHeader>
                                              <CardContent>
                                                {project.files.length === 0 ? (
                                                  <p className="text-sm text-muted-foreground text-center py-4">
                                                    Keine Dateien vorhanden
                                                  </p>
                                                ) : (
                                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {project.files.map(
                                                      (file) => (
                                                        <Card
                                                          key={file.id}
                                                          className="group hover:shadow-md transition-shadow"
                                                        >
                                                          <CardContent className="p-3">
                                                            <div className="flex items-start justify-between gap-2">
                                                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                {getFileIcon(
                                                                  file.type
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                  <p className="text-sm font-medium truncate">
                                                                    {file.name}
                                                                  </p>
                                                                  <p className="text-xs text-muted-foreground">
                                                                    {formatFileSize(
                                                                      file.size
                                                                    )}
                                                                  </p>
                                                                </div>
                                                              </div>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() =>
                                                                  handleDeleteFile(
                                                                    project.id,
                                                                    file.id
                                                                  )
                                                                }
                                                              >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                              </Button>
                                                            </div>
                                                            <div className="mt-2 text-xs text-muted-foreground">
                                                              <p>
                                                                Von:{" "}
                                                                {
                                                                  file.uploadedBy
                                                                }
                                                              </p>
                                                              <p>
                                                                {new Date(
                                                                  file.uploadedAt
                                                                ).toLocaleDateString(
                                                                  "de-DE"
                                                                )}
                                                              </p>
                                                            </div>
                                                          </CardContent>
                                                        </Card>
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>

                                            {/* Comment Section */}
                                            {(() => {
                                              const currentUser =
                                                authService.getCurrentUser();
                                              if (!currentUser) return null;

                                              return (
                                                <CommentSection
                                                  comments={
                                                    projectComments[
                                                      project.id
                                                    ] || []
                                                  }
                                                  currentUserId={currentUser.id}
                                                  onAddComment={(text) =>
                                                    handleAddComment(
                                                      project.id,
                                                      text
                                                    )
                                                  }
                                                  onUpdateComment={(
                                                    commentId,
                                                    text
                                                  ) =>
                                                    handleUpdateComment(
                                                      project.id,
                                                      commentId,
                                                      text
                                                    )
                                                  }
                                                  onDeleteComment={(
                                                    commentId
                                                  ) =>
                                                    handleDeleteComment(
                                                      project.id,
                                                      commentId
                                                    )
                                                  }
                                                  isLoading={
                                                    loadingComments[project.id]
                                                  }
                                                />
                                              );
                                            })()}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                                );
                              }
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === "project" && "Projekt löschen"}
              {deleteType === "task" && "Aufgabe löschen"}
              {deleteType === "file" && "Datei löschen"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget.name}"
              </span>{" "}
              wirklich löschen?
              {deleteType === "project" && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Alle zugehörigen Aufgaben und Dateien werden ebenfalls
                  gelöscht.
                </span>
              )}
              <span className="block mt-2">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
