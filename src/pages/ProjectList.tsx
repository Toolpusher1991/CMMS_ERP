import React, { useState, useEffect } from "react";
import {
  projectService,
  type Project as BackendProject,
  type ProjectTask,
} from "@/services/project.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/user.service";
import { useRigs } from "@/hooks/useRigs";
import { fileService } from "@/services/file.service";
import { apiClient } from "@/services/api";
import type { User } from "@/services/auth.service";
import type { Comment } from "@/components/CommentSection";
import { CommentSection } from "@/components/CommentSection";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import * as Sentry from "@sentry/react";
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
  CheckCircle2,
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

type Anlage = string;
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
  checkedOutBy?: string | null;
  checkedOutByName?: string | null;
  checkedOutAt?: string | null;
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

interface ProjectListProps {
  initialProjectId?: string;
  showOnlyMyProjects?: boolean;
  onOpenFlow?: (projectId: string) => void;
}

export default function AnlagenProjektManagement({
  initialProjectId,
  showOnlyMyProjects = false,
  onOpenFlow,
}: ProjectListProps) {
  // State Management
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
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
  const [selectedAnlage, setSelectedAnlage] = useState<Anlage>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTaskUserId, setSelectedTaskUserId] = useState<string>("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { rigs: availableRigs } = useRigs();

  // Comment Management State
  const [projectComments, setProjectComments] = useState<
    Record<string, Comment[]>
  >({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});

  const [formData, setFormData] = useState<Partial<Project>>({
    name: "",
    anlage: "",
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
    "project",
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    projectId?: string;
    taskId?: string;
    fileId?: string;
    name?: string;
  }>({});

  const categories: Category[] = ["Mechanisch", "Elektrisch", "Anlage"];

  // Helper function to get user display name from ID or email
  const getUserDisplayName = (userIdOrEmail: string): string => {
    if (!userIdOrEmail) return "Nicht zugewiesen";

    // Check if it's already a formatted name (contains space)
    if (userIdOrEmail.includes(" ") && !userIdOrEmail.includes("@")) {
      return userIdOrEmail;
    }

    // Try to find user by ID first
    const userById = users.find((u) => u.id === userIdOrEmail);
    if (userById) {
      return `${userById.firstName} ${userById.lastName}`;
    }

    // Try to find user by email
    const userByEmail = users.find((u) => u.email === userIdOrEmail);
    if (userByEmail) {
      return `${userByEmail.firstName} ${userByEmail.lastName}`;
    }

    // If it looks like an email, show just the email prefix
    if (userIdOrEmail.includes("@")) {
      return userIdOrEmail.split("@")[0];
    }

    // Fallback: return as-is but truncate if it's a UUID
    if (userIdOrEmail.length > 20) {
      return "Unbekannter User";
    }

    return userIdOrEmail;
  };

  // Mapping Functions
  const mapBackendStatus = (
    status: string,
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
    status: string,
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

  // Category mapping functions for backend communication
  const mapFrontendCategory = (
    category: Category,
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

  const mapBackendCategory = (
    backendCategory: "MECHANICAL" | "ELECTRICAL" | "FACILITY",
  ): Category => {
    switch (backendCategory) {
      case "MECHANICAL":
        return "Mechanisch";
      case "ELECTRICAL":
        return "Elektrisch";
      case "FACILITY":
        return "Anlage";
      default:
        return "Mechanisch";
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
      const mappedProjects: Project[] = await Promise.all(
        projectResponse.projects.map(async (p: BackendProject) => {
          // Load files for each project
          let projectFiles: FileAttachment[] = [];
          try {
            const filesResponse = await apiClient.get<{
              success: boolean;
              data: Array<{
                id: string;
                filename: string;
                originalName: string;
                fileType: string;
                fileSize: number;
                filePath: string;
                uploadedBy: string;
                uploadedAt: string;
                checkedOutBy?: string | null;
                checkedOutByName?: string | null;
                checkedOutAt?: string | null;
              }>;
            }>(`/projects/${p.id}/files`);

            if (filesResponse.success && filesResponse.data) {
              projectFiles = filesResponse.data.map((f) => ({
                id: f.id,
                name: f.originalName,
                type: f.fileType,
                size: f.fileSize,
                url: f.filePath,
                uploadedAt: f.uploadedAt,
                uploadedBy: f.uploadedBy || "Unbekannt",
                checkedOutBy: f.checkedOutBy,
                checkedOutByName: f.checkedOutByName,
                checkedOutAt: f.checkedOutAt,
              }));
            }
          } catch (error) {
            console.error(`Failed to load files for project ${p.id}:`, error);
          }

          return {
            id: p.id,
            name: p.name,
            anlage: p.plant || p.projectNumber.match(/^(T\d+)/)?.[1] || "", // Use plant field or extract from projectNumber
            category: mapBackendCategory(p.category || "MECHANICAL"), // Map backend category to frontend
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
            tasks: (p.tasks || []).map((t: ProjectTask) => ({
              id: t.id,
              title: t.title,
              description: t.description || "",
              completed: t.status === "DONE",
              assignedUser: t.assignedTo || "", // Use assignedTo string field directly
              assignedUserId: t.assignedTo || "", // Use assignedTo as ID fallback
              dueDate: t.dueDate || "",
              createdAt: t.createdAt,
            })), // Map backend tasks to frontend format
            files: projectFiles, // Load files from backend
          };
        }),
      );

      setProjects(mappedProjects);

      toast({
        variant: "success" as const,
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
  // Set default selected anlage when rigs load
  useEffect(() => {
    if (availableRigs.length > 0 && !selectedAnlage) {
      setSelectedAnlage(availableRigs[0].name);
    }
  }, [availableRigs]);

  useEffect(() => {
    loadData();

    // Set user filter to current user if showOnlyMyProjects is true
    if (showOnlyMyProjects && currentUser) {
      setUserFilter(currentUser.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyMyProjects]);

  // Expand row if initialProjectId is provided
  useEffect(() => {
    if (initialProjectId && projects.length > 0) {
      const projectExists = projects.find((p) => p.id === initialProjectId);
      if (projectExists) {
        // Switch to the correct tab (Anlage)
        setSelectedAnlage(projectExists.anlage);

        setExpandedRows(new Set([initialProjectId]));
        loadComments(initialProjectId);

        // Scroll to the project after a short delay
        setTimeout(() => {
          const element = document.getElementById(
            `project-${initialProjectId}`,
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId, projects]);

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

  const handleToggleComplete = async (project: Project) => {
    try {
      const newStatus =
        project.status === "Abgeschlossen" ? "Aktiv" : "Abgeschlossen";
      const newProgress =
        newStatus === "Abgeschlossen" ? 100 : project.progress;

      // Map German status to English for API
      const apiStatus =
        newStatus === "Abgeschlossen" ? "COMPLETED" : "IN_PROGRESS";

      await projectService.updateProject(project.id, {
        status: apiStatus,
        progress: newProgress,
      });

      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? { ...p, status: newStatus, progress: newProgress }
            : p,
        ),
      );

      toast({
        variant: "success" as const,
        title:
          newStatus === "Abgeschlossen"
            ? "Projekt abgeschlossen"
            : "Projekt reaktiviert",
        description: `${project.name} wurde als ${newStatus} markiert.`,
      });
    } catch (err) {
      console.error("Failed to toggle project completion:", err);
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "project" && deleteTarget.projectId) {
        await projectService.deleteProject(deleteTarget.projectId);
        setProjects(projects.filter((p) => p.id !== deleteTarget.projectId));

        toast({
          variant: "success" as const,
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
          variant: "success" as const,
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
          variant: "success" as const,
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

      if (editingProject) {
        // Update existing project
        const updateData = {
          // Keep existing project number, don't change it
          // projectNumber: formData.anlage,
          name: formData.name || "",
          description: formData.description,
          status: mapFrontendStatus(formData.status || "Geplant"),
          priority: "NORMAL" as const,
          progress: formData.progress || 0,
          totalBudget: formData.budget || 0,
          spentBudget: 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          category: mapFrontendCategory(formData.category || "Mechanisch"), // Now enabled with backend support
          notes: formData.notes,
          managerId: selectedUserId || undefined,
        };

        const updated = await projectService.updateProject(
          editingProject.id,
          updateData,
        );

        const mappedProject: Project = {
          id: updated.id,
          name: updated.name,
          anlage: (updated.plant || updated.projectNumber) as Anlage, // Use plant field, fallback to projectNumber
          category: mapBackendCategory(updated.category || "MECHANICAL"),
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
          projects.map((p) => (p.id === editingProject.id ? mappedProject : p)),
        );

        toast({
          variant: "success" as const,
          title: "Projekt aktualisiert",
          description: "Das Projekt wurde erfolgreich aktualisiert.",
        });
      } else {
        // Create new project
        // Generate unique project number
        const baseNumber = formData.anlage || selectedAnlage;
        const timestamp = Date.now().toString();
        const uniqueProjectNumber = `${baseNumber}-${timestamp}`;

        const createData = {
          projectNumber: uniqueProjectNumber,
          name: formData.name || "",
          description: formData.description,
          status: mapFrontendStatus(formData.status || "Geplant"),
          priority: "NORMAL" as const,
          progress: formData.progress || 0,
          totalBudget: formData.budget || 0,
          spentBudget: 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          plant: baseNumber, // Add plant field for backend
          category: mapFrontendCategory(formData.category || "Mechanisch"), // Now enabled with backend support
          notes: formData.notes,
          createdBy: currentUser?.id,
          managerId: selectedUserId || undefined,
        };

        const created = await projectService.createProject(createData);

        const mappedProject: Project = {
          id: created.id,
          name: created.name,
          anlage: (created.plant || created.projectNumber) as Anlage, // Use plant field, fallback to projectNumber
          category: mapBackendCategory(created.category || "MECHANICAL"),
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
          variant: "success" as const,
          title: "Projekt erstellt",
          description: "Das Projekt wurde erfolgreich erstellt.",
        });
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to save project:", err);

      // Report to Sentry for production debugging
      Sentry.captureException(err, {
        tags: {
          component: "ProjectList",
          operation: editingProject ? "updateProject" : "createProject",
        },
        extra: {
          formData,
          selectedUserId,
          selectedAnlage,
          editingProject: !!editingProject,
        },
      });

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
              : p,
          ),
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

  const handleSubmitTask = async () => {
    if (!selectedProject) return;

    try {
      let backendTask: ProjectTask;

      if (editingTask) {
        // Update existing task in backend
        backendTask = await projectService.updateTask(
          selectedProject.id,
          editingTask.id,
          {
            title: taskFormData.title || "",
            description: taskFormData.description || "",
            status: taskFormData.completed ? "DONE" : "TODO",
            assignedTo: selectedTaskUserId || undefined,
            dueDate: taskFormData.dueDate || undefined,
          },
        );
      } else {
        // Create new task in backend
        backendTask = await projectService.createTask(selectedProject.id, {
          title: taskFormData.title || "",
          description: taskFormData.description || "",
          status: taskFormData.completed ? "DONE" : "TODO",
          assignedTo: selectedTaskUserId || undefined,
          dueDate: taskFormData.dueDate || undefined,
        });
      }

      // Update local state with backend response
      const updatedProjects = projects.map((p) => {
        if (p.id === selectedProject.id) {
          let updatedTasks: Task[];
          if (editingTask) {
            updatedTasks = p.tasks.map((t) =>
              t.id === editingTask.id
                ? ({
                    id: backendTask.id,
                    title: backendTask.title,
                    description: backendTask.description || "",
                    completed: backendTask.status === "DONE",
                    assignedUser:
                      backendTask.assignedTo || taskFormData.assignedUser || "",
                    assignedUserId:
                      backendTask.assignedTo || selectedTaskUserId || "",
                    dueDate: backendTask.dueDate || "",
                    createdAt: backendTask.createdAt,
                  } as Task)
                : t,
            );
          } else {
            const newTask: Task = {
              id: backendTask.id,
              title: backendTask.title,
              description: backendTask.description || "",
              completed: backendTask.status === "DONE",
              assignedUser:
                backendTask.assignedTo || taskFormData.assignedUser || "",
              assignedUserId:
                backendTask.assignedTo || selectedTaskUserId || "",
              dueDate: backendTask.dueDate || "",
              createdAt: backendTask.createdAt,
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
        variant: "success" as const,
        title: editingTask ? "Aufgabe aktualisiert" : "Aufgabe erstellt",
        description: "Die Aufgabe wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error("Failed to save task:", error);
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (projectId: string, taskId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      const task = project?.tasks.find((t) => t.id === taskId);

      if (!task) return;

      // Update task status in backend
      const updatedBackendTask = await projectService.updateTask(
        projectId,
        taskId,
        {
          status: task.completed ? "TODO" : "DONE",
        },
      );

      // Update local state
      const updatedProjects = projects.map((p) => {
        if (p.id === projectId) {
          const updatedTasks = p.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completed: updatedBackendTask.status === "DONE" }
              : t,
          );
          return { ...p, tasks: updatedTasks };
        }
        return p;
      });
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast({
        title: "Fehler",
        description: "Der Aufgabenstatus konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
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
      // Get current user for uploadedBy field
      const userName = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : "Unbekannt";

      // Upload files to backend and create file records
      const uploadPromises = uploadingFiles.map(async (file) => {
        // 1. Upload file to storage
        const uploadResult = await fileService.uploadFile(file);

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // 2. Create file record in database
        const fileRecord = await apiClient.post<{
          success: boolean;
          data: { id: string };
        }>(`/projects/${selectedProject.id}/files`, {
          filename: uploadResult.data.filename,
          originalName: uploadResult.data.originalname,
          fileType: uploadResult.data.mimetype,
          fileSize: uploadResult.data.size,
          filePath: uploadResult.data.url,
          uploadedBy: userName,
        });

        return {
          id: fileRecord.data.id,
          name: uploadResult.data.originalname,
          type: uploadResult.data.mimetype,
          size: uploadResult.data.size,
          url: uploadResult.data.url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userName,
          checkedOutBy: null,
          checkedOutByName: null,
          checkedOutAt: null,
        };
      });

      const newFiles: FileAttachment[] = await Promise.all(uploadPromises);

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
        variant: "success" as const,
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

  const handleCheckoutFile = async (projectId: string, fileId: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          id: string;
          checkedOutBy: string;
          checkedOutByName: string;
          checkedOutAt: string;
        };
      }>(`/projects/${projectId}/files/${fileId}/checkout`);

      if (response.success && response.data) {
        // Update local state with checked out file
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      checkedOutBy: response.data.checkedOutBy,
                      checkedOutByName: response.data.checkedOutByName,
                      checkedOutAt: response.data.checkedOutAt,
                    }
                  : f,
              ),
            };
          }
          return p;
        });

        setProjects(updatedProjects);

        toast({
          variant: "success" as const,
          title: "Datei ausgecheckt",
          description: "Die Datei wurde erfolgreich ausgecheckt.",
        });
      }
    } catch (error: unknown) {
      console.error("Fehler beim Auschecken der Datei:", error);

      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { message?: string } })?.data
              ?.message || "Unbekannter Fehler"
          : "Fehler beim Auschecken der Datei";

      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCheckinFile = async (projectId: string, fileId: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          id: string;
          checkedOutBy: null;
          checkedOutByName: null;
          checkedOutAt: null;
        };
      }>(`/projects/${projectId}/files/${fileId}/checkin`);

      if (response.success) {
        // Update local state to remove checkout info
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      checkedOutBy: null,
                      checkedOutByName: null,
                      checkedOutAt: null,
                    }
                  : f,
              ),
            };
          }
          return p;
        });

        setProjects(updatedProjects);

        toast({
          variant: "success" as const,
          title: "Datei eingecheckt",
          description: "Die Datei wurde erfolgreich eingecheckt.",
        });
      }
    } catch (error: unknown) {
      console.error("Fehler beim Einchecken der Datei:", error);

      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { message?: string } })?.data
              ?.message || "Unbekannter Fehler"
          : "Fehler beim Einchecken der Datei";

      toast({
        title: "Fehler",
        description: errorMessage,
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
    } catch {
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
    text: string,
  ) => {
    const updatedComment = await updateProjectComment(
      projectId,
      commentId,
      text,
    );
    setProjectComments((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map((c) =>
        c.id === commentId ? updatedComment : c,
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
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Verstrichene Tage
    const elapsedDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Prozentsatz der verstrichenen Zeit
    const timeProgress = Math.max(
      0,
      Math.min(100, (elapsedDays / totalDays) * 100),
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

  // Helper function to format date without timezone issues
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if a project is overdue
  const isOverdue = (endDate: string | null, status: string) => {
    if (!endDate || status === "Abgeschlossen") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(endDate);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  const getFilteredProjects = (anlage: Anlage) => {
    const filtered = projects.filter((project) => {
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

    // Sort by end date (earliest first), completed projects at the bottom
    return filtered.sort((a, b) => {
      // Completed projects go to the bottom
      if (a.status === "Abgeschlossen" && b.status !== "Abgeschlossen")
        return 1;
      if (a.status !== "Abgeschlossen" && b.status === "Abgeschlossen")
        return -1;

      // Both completed or both active - sort by end date
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;

      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  };

  const getTotalBudget = (anlage: Anlage) => {
    return getFilteredProjects(anlage).reduce(
      (sum, project) => sum + project.budget,
      0,
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
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Loading State with Skeleton */}
      {isLoading && <ProjectListSkeleton />}

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
          <PageHeader
            title="Anlagen-Projekt-Management"
            subtitle="Verwalten Sie Projekte, Aufgaben und Dateien für alle Anlagen"
            icon={<Workflow className="h-5 w-5" />}
            actions={
              <>
                <Button
                  onClick={loadData}
                  variant="outline"
                  size="default"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Aktualisieren</span>
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleCreate}
                      className="flex-1 sm:flex-none"
                    >
                      <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(availableRigs.length, 4)}, minmax(0, 1fr))`,
                          }}
                        >
                          {availableRigs.map((rig) => (
                            <Button
                              key={rig.id}
                              type="button"
                              variant={
                                formData.anlage === rig.name
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  anlage: rig.name as Anlage,
                                })
                              }
                              className="w-full"
                            >
                              {rig.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Kategorie</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={
                              formData.category === "Mechanisch"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setFormData({
                                ...formData,
                                category: "Mechanisch",
                              })
                            }
                            className="w-full"
                          >
                            Mechanisch
                          </Button>
                          <Button
                            type="button"
                            variant={
                              formData.category === "Elektrisch"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setFormData({
                                ...formData,
                                category: "Elektrisch",
                              })
                            }
                            className="w-full"
                          >
                            Elektrisch
                          </Button>
                          <Button
                            type="button"
                            variant={
                              formData.category === "Anlage"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setFormData({ ...formData, category: "Anlage" })
                            }
                            className="w-full"
                          >
                            Anlage
                          </Button>
                        </div>
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
                              value: "Aktiv" | "Abgeschlossen" | "Geplant",
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
                          <Label htmlFor="assignedUser">
                            Zugewiesener User
                          </Label>
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
                                startDate: date ? formatDateForInput(date) : "",
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
                                endDate: date ? formatDateForInput(date) : "",
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
              </>
            }
          />

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
                    <DatePicker
                      date={
                        taskFormData.dueDate
                          ? new Date(taskFormData.dueDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        setTaskFormData({
                          ...taskFormData,
                          dueDate: date ? formatDateForInput(date) : "",
                        })
                      }
                      placeholder="Fälligkeitsdatum wählen"
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-semibold text-sm">Filter</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
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
            <TabsList
              className={`grid w-full h-20`}
              style={{
                gridTemplateColumns: `repeat(${availableRigs.length || 1}, minmax(0, 1fr))`,
              }}
            >
              {availableRigs.map((rig) => (
                <TabsTrigger
                  key={rig.id}
                  value={rig.name}
                  className="flex flex-col items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full text-base"
                >
                  <span className="font-semibold text-lg">{rig.name}</span>
                  <Badge variant="secondary" className="text-xs px-2">
                    {getFilteredProjects(rig.name as Anlage).length} Projekte
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {availableRigs.map((rig) => (
              <TabsContent key={rig.id} value={rig.name} className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Anlage {rig.name}
                      </CardTitle>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Gesamt-Budget
                        </p>
                        <p className="text-xl font-bold">
                          {formatCurrency(getTotalBudget(rig.name as Anlage))}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] py-3 text-base"></TableHead>
                            <TableHead className="w-[40px] py-3 text-base">
                              Nr.
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              Projektname
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              Kategorie
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              Status
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              User
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              Aufgaben
                            </TableHead>
                            <TableHead className="py-3 text-base">
                              Dateien
                            </TableHead>
                            <TableHead className="text-right py-3 text-base">
                              Budget
                            </TableHead>
                            <TableHead className="text-right py-3 text-base">
                              Fortschritt
                            </TableHead>
                            <TableHead className="text-right py-3 text-base">
                              Aktionen
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredProjects(rig.name).length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={11}
                                className="text-center text-muted-foreground text-base py-6"
                              >
                                Keine Projekte gefunden
                              </TableCell>
                            </TableRow>
                          ) : (
                            getFilteredProjects(rig.name).map(
                              (project, index) => {
                                const isExpanded = expandedRows.has(project.id);
                                return (
                                  <React.Fragment key={project.id}>
                                    {/* Hauptzeile */}
                                    <TableRow
                                      id={`project-${project.id}`}
                                      className={`hover:bg-muted/50 transition-colors ${
                                        isOverdue(
                                          project.endDate,
                                          project.status,
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
                                      <TableCell className="py-3">
                                        <span className="font-medium text-muted-foreground text-base">
                                          {index + 1}
                                        </span>
                                      </TableCell>
                                      <TableCell className="font-medium py-3">
                                        <div
                                          className={`text-base ${
                                            project.status === "Abgeschlossen"
                                              ? "line-through text-muted-foreground"
                                              : ""
                                          }`}
                                        >
                                          {project.name}
                                        </div>
                                        {project.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {project.description}
                                          </p>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <Badge
                                          className={`text-sm ${getCategoryColor(
                                            project.category,
                                          )}`}
                                        >
                                          {project.category}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <Badge
                                          className={`text-sm ${getStatusColor(
                                            project.status,
                                          )}`}
                                        >
                                          {project.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-base">
                                            {project.assignedUser ||
                                              "Nicht zugewiesen"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-sm"
                                          onClick={() =>
                                            handleOpenTaskDialog(project)
                                          }
                                        >
                                          <ListTodo className="h-3.5 w-3.5 mr-1" />
                                          {
                                            project.tasks.filter(
                                              (t) => t.completed,
                                            ).length
                                          }
                                          /{project.tasks.length}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-sm"
                                          onClick={() =>
                                            handleOpenFileDialog(project)
                                          }
                                        >
                                          <FileText className="h-3.5 w-3.5 mr-1" />
                                          {project.files.length}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-right font-medium py-3 text-base">
                                        {formatCurrency(project.budget)}
                                      </TableCell>
                                      <TableCell className="text-right py-3">
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="w-full max-w-[100px] bg-secondary rounded-full h-2.5">
                                            <div
                                              className="bg-primary h-2.5 rounded-full transition-all"
                                              style={{
                                                width: `${project.progress}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="text-base font-medium min-w-[3ch]">
                                            {project.progress}%
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right py-3">
                                        <div className="flex justify-end gap-1">
                                          {onOpenFlow && (
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="h-8 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
                                              onClick={() =>
                                                onOpenFlow(project.id)
                                              }
                                              title="Flow Editor öffnen"
                                            >
                                              <Workflow className="h-4 w-4 mr-1.5" />
                                              Flow
                                            </Button>
                                          )}
                                          <Button
                                            variant={
                                              project.status === "Abgeschlossen"
                                                ? "outline"
                                                : "default"
                                            }
                                            size="icon"
                                            className={`h-8 w-8 ${
                                              project.status === "Abgeschlossen"
                                                ? "text-muted-foreground"
                                                : "bg-green-600 hover:bg-green-700"
                                            }`}
                                            onClick={() =>
                                              handleToggleComplete(project)
                                            }
                                            title={
                                              project.status === "Abgeschlossen"
                                                ? "Projekt reaktivieren"
                                                : "Projekt abschließen"
                                            }
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                          </Button>
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
                                            {/* Flow Editor CTA - Prominent am Anfang */}
                                            {onOpenFlow && (
                                              <Card className="border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 overflow-hidden">
                                                <CardContent className="p-0">
                                                  <div className="flex items-center justify-between p-4 md:p-6">
                                                    <div className="flex items-center gap-4">
                                                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Workflow className="h-7 w-7 text-white" />
                                                      </div>
                                                      <div>
                                                        <h3 className="text-lg font-bold text-foreground">
                                                          Projekt Flow
                                                          Visualisierung
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground max-w-md">
                                                          Visualisiere den
                                                          Projektablauf mit Drag
                                                          & Drop. Erstelle
                                                          Aufgaben, Meilensteine
                                                          und Abhängigkeiten auf
                                                          einen Blick.
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <Button
                                                      size="lg"
                                                      className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg text-base font-semibold"
                                                      onClick={() =>
                                                        onOpenFlow(project.id)
                                                      }
                                                    >
                                                      <Workflow className="h-5 w-5 mr-2" />
                                                      Flow Editor öffnen
                                                    </Button>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            )}

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
                                                              project.startDate,
                                                            ).toLocaleDateString(
                                                              "de-DE",
                                                            )
                                                          : "Nicht gesetzt"}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-xs font-medium text-muted-foreground">
                                                        Enddatum
                                                      </p>
                                                      <p
                                                        className={`text-sm mt-1 font-medium ${
                                                          isOverdue(
                                                            project.endDate,
                                                            project.status,
                                                          )
                                                            ? "text-red-600 dark:text-red-400"
                                                            : ""
                                                        }`}
                                                      >
                                                        {project.endDate
                                                          ? new Date(
                                                              project.endDate,
                                                            ).toLocaleDateString(
                                                              "de-DE",
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
                                                          project,
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
                                                                project.startDate,
                                                              ).toLocaleDateString(
                                                                "de-DE",
                                                                {
                                                                  day: "2-digit",
                                                                  month:
                                                                    "short",
                                                                },
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
                                                                project.endDate,
                                                              ).toLocaleDateString(
                                                                "de-DE",
                                                                {
                                                                  day: "2-digit",
                                                                  month:
                                                                    "short",
                                                                },
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
                                                                  gantt.daysRemaining,
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
                                                          project,
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
                                                                  task.id,
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
                                                                    {getUserDisplayName(
                                                                      task.assignedUser,
                                                                    )}
                                                                  </span>
                                                                )}
                                                                {task.dueDate && (
                                                                  <span className="text-xs text-muted-foreground">
                                                                    Fällig:{" "}
                                                                    {new Date(
                                                                      task.dueDate,
                                                                    ).toLocaleDateString(
                                                                      "de-DE",
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
                                                                    task,
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
                                                                    task.id,
                                                                  )
                                                                }
                                                              >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
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
                                                        project,
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
                                                      (file) => {
                                                        const isImage =
                                                          file.type.startsWith(
                                                            "image/",
                                                          );
                                                        return (
                                                          <Card
                                                            key={file.id}
                                                            className="group hover:shadow-md transition-shadow overflow-hidden"
                                                          >
                                                            <CardContent className="p-0">
                                                              {/* Image Preview or Icon */}
                                                              {isImage &&
                                                              file.url ? (
                                                                <div className="relative aspect-square bg-muted">
                                                                  <img
                                                                    src={
                                                                      file.url
                                                                    }
                                                                    alt={
                                                                      file.name
                                                                    }
                                                                    className="w-full h-full object-cover"
                                                                    onError={(
                                                                      e,
                                                                    ) => {
                                                                      // Fallback wenn Bild nicht geladen werden kann
                                                                      e.currentTarget.style.display =
                                                                        "none";
                                                                      const parent =
                                                                        e
                                                                          .currentTarget
                                                                          .parentElement;
                                                                      if (
                                                                        parent
                                                                      ) {
                                                                        parent.innerHTML =
                                                                          '<div class="w-full h-full flex items-center justify-center"><svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                                                                      }
                                                                    }}
                                                                  />
                                                                  <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() =>
                                                                      handleDeleteFile(
                                                                        project.id,
                                                                        file.id,
                                                                      )
                                                                    }
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                                </div>
                                                              ) : (
                                                                <div className="p-3 flex items-start justify-between gap-2">
                                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    {getFileIcon(
                                                                      file.type,
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                      <p className="text-sm font-medium truncate">
                                                                        {
                                                                          file.name
                                                                        }
                                                                      </p>
                                                                      <p className="text-xs text-muted-foreground">
                                                                        {formatFileSize(
                                                                          file.size,
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
                                                                        file.id,
                                                                      )
                                                                    }
                                                                  >
                                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                                  </Button>
                                                                </div>
                                                              )}

                                                              {/* File Info */}
                                                              <div className="p-3 pt-2 border-t">
                                                                <p className="text-sm font-medium truncate mb-1">
                                                                  {file.name}
                                                                </p>
                                                                <div className="text-xs text-muted-foreground space-y-0.5">
                                                                  <p>
                                                                    Von:{" "}
                                                                    {
                                                                      file.uploadedBy
                                                                    }
                                                                  </p>
                                                                  <p>
                                                                    {new Date(
                                                                      file.uploadedAt,
                                                                    ).toLocaleDateString(
                                                                      "de-DE",
                                                                    )}
                                                                  </p>
                                                                  {!isImage && (
                                                                    <p>
                                                                      {formatFileSize(
                                                                        file.size,
                                                                      )}
                                                                    </p>
                                                                  )}

                                                                  {/* Checkout Status */}
                                                                  {file.checkedOutBy && (
                                                                    <div className="mt-2 pt-2 border-t">
                                                                      <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                      >
                                                                        🔒
                                                                        Ausgecheckt
                                                                        von{" "}
                                                                        {
                                                                          file.checkedOutByName
                                                                        }
                                                                      </Badge>
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                {/* Checkout/Checkin Buttons */}
                                                                <div className="mt-2 flex gap-1">
                                                                  {!file.checkedOutBy ? (
                                                                    <Button
                                                                      size="sm"
                                                                      variant="outline"
                                                                      className="h-7 text-xs flex-1"
                                                                      onClick={() =>
                                                                        handleCheckoutFile(
                                                                          project.id,
                                                                          file.id,
                                                                        )
                                                                      }
                                                                    >
                                                                      Auschecken
                                                                    </Button>
                                                                  ) : (
                                                                    <>
                                                                      {(() => {
                                                                        const isOwner =
                                                                          currentUser?.id ===
                                                                          file.checkedOutBy;
                                                                        const isAdmin =
                                                                          currentUser?.role ===
                                                                          "ADMIN";

                                                                        if (
                                                                          isOwner ||
                                                                          isAdmin
                                                                        ) {
                                                                          return (
                                                                            <Button
                                                                              size="sm"
                                                                              variant="default"
                                                                              className="h-7 text-xs flex-1"
                                                                              onClick={() =>
                                                                                handleCheckinFile(
                                                                                  project.id,
                                                                                  file.id,
                                                                                )
                                                                              }
                                                                            >
                                                                              Einchecken
                                                                            </Button>
                                                                          );
                                                                        }
                                                                        return null;
                                                                      })()}
                                                                    </>
                                                                  )}
                                                                  <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => {
                                                                      if (
                                                                        file.url
                                                                      ) {
                                                                        window.open(
                                                                          file.url,
                                                                          "_blank",
                                                                        );
                                                                      }
                                                                    }}
                                                                  >
                                                                    ⬇️
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            </CardContent>
                                                          </Card>
                                                        );
                                                      },
                                                    )}
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>

                                            {/* Comment Section */}
                                            {(() => {
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
                                                      text,
                                                    )
                                                  }
                                                  onUpdateComment={(
                                                    commentId,
                                                    text,
                                                  ) =>
                                                    handleUpdateComment(
                                                      project.id,
                                                      commentId,
                                                      text,
                                                    )
                                                  }
                                                  onDeleteComment={(
                                                    commentId,
                                                  ) =>
                                                    handleDeleteComment(
                                                      project.id,
                                                      commentId,
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
                              },
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
