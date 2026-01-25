import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import type { Connection, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  projectService,
  type Project,
  type ProjectTask,
} from "@/services/project.service";
import { userService } from "@/services/user.service";
import type { User } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  Calendar,
  Target,
  Eye,
  Edit,
  Save,
  Workflow,
  X,
  ChevronRight,
  ChevronDown,
  FolderKanban,
  ListTodo,
  ArrowLeft,
  User as UserIcon,
  Download,
  LayoutGrid,
  AlertTriangle,
  Diamond,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/api";
import { toPng } from "html-to-image";

// ===== Constants =====
const PLANTS = ["T208", "T207", "T700", "T46"] as const;
type Plant = (typeof PLANTS)[number];

// ===== Types =====
type TaskStatus = ProjectTask["status"];

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  status: TaskStatus;
  description?: string;
  taskId?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: string;
  onEdit?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

interface MilestoneNodeData extends Record<string, unknown> {
  label: string;
  completed?: boolean;
}

interface SavedFlowData {
  nodes: Node[];
  edges: Edge[];
}

// ===== Flow Node Components =====
function TaskFlowNode({ data }: { data: FlowNodeData }) {
  const statusColors: Record<TaskStatus, string> = {
    TODO: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
    IN_PROGRESS:
      "bg-blue-100 border-blue-400 dark:bg-blue-900 dark:border-blue-500",
    REVIEW:
      "bg-yellow-100 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-500",
    DONE: "bg-green-200 border-green-500 dark:bg-green-800 dark:border-green-400 ring-2 ring-green-400/50",
  };

  const priorityColors: Record<string, string> = {
    LOW: "border-l-gray-400",
    NORMAL: "border-l-blue-400",
    HIGH: "border-l-orange-500",
    URGENT: "border-l-red-500",
  };

  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    TODO: <Circle className="h-4 w-4 text-gray-500" />,
    IN_PROGRESS: <Clock className="h-4 w-4 text-blue-500" />,
    REVIEW: <Eye className="h-4 w-4 text-yellow-600" />,
    DONE: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  };

  const handleDoubleClick = () => {
    if (data.onEdit && data.taskId) {
      data.onEdit(data.taskId);
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onToggleStatus && data.taskId) {
      data.onToggleStatus(data.taskId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete && data.taskId) {
      data.onDelete(data.taskId);
    }
  };

  // Check if overdue
  const isOverdue =
    data.dueDate &&
    new Date(data.dueDate) < new Date() &&
    data.status !== "DONE";

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        "px-4 py-3 rounded-lg border-2 shadow-md min-w-[200px] max-w-[260px] cursor-pointer transition-all hover:shadow-lg border-l-4",
        statusColors[data.status],
        priorityColors[data.priority || "NORMAL"],
        data.status === "DONE" && "opacity-90",
        isOverdue && "ring-2 ring-red-500/50"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleStatusClick}
          className="hover:scale-125 transition-transform cursor-pointer"
          title="Status ändern"
        >
          {statusIcons[data.status]}
        </button>
        <span
          className={cn(
            "font-medium text-sm flex-1",
            data.status === "DONE" && "line-through text-muted-foreground"
          )}
        >
          {data.label}
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleDoubleClick}
            className="opacity-50 hover:opacity-100 transition-opacity p-0.5"
            title="Bearbeiten"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="opacity-50 hover:opacity-100 transition-opacity text-red-500 p-0.5"
            title="Löschen"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {data.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {data.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{data.assignedTo}</span>
          </div>
        )}
        {data.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
            )}
          >
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(data.dueDate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  );
}

// Milestone Node Component
function MilestoneNode({ data }: { data: MilestoneNodeData }) {
  return (
    <div
      className={cn(
        "w-16 h-16 rotate-45 flex items-center justify-center border-2 shadow-md transition-all",
        data.completed
          ? "bg-green-500 border-green-600 text-white"
          : "bg-amber-100 border-amber-400 dark:bg-amber-900 dark:border-amber-500"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary -rotate-45"
        style={{ left: -8 }}
      />
      <div className="-rotate-45 text-center">
        <Diamond
          className={cn(
            "h-4 w-4 mx-auto",
            data.completed ? "text-white" : "text-amber-600"
          )}
        />
        <span className="text-[10px] font-bold block mt-0.5 max-w-[50px] truncate">
          {data.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary -rotate-45"
        style={{ right: -8 }}
      />
    </div>
  );
}

function StartNode() {
  return (
    <div className="px-4 py-2 rounded-full bg-green-500 text-white font-bold text-sm shadow-lg">
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white"
      />
      START
    </div>
  );
}

function EndNode() {
  return (
    <div className="px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm shadow-lg">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white"
      />
      ENDE
    </div>
  );
}

const nodeTypes = {
  task: TaskFlowNode,
  start: StartNode,
  end: EndNode,
  milestone: MilestoneNode,
};

// ===== Helper Functions =====
const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    TODO: "Offen",
    IN_PROGRESS: "In Arbeit",
    REVIEW: "Review",
    DONE: "Erledigt",
  };
  return labels[status];
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    LOW: "Niedrig",
    NORMAL: "Normal",
    HIGH: "Hoch",
    URGENT: "Dringend",
  };
  return labels[priority] || priority;
};

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    PLANNED: "bg-gray-500 text-white",
    IN_PROGRESS: "bg-blue-500 text-white",
    ON_HOLD: "bg-yellow-500 text-black",
    COMPLETED: "bg-green-500 text-white",
    CANCELLED: "bg-red-500 text-white",
  };
  return classes[status] || "bg-gray-500 text-white";
};

const getPriorityBadgeClass = (priority: string): string => {
  const classes: Record<string, string> = {
    LOW: "bg-gray-400 text-white",
    NORMAL: "bg-yellow-500 text-black",
    HIGH: "bg-orange-500 text-white",
    URGENT: "bg-red-500 text-white",
  };
  return classes[priority] || "bg-gray-500 text-white";
};

const getTaskStatusBadgeClass = (status: TaskStatus): string => {
  const classes: Record<TaskStatus, string> = {
    TODO: "bg-gray-400 text-white",
    IN_PROGRESS: "bg-blue-500 text-white",
    REVIEW: "bg-yellow-500 text-black",
    DONE: "bg-green-500 text-white",
  };
  return classes[status];
};

// ===== Skeleton Component =====
function ProjectsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 h-20">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function ProjectsPage() {
  const { toast } = useToast();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Plant>("T208");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  // Dialog States
  const [showFlowDialog, setShowFlowDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "IN_PROGRESS" as Project["status"],
    priority: "NORMAL" as Project["priority"],
    plant: "T208" as Plant,
    startDate: "",
    endDate: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskStatus,
    assignedTo: "",
  });
  const [taskToDelete, setTaskToDelete] = useState<{
    projectId: string;
    taskId: string;
  } | null>(null);

  // Users State
  const [users, setUsers] = useState<User[]>([]);

  // Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hasFlowChanges, setHasFlowChanges] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const selectedProjectRef = useRef<Project | null>(null);

  // Flow Dialog States for adding tasks/milestones
  const [showFlowTaskDialog, setShowFlowTaskDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [flowTaskForm, setFlowTaskForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskStatus,
    assignedTo: "",
  });
  const [milestoneForm, setMilestoneForm] = useState({
    label: "",
  });

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  // Load Projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { projects: data } = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Fehler",
        description: "Projekte konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, [loadProjects, loadUsers]);

  // Computed Values
  const getProjectStats = useCallback(
    (plant: Plant) => {
      const plantProjects = projects.filter((p) => p.plant === plant);
      const activeCount = plantProjects.filter(
        (p) =>
          p.status === "IN_PROGRESS" ||
          p.status === "PLANNED" ||
          p.status === "ON_HOLD"
      ).length;
      return {
        total: plantProjects.length,
        active: activeCount,
        completed: plantProjects.filter((p) => p.status === "COMPLETED").length,
        totalTasks: plantProjects.reduce(
          (sum, p) => sum + (p.tasks?.length || 0),
          0
        ),
      };
    },
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.plant === activeTab)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Active first, then by priority
        if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
        if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        return (
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
        );
      });
  }, [projects, activeTab, searchQuery]);

  // Toggle Project Expansion
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Flow Dialog
  // Flow Dialog Handlers
  const handleEditTaskFromFlow = useCallback(
    (taskId: string) => {
      const project = selectedProjectRef.current;
      if (!project) return;
      const task = project.tasks?.find((t) => t.id === taskId);
      if (task) {
        setIsEditMode(true);
        setTaskForm({
          title: task.title,
          description: task.description || "",
          status: task.status,
          assignedTo: task.assignedTo || "",
        });
        setTaskToDelete({ projectId: project.id, taskId: task.id });
        setShowTaskDialog(true);
      }
    },
    []
  );

  const handleToggleTaskFromFlow = useCallback(
    async (taskId: string) => {
      const project = selectedProjectRef.current;
      if (!project) return;
      const task = project.tasks?.find((t) => t.id === taskId);
      if (!task) return;

      const statusOrder: TaskStatus[] = [
        "TODO",
        "IN_PROGRESS",
        "REVIEW",
        "DONE",
      ];
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

      try {
        await projectService.updateTask(project.id, task.id, {
          status: nextStatus,
        });

        // Update nodes with new status
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === `task-${taskId}`) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: nextStatus,
                },
              };
            }
            return node;
          })
        );

        // Reload project data
        const { projects: updatedProjects } =
          await projectService.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find(
          (p) => p.id === project.id
        );
        if (updatedProject) {
          setSelectedProject(updatedProject);
          selectedProjectRef.current = updatedProject;
        }

        setHasFlowChanges(true);
      } catch (error) {
        console.error("Error updating task status:", error);
      }
    },
    [setNodes]
  );

  // Delete Task from Flow
  const handleDeleteTaskFromFlow = useCallback(
    async (taskId: string) => {
      const project = selectedProjectRef.current;
      if (!project) return;

      if (!confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return;

      try {
        await projectService.deleteTask(project.id, taskId);

        // Remove node from flow
        setNodes((nds) => nds.filter((node) => node.id !== `task-${taskId}`));
        // Remove edges connected to this node
        setEdges((eds) =>
          eds.filter(
            (edge) =>
              edge.source !== `task-${taskId}` &&
              edge.target !== `task-${taskId}`
          )
        );

        // Reload project data
        const { projects: updatedProjects } =
          await projectService.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find(
          (p) => p.id === project.id
        );
        if (updatedProject) {
          setSelectedProject(updatedProject);
          selectedProjectRef.current = updatedProject;
        }

        setHasFlowChanges(true);
        toast({
          title: "Aufgabe gelöscht",
          description: "Die Aufgabe wurde aus dem Flow entfernt.",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Fehler",
          description: "Aufgabe konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    },
    [setNodes, setEdges, toast]
  );

  // Add Task in Flow - Open Dialog
  const openFlowTaskDialog = useCallback(() => {
    setFlowTaskForm({
      title: "",
      description: "",
      status: "TODO",
      assignedTo: "",
    });
    setShowFlowTaskDialog(true);
  }, []);

  // Add Task in Flow - Save
  const handleSaveFlowTask = useCallback(async () => {
    if (!selectedProject || !flowTaskForm.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Aufgabentitel ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTask = await projectService.createTask(selectedProject.id, {
        title: flowTaskForm.title.trim(),
        description: flowTaskForm.description,
        status: flowTaskForm.status,
        assignedTo: flowTaskForm.assignedTo || undefined,
      });

      // Add node to flow
      const existingTaskNodes = nodes.filter((n) => n.type === "task");
      const newNode: Node = {
        id: `task-${newTask.id}`,
        type: "task",
        position: {
          x: 250 + (existingTaskNodes.length % 3) * 280,
          y: 100 + Math.floor(existingTaskNodes.length / 3) * 140,
        },
        data: {
          label: newTask.title,
          status: newTask.status,
          description: newTask.description,
          taskId: newTask.id,
          assignedTo: flowTaskForm.assignedTo,
          onEdit: handleEditTaskFromFlow,
          onToggleStatus: handleToggleTaskFromFlow,
          onDelete: handleDeleteTaskFromFlow,
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Reload project data
      const { projects: updatedProjects } = await projectService.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(
        (p) => p.id === selectedProject.id
      );
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }

      // Send notification if user was assigned
      if (flowTaskForm.assignedTo) {
        const assignedUser = users.find(
          (u) =>
            `${u.firstName} ${u.lastName}` === flowTaskForm.assignedTo ||
            u.id === flowTaskForm.assignedTo ||
            u.email === flowTaskForm.assignedTo
        );
        if (assignedUser) {
          try {
            await apiClient.post("/notifications", {
              title: "Neue Aufgabe zugewiesen",
              message: `Dir wurde die Aufgabe "${flowTaskForm.title}" im Projekt "${selectedProject.name}" zugewiesen.`,
              type: "TASK_ASSIGNED",
              targetUserId: assignedUser.id,
              relatedId: selectedProject.id,
            });
          } catch (notifyError) {
            console.error("Error sending notification:", notifyError);
          }
        }
      }

      setHasFlowChanges(true);
      setShowFlowTaskDialog(false);
      toast({
        title: "Aufgabe erstellt",
        description: `"${flowTaskForm.title}" wurde dem Flow hinzugefügt.`,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  }, [
    selectedProject,
    flowTaskForm,
    nodes,
    setNodes,
    users,
    handleEditTaskFromFlow,
    handleToggleTaskFromFlow,
    handleDeleteTaskFromFlow,
    toast,
  ]);

  // Add Milestone in Flow - Open Dialog
  const openMilestoneDialog = useCallback(() => {
    setMilestoneForm({ label: "" });
    setShowMilestoneDialog(true);
  }, []);

  // Add Milestone in Flow - Save
  const handleSaveMilestone = useCallback(() => {
    if (!milestoneForm.label.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Meilenstein-Namen ein.",
        variant: "destructive",
      });
      return;
    }

    const newNode: Node = {
      id: `milestone-${Date.now()}`,
      type: "milestone",
      position: { x: 400, y: 200 },
      data: {
        label: milestoneForm.label.trim(),
        completed: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setHasFlowChanges(true);
    setShowMilestoneDialog(false);
    toast({
      title: "Meilenstein erstellt",
      description: `"${milestoneForm.label}" wurde dem Flow hinzugefügt.`,
    });
  }, [milestoneForm, setNodes, toast]);

  // Auto-Layout Function
  const handleAutoLayout = useCallback(() => {
    const startNode = nodes.find((n) => n.type === "start");
    const endNode = nodes.find((n) => n.type === "end");
    const taskNodes = nodes.filter((n) => n.type === "task");
    const milestoneNodes = nodes.filter((n) => n.type === "milestone");

    const layoutNodes: Node[] = [];
    const spacing = { x: 280, y: 140 };
    const startX = 50;
    const startY = 150;

    // Start node
    if (startNode) {
      layoutNodes.push({ ...startNode, position: { x: startX, y: startY } });
    }

    // Task nodes in grid
    taskNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        position: {
          x: startX + 200 + (index % 3) * spacing.x,
          y: startY - 50 + Math.floor(index / 3) * spacing.y,
        },
      });
    });

    // Milestone nodes after tasks
    const tasksWidth = Math.max(1, Math.ceil(taskNodes.length / 3)) * spacing.x;
    milestoneNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        position: {
          x: startX + 200 + tasksWidth + 100,
          y: startY + index * 100,
        },
      });
    });

    // End node
    if (endNode) {
      const maxX = Math.max(
        ...layoutNodes.map((n) => n.position.x),
        startX + 200 + tasksWidth
      );
      layoutNodes.push({
        ...endNode,
        position: { x: maxX + spacing.x, y: startY },
      });
    }

    setNodes(layoutNodes);
    setHasFlowChanges(true);
    toast({
      title: "Layout angewendet",
      description: "Nodes wurden automatisch angeordnet.",
    });
  }, [nodes, setNodes, toast]);

  // Export Flow as PNG
  const handleExportFlow = useCallback(async () => {
    if (!flowRef.current) return;

    try {
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: "#f8fafc",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `flowchart-${selectedProject?.name || "export"}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Export erfolgreich",
        description: "Flowchart wurde als PNG exportiert.",
      });
    } catch (error) {
      console.error("Error exporting flow:", error);
      toast({
        title: "Fehler",
        description: "Export fehlgeschlagen.",
        variant: "destructive",
      });
    }
  }, [selectedProject, toast]);

  // Open Flow Dialog
  const openFlowDialog = (project: Project) => {
    setSelectedProject(project);
    selectedProjectRef.current = project;
    initializeFlow(project);
    setShowFlowDialog(true);
    setHasFlowChanges(false);
  };

  const initializeFlow = useCallback(
    (project: Project) => {
      // Try to load saved flow data
      if (project.flowData) {
        try {
          const savedFlow: SavedFlowData = JSON.parse(project.flowData);
          // Update nodes with current task data and callbacks
          const updatedNodes = savedFlow.nodes.map((node) => {
            if (node.type === "task" && node.data.taskId) {
              const task = project.tasks?.find(
                (t) => t.id === node.data.taskId
              );
              if (task) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    label: task.title,
                    status: task.status,
                    description: task.description,
                    assignedTo: task.assignedTo,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    onEdit: handleEditTaskFromFlow,
                    onToggleStatus: handleToggleTaskFromFlow,
                    onDelete: handleDeleteTaskFromFlow,
                  },
                };
              }
            }
            return node;
          });
          setNodes(updatedNodes);
          setEdges(savedFlow.edges || []);
          return;
        } catch {
          console.log("No valid saved flow, creating new");
        }
      }

      // Create default flow from tasks
      const tasks = project.tasks || [];
      const taskNodes: Node[] = tasks.map((task, index) => ({
        id: `task-${task.id}`,
        type: "task",
        position: {
          x: 250 + (index % 3) * 280,
          y: 100 + Math.floor(index / 3) * 140,
        },
        data: {
          label: task.title,
          status: task.status,
          description: task.description,
          taskId: task.id,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate,
          priority: task.priority,
          onEdit: handleEditTaskFromFlow,
          onToggleStatus: handleToggleTaskFromFlow,
          onDelete: handleDeleteTaskFromFlow,
        },
      }));

      const startNode: Node = {
        id: "start",
        type: "start",
        position: { x: 50, y: 150 },
        data: {},
      };

      const endNode: Node = {
        id: "end",
        type: "end",
        position: {
          x: 250 + Math.max(1, Math.ceil(tasks.length / 3)) * 280,
          y: 150,
        },
        data: {},
      };

      setNodes([startNode, ...taskNodes, endNode]);
      setEdges([]);
    },
    [
      handleEditTaskFromFlow,
      handleToggleTaskFromFlow,
      handleDeleteTaskFromFlow,
      setNodes,
      setEdges,
    ]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
      } as Edge;
      setEdges((eds) => addEdge(edge, eds));
      setHasFlowChanges(true);
    },
    [setEdges]
  );

  const saveFlow = async () => {
    if (!selectedProject) return;

    try {
      // Remove callback functions from nodes before saving (they can't be serialized)
      const cleanedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: undefined,
          onToggleStatus: undefined,
          onDelete: undefined,
        },
      }));

      const flowData: SavedFlowData = { nodes: cleanedNodes, edges };
      await projectService.updateProject(selectedProject.id, {
        flowData: JSON.stringify(flowData),
      });

      await loadProjects();
      setHasFlowChanges(false);
      toast({
        title: "Flow gespeichert",
        description: "Der Projektablauf wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error("Error saving flow:", error);
      toast({
        title: "Fehler",
        description: "Flow konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  // Project CRUD
  const openNewProjectDialog = () => {
    setIsEditMode(false);
    setProjectForm({
      name: "",
      description: "",
      status: "IN_PROGRESS" as Project["status"],
      priority: "NORMAL" as Project["priority"],
      plant: activeTab,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setShowProjectDialog(true);
  };

  const openEditProjectDialog = (project: Project) => {
    setIsEditMode(true);
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      priority: project.priority,
      plant: project.plant as Plant,
      startDate: project.startDate?.split("T")[0] || "",
      endDate: project.endDate?.split("T")[0] || "",
    });
    setShowProjectDialog(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Projektnamen ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && selectedProject) {
        await projectService.updateProject(selectedProject.id, projectForm);
        toast({
          title: "Projekt aktualisiert",
          description: `${projectForm.name} wurde erfolgreich aktualisiert.`,
        });
      } else {
        await projectService.createProject({
          projectNumber: `PRJ-${Date.now()}`,
          name: projectForm.name,
          description: projectForm.description,
          status: projectForm.status,
          priority: projectForm.priority,
          plant: projectForm.plant,
          startDate: projectForm.startDate,
          endDate: projectForm.endDate,
        });
        toast({
          title: "Projekt erstellt",
          description: `${projectForm.name} wurde erfolgreich erstellt.`,
        });
      }
      await loadProjects();
      setShowProjectDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await projectService.deleteProject(selectedProject.id);
      toast({
        title: "Projekt gelöscht",
        description: `${selectedProject.name} wurde gelöscht.`,
      });
      await loadProjects();
      setShowDeleteProjectDialog(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Task CRUD
  const openNewTaskDialog = (project: Project) => {
    setSelectedProject(project);
    setIsEditMode(false);
    setTaskForm({
      title: "",
      description: "",
      status: "TODO",
      assignedTo: "",
    });
    setShowTaskDialog(true);
  };

  const openEditTaskDialog = (project: Project, task: ProjectTask) => {
    setSelectedProject(project);
    setIsEditMode(true);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      assignedTo: task.assignedTo || "",
    });
    setTaskToDelete({ projectId: project.id, taskId: task.id });
    setShowTaskDialog(true);
  };

  const handleSaveTask = async () => {
    if (!selectedProject || !taskForm.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Aufgabentitel ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user assignment changed (for notification)
      const oldTask =
        isEditMode && taskToDelete
          ? selectedProject.tasks?.find((t) => t.id === taskToDelete.taskId)
          : null;
      const assignmentChanged =
        taskForm.assignedTo &&
        (!oldTask || oldTask.assignedTo !== taskForm.assignedTo);

      if (isEditMode && taskToDelete) {
        await projectService.updateTask(
          selectedProject.id,
          taskToDelete.taskId,
          taskForm
        );
        toast({
          title: "Aufgabe aktualisiert",
          description: `${taskForm.title} wurde erfolgreich aktualisiert.`,
        });

        // Update flow nodes if flow dialog is open
        if (showFlowDialog) {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === `task-${taskToDelete.taskId}`) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    label: taskForm.title,
                    status: taskForm.status,
                    description: taskForm.description,
                    assignedTo: taskForm.assignedTo,
                  },
                };
              }
              return node;
            })
          );
        }
      } else {
        await projectService.createTask(selectedProject.id, taskForm);
        toast({
          title: "Aufgabe erstellt",
          description: `${taskForm.title} wurde hinzugefügt.`,
        });
      }

      // Send notification if user was assigned
      if (assignmentChanged && taskForm.assignedTo) {
        const assignedUser = users.find(
          (u) =>
            `${u.firstName} ${u.lastName}` === taskForm.assignedTo ||
            u.id === taskForm.assignedTo ||
            u.email === taskForm.assignedTo
        );
        if (assignedUser) {
          try {
            await apiClient.post("/notifications", {
              title: "Neue Aufgabe zugewiesen",
              message: `Dir wurde die Aufgabe "${taskForm.title}" im Projekt "${selectedProject.name}" zugewiesen.`,
              type: "TASK_ASSIGNED",
              targetUserId: assignedUser.id,
              relatedId: selectedProject.id,
            });
            toast({
              title: "Benachrichtigung gesendet",
              description: `${assignedUser.firstName} ${assignedUser.lastName} wurde benachrichtigt.`,
            });
          } catch (notifyError) {
            console.error("Error sending notification:", notifyError);
            // Don't fail the whole operation if notification fails
          }
        }
      }

      // Reload projects and update selected project
      const { projects: updatedProjects } = await projectService.getProjects();
      setProjects(updatedProjects);

      if (showFlowDialog && selectedProject) {
        const updatedProject = updatedProjects.find(
          (p) => p.id === selectedProject.id
        );
        if (updatedProject) {
          setSelectedProject(updatedProject);
          // Reinitialize flow with new tasks if a new task was created
          if (!isEditMode) {
            initializeFlow(updatedProject);
          }
        }
      }

      setShowTaskDialog(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await projectService.deleteTask(
        taskToDelete.projectId,
        taskToDelete.taskId
      );
      toast({
        title: "Aufgabe gelöscht",
        description: "Die Aufgabe wurde entfernt.",
      });
      await loadProjects();
      setShowDeleteTaskDialog(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = async (project: Project, task: ProjectTask) => {
    const statusOrder: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await projectService.updateTask(project.id, task.id, {
        status: nextStatus,
      });
      await loadProjects();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Calculate progress
  const getProjectProgress = (project: Project): number => {
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Get progress color
  const getProgressColor = (progress: number): string => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 30) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FolderKanban className="h-6 w-6" />
                Projekte
              </CardTitle>
              <CardDescription>
                Projektverwaltung für alle Anlagen
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Projekt suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={openNewProjectDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Neues Projekt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ProjectsPageSkeleton />
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as Plant)}
              className="space-y-4"
            >
              {/* Plant Tabs - Like ActionTracker */}
              <TabsList className="grid w-full grid-cols-4 h-20 bg-muted/30 p-2 gap-2">
                {PLANTS.map((plant) => {
                  const stats = getProjectStats(plant);
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
                          {stats.active > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] opacity-70 leading-tight">
                                Aktiv:
                              </span>
                              <Badge
                                variant="destructive"
                                className="px-1.5 py-0 text-[10px] font-bold leading-tight h-4"
                              >
                                {stats.active}
                              </Badge>
                            </div>
                          )}
                          {stats.active === 0 && stats.total > 0 && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 leading-tight h-4"
                            >
                              ✓ Alle erledigt
                            </Badge>
                          )}
                          {stats.total === 0 && (
                            <span className="text-[10px] opacity-60 leading-tight">
                              Keine Projekte
                            </span>
                          )}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {PLANTS.map((plant) => (
                <TabsContent key={plant} value={plant} className="space-y-4">
                  {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Keine Projekte</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Erstellen Sie das erste Projekt für {plant}
                      </p>
                      <Button onClick={openNewProjectDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Projekt erstellen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredProjects.map((project) => {
                        const isExpanded = expandedProjects.has(project.id);
                        const progress = getProjectProgress(project);
                        const tasks = project.tasks || [];
                        const completedTasks = tasks.filter(
                          (t) => t.status === "DONE"
                        ).length;

                        return (
                          <Card
                            key={project.id}
                            className={cn(
                              "transition-all hover:shadow-md",
                              project.status === "COMPLETED" && "opacity-70"
                            )}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                {/* Left Side - Project Info */}
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() =>
                                    toggleProjectExpanded(project.id)
                                  }
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-bold"
                                    >
                                      {project.plant}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getStatusBadgeClass(project.status)
                                      )}
                                    >
                                      {project.status === "PLANNED" &&
                                        "Geplant"}
                                      {project.status === "IN_PROGRESS" &&
                                        "In Arbeit"}
                                      {project.status === "ON_HOLD" &&
                                        "Pausiert"}
                                      {project.status === "COMPLETED" &&
                                        "Abgeschlossen"}
                                      {project.status === "CANCELLED" &&
                                        "Abgebrochen"}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getPriorityBadgeClass(project.priority)
                                      )}
                                    >
                                      {getPriorityLabel(project.priority)}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-lg">
                                    {project.name}
                                  </CardTitle>
                                  {project.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}

                                  {/* Progress Bar */}
                                  <div className="mt-3 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        Fortschritt: {completedTasks}/
                                        {tasks.length} Aufgaben
                                      </span>
                                      <span className="font-medium">
                                        {progress}%
                                      </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full transition-all",
                                          getProgressColor(progress)
                                        )}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Dates */}
                                  {(project.startDate || project.endDate) && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      {project.startDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Start:{" "}
                                          {new Date(
                                            project.startDate
                                          ).toLocaleDateString("de-DE")}
                                        </span>
                                      )}
                                      {project.endDate && (
                                        <span className="flex items-center gap-1">
                                          <Target className="h-3 w-3" />
                                          Ende:{" "}
                                          {new Date(
                                            project.endDate
                                          ).toLocaleDateString("de-DE")}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Right Side - Action Buttons */}
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFlowDialog(project);
                                    }}
                                    className="gap-2"
                                  >
                                    <Workflow className="h-4 w-4" />
                                    Flowchart
                                  </Button>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditProjectDialog(project);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProject(project);
                                        setShowDeleteProjectDialog(true);
                                      }}
                                      className="text-red-500 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>

                            {/* Expanded Task List */}
                            {isExpanded && (
                              <CardContent className="pt-0 border-t">
                                <div className="pt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <ListTodo className="h-4 w-4" />
                                      Aufgaben ({tasks.length})
                                    </h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openNewTaskDialog(project)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Aufgabe
                                    </Button>
                                  </div>

                                  {tasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Noch keine Aufgaben vorhanden
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {tasks.map((task) => (
                                        <div
                                          key={task.id}
                                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                        >
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() =>
                                                toggleTaskStatus(project, task)
                                              }
                                              className="hover:scale-110 transition-transform"
                                            >
                                              {task.status === "DONE" ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                              ) : task.status ===
                                                "IN_PROGRESS" ? (
                                                <Clock className="h-5 w-5 text-blue-500" />
                                              ) : task.status === "REVIEW" ? (
                                                <Eye className="h-5 w-5 text-yellow-600" />
                                              ) : (
                                                <Circle className="h-5 w-5 text-gray-400" />
                                              )}
                                            </button>
                                            <div>
                                              <p
                                                className={cn(
                                                  "font-medium text-sm",
                                                  task.status === "DONE" &&
                                                    "line-through text-muted-foreground"
                                                )}
                                              >
                                                {task.title}
                                              </p>
                                              {task.description && (
                                                <p className="text-xs text-muted-foreground">
                                                  {task.description}
                                                </p>
                                              )}
                                              {task.assignedTo && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                  <UserIcon className="h-3 w-3" />
                                                  {task.assignedTo}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={cn(
                                                "text-xs",
                                                getTaskStatusBadgeClass(
                                                  task.status
                                                )
                                              )}
                                            >
                                              {getStatusLabel(task.status)}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                openEditTaskDialog(
                                                  project,
                                                  task
                                                )
                                              }
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setTaskToDelete({
                                                  projectId: project.id,
                                                  taskId: task.id,
                                                });
                                                setShowDeleteTaskDialog(true);
                                              }}
                                              className="text-red-500 hover:text-red-600"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Flow Dialog */}
      <Dialog open={showFlowDialog} onOpenChange={setShowFlowDialog}>
        <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Projekt-Flowchart: {selectedProject?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>
                Verbinden Sie Aufgaben per Drag & Drop um den Projektablauf zu
                visualisieren
              </span>
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Fortschritt:
                  </span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          selectedProject.tasks?.length
                            ? (selectedProject.tasks.filter(
                                (t) => t.status === "DONE"
                              ).length /
                                selectedProject.tasks.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedProject.tasks?.filter((t) => t.status === "DONE")
                      .length || 0}
                    /{selectedProject.tasks?.length || 0}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div
            className="flex-1 h-[calc(85vh-140px)] border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
            ref={flowRef}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                setHasFlowChanges(true);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                setHasFlowChanges(true);
              }}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-slate-50 dark:bg-slate-900"
            >
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === "start") return "#22c55e";
                  if (node.type === "end") return "#ef4444";
                  if (node.type === "milestone") {
                    return (node.data as MilestoneNodeData)?.completed
                      ? "#22c55e"
                      : "#f59e0b";
                  }
                  const data = node.data as FlowNodeData;
                  const colors: Record<TaskStatus, string> = {
                    TODO: "#9ca3af",
                    IN_PROGRESS: "#3b82f6",
                    REVIEW: "#eab308",
                    DONE: "#22c55e",
                  };
                  return colors[data?.status] || "#9ca3af";
                }}
              />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              {/* Top-Left Panel: Add Buttons */}
              <Panel position="top-left" className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFlowTaskDialog}
                  title="Aufgabe hinzufügen"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Aufgabe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openMilestoneDialog}
                  title="Meilenstein hinzufügen"
                >
                  <Diamond className="h-4 w-4 mr-1" />
                  Meilenstein
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoLayout}
                  title="Auto-Layout"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Layout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportFlow}
                  title="Als PNG exportieren"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </Panel>
              {/* Top-Right Panel: Save & Close */}
              <Panel position="top-right" className="flex gap-2">
                {hasFlowChanges && (
                  <Button onClick={saveFlow} className="gap-2">
                    <Save className="h-4 w-4" />
                    Speichern
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowFlowDialog(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Schließen
                </Button>
              </Panel>
            </ReactFlow>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flow Task Dialog - Add Task in Flow */}
      <Dialog open={showFlowTaskDialog} onOpenChange={setShowFlowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neue Aufgabe im Flow
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Aufgabe direkt im Flowchart
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input
                value={flowTaskForm.title}
                onChange={(e) =>
                  setFlowTaskForm({ ...flowTaskForm, title: e.target.value })
                }
                placeholder="Aufgabentitel..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={flowTaskForm.description}
                onChange={(e) =>
                  setFlowTaskForm({
                    ...flowTaskForm,
                    description: e.target.value,
                  })
                }
                placeholder="Beschreibung der Aufgabe..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={flowTaskForm.status}
                  onValueChange={(v) =>
                    setFlowTaskForm({
                      ...flowTaskForm,
                      status: v as TaskStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">Offen</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Arbeit</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="DONE">Erledigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zugewiesen an</Label>
                <Select
                  value={flowTaskForm.assignedTo || "none"}
                  onValueChange={(v) =>
                    setFlowTaskForm({
                      ...flowTaskForm,
                      assignedTo: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niemand</SelectItem>
                    {users.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={`${user.firstName} ${user.lastName}`}
                      >
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlowTaskDialog(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveFlowTask}>
              <Plus className="h-4 w-4 mr-2" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Diamond className="h-5 w-5" />
              Neuer Meilenstein
            </DialogTitle>
            <DialogDescription>
              Fügen Sie einen Meilenstein zum Flowchart hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={milestoneForm.label}
                onChange={(e) => setMilestoneForm({ label: e.target.value })}
                placeholder="Meilenstein-Name..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMilestoneDialog(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveMilestone}>
              <Diamond className="h-4 w-4 mr-2" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Projekt bearbeiten" : "Neues Projekt erstellen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                placeholder="Projektname..."
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Projektbeschreibung..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anlage</Label>
                <Select
                  value={projectForm.plant}
                  onValueChange={(v) =>
                    setProjectForm({ ...projectForm, plant: v as Plant })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      status: v as Project["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Geplant</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Arbeit</SelectItem>
                    <SelectItem value="ON_HOLD">Pausiert</SelectItem>
                    <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                    <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priorität</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map(
                  (priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={
                        projectForm.priority === priority
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setProjectForm({
                          ...projectForm,
                          priority: priority as Project["priority"],
                        })
                      }
                      className={cn(
                        "h-10",
                        projectForm.priority === priority &&
                          getPriorityBadgeClass(priority)
                      )}
                    >
                      {getPriorityLabel(priority)}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Enddatum</Label>
                <Input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProjectDialog(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveProject}>
              {isEditMode ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="Aufgabentitel..."
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                placeholder="Beschreibung..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Zugewiesen an</Label>
              <Select
                value={taskForm.assignedTo || "none"}
                onValueChange={(v) =>
                  setTaskForm({
                    ...taskForm,
                    assignedTo: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Person auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nicht zugewiesen</SelectItem>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={`${user.firstName} ${user.lastName}`}
                    >
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={taskForm.status}
                onValueChange={(v) =>
                  setTaskForm({ ...taskForm, status: v as TaskStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Offen</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Arbeit</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveTask}>
              {isEditMode ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog
        open={showDeleteProjectDialog}
        onOpenChange={setShowDeleteProjectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Projekt "{selectedProject?.name}" wirklich
              löschen? Alle zugehörigen Aufgaben werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog */}
      <AlertDialog
        open={showDeleteTaskDialog}
        onOpenChange={setShowDeleteTaskDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Aufgabe wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
