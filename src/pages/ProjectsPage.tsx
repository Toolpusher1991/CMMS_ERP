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
  NodeResizer,
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
  AlertTriangle,
  Diamond,
  Package,
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
  needsMaterial?: boolean;
  materialTaskCreated?: boolean;
  onEdit?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onMaterialToggle?: (taskId: string, needsMaterial: boolean) => void;
}

interface MilestoneNodeData extends Record<string, unknown> {
  label: string;
  completed?: boolean;
}

interface GroupNodeData extends Record<string, unknown> {
  label?: string;
  childCount?: number;
  onRename?: (newLabel: string) => void;
  onDissolve?: () => void;
  onRequestDissolve?: () => void;
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
    console.log(
      "Double click - taskId:",
      data.taskId,
      "onEdit:",
      !!data.onEdit,
    );
    if (data.onEdit && data.taskId) {
      data.onEdit(data.taskId);
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      "Status click - taskId:",
      data.taskId,
      "onToggleStatus:",
      !!data.onToggleStatus,
    );
    if (data.onToggleStatus && data.taskId) {
      data.onToggleStatus(data.taskId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      "Delete click - taskId:",
      data.taskId,
      "onDelete:",
      !!data.onDelete,
    );
    if (data.onDelete && data.taskId) {
      data.onDelete(data.taskId);
    }
  };

  const handleMaterialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onMaterialToggle && data.taskId && !data.materialTaskCreated) {
      data.onMaterialToggle(data.taskId, !data.needsMaterial);
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
        "px-4 py-3 rounded-lg border-2 shadow-md min-w-[200px] max-w-[280px] cursor-pointer transition-all hover:shadow-lg border-l-4",
        statusColors[data.status],
        priorityColors[data.priority || "NORMAL"],
        data.status === "DONE" && "opacity-90",
        isOverdue && "ring-2 ring-red-500/50",
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
            data.status === "DONE" && "line-through text-muted-foreground",
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
              isOverdue ? "text-red-500 font-medium" : "text-muted-foreground",
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
      {/* Material bestellen Button */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleMaterialClick}
          disabled={data.materialTaskCreated}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all w-full justify-center",
            data.materialTaskCreated
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-default"
              : data.needsMaterial
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-200"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
          )}
          title={data.materialTaskCreated ? "Material-Aufgabe wurde erstellt" : "Material bestellen - erstellt eine verknüpfte Aufgabe"}
        >
          <Package className="h-3 w-3" />
          {data.materialTaskCreated ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Material-Aufgabe erstellt
            </>
          ) : (
            "Material bestellen"
          )}
        </button>
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
          : "bg-amber-100 border-amber-400 dark:bg-amber-900 dark:border-amber-500",
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
            data.completed ? "text-white" : "text-amber-600",
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

// Group Node - Sauberer Container für gruppierte Aufgaben mit Resize-Funktion
function GroupNode({ data, selected }: { data: GroupNodeData; selected?: boolean }) {
  const count = data.childCount || 0;

  const handleDoubleClick = () => {
    const newLabel = prompt("Gruppenname:", data.label || `${count} Aufgaben`);
    if (newLabel !== null && data.onRename) {
      data.onRename(newLabel.trim() || `${count} Aufgaben`);
    }
  };

  return (
    <>
      <NodeResizer
        minWidth={260}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-indigo-500"
        handleClassName="!w-3 !h-3 !bg-indigo-500 !border-indigo-600"
      />
      <div
        className="rounded-lg h-full"
        style={{
          border: "2px solid #6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.05)",
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-indigo-500"
          style={{ top: "50%" }}
        />
        {/* Header - Doppelklick zum Umbenennen */}
        <div
          className="px-3 py-1 rounded-t-md text-xs font-semibold text-white flex items-center justify-between gap-2 cursor-pointer"
          style={{ backgroundColor: "#6366f1" }}
          onDoubleClick={handleDoubleClick}
          title="Doppelklick zum Umbenennen"
        >
          <span>{data.label || `${count} Aufgaben`}</span>
          {data.onDissolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onRequestDissolve?.();
              }}
              className="hover:bg-white/20 rounded px-1 text-[10px]"
              title="Gruppe auflösen"
            >
              ✕
            </button>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-indigo-500"
          style={{ top: "50%" }}
        />
      </div>
    </>
  );
}

const nodeTypes = {
  task: TaskFlowNode,
  start: StartNode,
  end: EndNode,
  milestone: MilestoneNode,
  group: GroupNode,
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

// Helper function to get task order from flowchart
const getFlowchartTaskOrder = (project: Project): Map<string, number> => {
  const orderMap = new Map<string, number>();

  if (!project.flowData) {
    return orderMap;
  }

  try {
    const flowData: SavedFlowData = JSON.parse(project.flowData);
    const { nodes, edges } = flowData;

    // Build adjacency list from edges
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize with task nodes
    nodes.forEach((node) => {
      if (node.type === "task" && node.data?.taskId) {
        adjacency.set(node.id, []);
        inDegree.set(node.id, 0);
      }
    });

    // Also consider start node to find initial tasks
    adjacency.set("start", []);
    inDegree.set("start", 0);

    // Build graph
    edges.forEach((edge) => {
      const source = edge.source;
      const target = edge.target;

      if (
        adjacency.has(source) &&
        (adjacency.has(target) || target === "end")
      ) {
        if (adjacency.has(target)) {
          adjacency.get(source)?.push(target);
          inDegree.set(target, (inDegree.get(target) || 0) + 1);
        }
      }
    });

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    let orderNumber = 1;
    while (queue.length > 0) {
      const current = queue.shift()!;

      // Assign order to task nodes (not start node)
      if (current !== "start") {
        const node = nodes.find((n) => n.id === current);
        if (node?.data?.taskId) {
          orderMap.set(node.data.taskId as string, orderNumber++);
        }
      }

      adjacency.get(current)?.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Add tasks not in flow at the end
    const tasks = project.tasks || [];
    tasks.forEach((task) => {
      if (!orderMap.has(task.id)) {
        orderMap.set(task.id, orderNumber++);
      }
    });
  } catch {
    // If parsing fails, return empty map
  }

  return orderMap;
};

// Sort tasks by flowchart order
const sortTasksByFlowOrder = (
  tasks: ProjectTask[],
  orderMap: Map<string, number>,
): ProjectTask[] => {
  if (orderMap.size === 0) {
    return tasks;
  }

  return [...tasks].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? Number.MAX_VALUE;
    const orderB = orderMap.get(b.id) ?? Number.MAX_VALUE;
    return orderA - orderB;
  });
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
    new Set(),
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
    managerId: "",
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

  // Confirmation Dialog States
  const [showDeleteEdgeDialog, setShowDeleteEdgeDialog] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null);
  const [showDeleteFlowTaskDialog, setShowDeleteFlowTaskDialog] =
    useState(false);
  const [flowTaskToDelete, setFlowTaskToDelete] = useState<string | null>(null);
  const [showDissolveGroupDialog, setShowDissolveGroupDialog] = useState(false);
  const [groupToDissolve, setGroupToDissolve] = useState<(() => void) | null>(
    null,
  );
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
          p.status === "ON_HOLD",
      ).length;
      return {
        total: plantProjects.length,
        active: activeCount,
        completed: plantProjects.filter((p) => p.status === "COMPLETED").length,
        totalTasks: plantProjects.reduce(
          (sum, p) => sum + (p.tasks?.length || 0),
          0,
        ),
      };
    },
    [projects],
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
  const handleEditTaskFromFlow = useCallback((taskId: string) => {
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
  }, []);

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
          }),
        );

        // Reload project data
        const { projects: updatedProjects } =
          await projectService.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find((p) => p.id === project.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
          selectedProjectRef.current = updatedProject;
        }

        setHasFlowChanges(true);
      } catch (error) {
        console.error("Error updating task status:", error);
      }
    },
    [setNodes],
  );

  // Delete Task from Flow
  const handleDeleteTaskFromFlow = useCallback(async (taskId: string) => {
    const project = selectedProjectRef.current;
    if (!project) return;

    setFlowTaskToDelete(taskId);
    setShowDeleteFlowTaskDialog(true);
  }, []);

  // Confirm task deletion from flow
  const confirmDeleteTaskFromFlow = useCallback(async () => {
    const taskId = flowTaskToDelete;
    const project = selectedProjectRef.current;
    if (!project || !taskId) {
      setFlowTaskToDelete(null);
      setShowDeleteFlowTaskDialog(false);
      return;
    }

    try {
      await projectService.deleteTask(project.id, taskId);

      // Remove node from flow
      setNodes((nds) => nds.filter((node) => node.id !== `task-${taskId}`));
      // Remove edges connected to this node
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== `task-${taskId}` &&
            edge.target !== `task-${taskId}`,
        ),
      );

      // Reload project data
      const { projects: updatedProjects } = await projectService.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find((p) => p.id === project.id);
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
    } finally {
      setFlowTaskToDelete(null);
      setShowDeleteFlowTaskDialog(false);
    }
  }, [flowTaskToDelete, setNodes, setEdges, toast]);

  // Handle Material Toggle - Creates a linked "Material bestellen" task
  const handleMaterialToggle = useCallback(
    async (taskId: string, needsMaterial: boolean) => {
      const project = selectedProjectRef.current;
      if (!project || !needsMaterial) return;

      try {
        // Find the source node to get task info
        const sourceNode = nodes.find((n) => n.data?.taskId === taskId);
        if (!sourceNode) return;

        // Create a new "Material bestellen" task in the database
        const materialTask = await projectService.createTask(project.id, {
          title: `📦 Material: ${sourceNode.data.label}`,
          description: `Material bestellen für: ${sourceNode.data.label}\n\nHinweis: Diese Aufgabe wurde automatisch erstellt.`,
          status: "TODO",
          priority: "HIGH",
        });

        // Find position to the right of the source node
        let sourceX = sourceNode.position.x;
        let sourceY = sourceNode.position.y;
        if (sourceNode.parentId) {
          const parent = nodes.find((n) => n.id === sourceNode.parentId);
          if (parent) {
            sourceX += parent.position.x;
            sourceY += parent.position.y;
          }
        }

        // Create the new node to the right of the source task
        const newNode: Node = {
          id: `task-${materialTask.id}`,
          type: "task",
          position: {
            x: sourceX + 300,
            y: sourceY,
          },
          data: {
            label: materialTask.title,
            status: materialTask.status,
            description: materialTask.description,
            taskId: materialTask.id,
            priority: "HIGH",
            needsMaterial: false,
            materialTaskCreated: false,
            onEdit: handleEditTaskFromFlow,
            onToggleStatus: handleToggleTaskFromFlow,
            onDelete: handleDeleteTaskFromFlow,
            onMaterialToggle: handleMaterialToggle,
          },
        };

        // Create an edge from source to material task
        const newEdge: Edge = {
          id: `edge-material-${taskId}-${materialTask.id}`,
          source: `task-${taskId}`,
          target: `task-${materialTask.id}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#f97316", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#f97316",
          },
        };

        // Update the source node to mark material task as created
        setNodes((nds) => [
          ...nds.map((node) =>
            node.data?.taskId === taskId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    needsMaterial: true,
                    materialTaskCreated: true,
                  },
                }
              : node
          ),
          newNode,
        ]);

        setEdges((eds) => [...eds, newEdge]);

        // Reload project data
        const { projects: updatedProjects } = await projectService.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find((p) => p.id === project.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
          selectedProjectRef.current = updatedProject;
        }

        setHasFlowChanges(true);
        toast({
          title: "Material-Aufgabe erstellt",
          description: `Eine neue Aufgabe für Materialbestellung wurde erstellt und verknüpft.`,
        });
      } catch (error) {
        console.error("Error creating material task:", error);
        toast({
          title: "Fehler",
          description: "Material-Aufgabe konnte nicht erstellt werden.",
          variant: "destructive",
        });
      }
    },
    [nodes, setNodes, setEdges, toast, handleEditTaskFromFlow, handleToggleTaskFromFlow, handleDeleteTaskFromFlow]
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
          needsMaterial: false,
          materialTaskCreated: false,
          onEdit: handleEditTaskFromFlow,
          onToggleStatus: handleToggleTaskFromFlow,
          onDelete: handleDeleteTaskFromFlow,
          onMaterialToggle: handleMaterialToggle,
        },
      };

      setNodes((nds) => [...nds, newNode]);

      // Reload project data
      const { projects: updatedProjects } = await projectService.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(
        (p) => p.id === selectedProject.id,
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
            u.email === flowTaskForm.assignedTo,
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
    handleMaterialToggle,
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

  // Constants for grouping
  const NODE_WIDTH = 240;
  const NODE_HEIGHT = 95;
  const NODE_MIN_WIDTH = 240;
  const GROUP_PADDING = 12;
  const GROUP_HEADER = 32;
  const NODE_GAP = 10;

  // Helper: Recalculate group size and reposition children
  const recalculateGroup = useCallback(
    (groupId: string, currentNodes: Node[]): Node[] => {
      const childNodes = currentNodes.filter((n) => n.parentId === groupId);
      if (childNodes.length === 0) {
        // Remove empty group
        return currentNodes.filter((n) => n.id !== groupId);
      }

      // Find the widest child node (use measured width if available)
      const maxChildWidth = Math.max(
        NODE_MIN_WIDTH,
        ...childNodes.map(
          (n) => (n.measured?.width as number) || NODE_MIN_WIDTH,
        ),
      );

      // Stack children vertically
      const sortedChildren = [...childNodes].sort(
        (a, b) => a.position.y - b.position.y,
      );
      const baseY = GROUP_HEADER + GROUP_PADDING;

      const repositionedNodes = currentNodes.map((node) => {
        const childIndex = sortedChildren.findIndex((c) => c.id === node.id);
        if (childIndex !== -1) {
          return {
            ...node,
            position: {
              x: GROUP_PADDING,
              y: baseY + childIndex * (NODE_HEIGHT + NODE_GAP),
            },
          };
        }
        return node;
      });

      // Update group size - use max child width
      const groupHeight =
        GROUP_HEADER +
        GROUP_PADDING * 2 +
        childNodes.length * NODE_HEIGHT +
        (childNodes.length - 1) * NODE_GAP;
      const groupWidth = maxChildWidth + GROUP_PADDING * 2;

      return repositionedNodes.map((node) => {
        if (node.id === groupId) {
          return {
            ...node,
            style: { ...node.style, width: groupWidth, height: groupHeight },
            data: {
              ...node.data,
              childCount: childNodes.length,
              label: `${childNodes.length} Aufgaben`,
            },
          };
        }
        return node;
      });
    },
    [],
  );

  // Handle drag stop - grouping logic
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      // Prevent group overlapping
      if (draggedNode.type === "group") {
        const draggedWidth = (draggedNode.style?.width as number) || 250;
        const draggedHeight = (draggedNode.style?.height as number) || 200;

        const overlappingGroup = nodes.find((node) => {
          if (node.type !== "group") return false;
          if (node.id === draggedNode.id) return false;

          const nodeWidth = (node.style?.width as number) || 250;
          const nodeHeight = (node.style?.height as number) || 200;

          // Check for overlap
          const overlapX =
            draggedNode.position.x < node.position.x + nodeWidth &&
            draggedNode.position.x + draggedWidth > node.position.x;
          const overlapY =
            draggedNode.position.y < node.position.y + nodeHeight &&
            draggedNode.position.y + draggedHeight > node.position.y;

          return overlapX && overlapY;
        });

        if (overlappingGroup) {
          // Push the group away from the overlapping group with better spacing
          const overlapWidth = (overlappingGroup.style?.width as number) || 250;
          const overlapHeight = (overlappingGroup.style?.height as number) || 200;
          const draggedWidth = (draggedNode.style?.width as number) || 250;
          
          // Determine best direction to push (right or down)
          const pushRight = draggedNode.position.x >= overlappingGroup.position.x;
          
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === draggedNode.id) {
                if (pushRight) {
                  // Move to the right of the overlapping group
                  return {
                    ...node,
                    position: {
                      x: overlappingGroup.position.x + overlapWidth + 40,
                      y: draggedNode.position.y,
                    },
                  };
                } else {
                  // Move to the left of the overlapping group
                  return {
                    ...node,
                    position: {
                      x: overlappingGroup.position.x - draggedWidth - 40,
                      y: draggedNode.position.y,
                    },
                  };
                }
              }
              return node;
            }),
          );

          toast({
            title: "Überlappung vermieden",
            description: "Gruppen können nicht übereinander platziert werden.",
            variant: "destructive",
          });
          return;
        }
        return;
      }

      if (draggedNode.type !== "task") return;

      // Get absolute position of dragged node
      let dragAbsX = draggedNode.position.x;
      let dragAbsY = draggedNode.position.y;
      if (draggedNode.parentId) {
        const parent = nodes.find((n) => n.id === draggedNode.parentId);
        if (parent) {
          dragAbsX += parent.position.x;
          dragAbsY += parent.position.y;
        }
      }

      // Center of dragged node
      const dragCenterX = dragAbsX + NODE_WIDTH / 2;
      const dragCenterY = dragAbsY + NODE_HEIGHT / 2;

      // Check if dropped on existing group (not the one it's already in)
      const targetGroup = nodes.find((node) => {
        if (node.type !== "group") return false;
        if (draggedNode.parentId === node.id) return false;

        const groupWidth = (node.style?.width as number) || 250;
        const groupHeight = (node.style?.height as number) || 200;

        // Check if center of dragged node is inside group
        return (
          dragCenterX >= node.position.x &&
          dragCenterX <= node.position.x + groupWidth &&
          dragCenterY >= node.position.y &&
          dragCenterY <= node.position.y + groupHeight
        );
      });

      if (targetGroup) {
        // Add to existing group
        setNodes((nds) => {
          const oldParentId = draggedNode.parentId;
          let updatedNodes = nds.map((node) => {
            if (node.id === draggedNode.id) {
              return {
                ...node,
                position: { x: GROUP_PADDING, y: 0 },
                parentId: targetGroup.id,
              };
            }
            return node;
          });

          updatedNodes = recalculateGroup(targetGroup.id, updatedNodes);

          if (oldParentId) {
            updatedNodes = recalculateGroup(oldParentId, updatedNodes);
          }

          return updatedNodes;
        });

        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== draggedNode.id && e.target !== draggedNode.id,
          ),
        );

        setHasFlowChanges(true);
        toast({
          title: "Zur Gruppe hinzugefügt",
          description: "Aufgabe wurde zur Gruppe hinzugefügt.",
        });
        return;
      }

      // Check if overlapping with another task (create new group)
      // Skip if dragged node is in a group (it should be added to existing group instead)
      if (draggedNode.parentId) {
        // Node was dragged out of group but not into another group
        // Check if it's outside its current group
        const currentGroup = nodes.find((n) => n.id === draggedNode.parentId);
        if (currentGroup) {
          const groupWidth = (currentGroup.style?.width as number) || 250;
          const groupHeight = (currentGroup.style?.height as number) || 200;
          const isOutsideGroup =
            dragCenterX < currentGroup.position.x ||
            dragCenterX > currentGroup.position.x + groupWidth ||
            dragCenterY < currentGroup.position.y ||
            dragCenterY > currentGroup.position.y + groupHeight;

          if (isOutsideGroup) {
            // Remove from group
            setNodes((nds) => {
              let updatedNodes = nds.map((node) => {
                if (node.id === draggedNode.id) {
                  return {
                    ...node,
                    position: { x: dragAbsX, y: dragAbsY },
                    parentId: undefined,
                  };
                }
                return node;
              });
              // Recalculate old group
              updatedNodes = recalculateGroup(
                draggedNode.parentId!,
                updatedNodes,
              );
              return updatedNodes;
            });
            setHasFlowChanges(true);
            toast({
              title: "Aus Gruppe entfernt",
              description: "Aufgabe wurde aus der Gruppe entfernt.",
            });
          }
        }
        return;
      }

      const overlappingTask = nodes.find((node) => {
        if (node.id === draggedNode.id) return false;
        if (node.type !== "task") return false;
        if (node.parentId) return false; // Task already in a group

        // Calculate center of other node
        const nodeCenterX = node.position.x + NODE_WIDTH / 2;
        const nodeCenterY = node.position.y + NODE_HEIGHT / 2;

        // Distance between centers
        const dx = Math.abs(dragCenterX - nodeCenterX);
        const dy = Math.abs(dragCenterY - nodeCenterY);

        // Overlap if centers are close enough
        return dx < NODE_WIDTH * 0.7 && dy < NODE_HEIGHT * 0.7;
      });

      if (overlappingTask) {
        // Create new group - use absolute positions
        const groupId = `group-${Date.now()}`;
        const groupX =
          Math.min(dragAbsX, overlappingTask.position.x) - GROUP_PADDING;
        const groupY =
          Math.min(dragAbsY, overlappingTask.position.y) -
          GROUP_HEADER -
          GROUP_PADDING;
        const groupHeight =
          GROUP_HEADER + GROUP_PADDING * 2 + 2 * NODE_HEIGHT + NODE_GAP;

        // Use measured widths if available, otherwise use minimum
        const draggedWidth =
          (draggedNode.measured?.width as number) || NODE_MIN_WIDTH;
        const overlappingWidth =
          (overlappingTask.measured?.width as number) || NODE_MIN_WIDTH;
        const maxWidth = Math.max(
          draggedWidth,
          overlappingWidth,
          NODE_MIN_WIDTH,
        );
        const groupWidth = maxWidth + GROUP_PADDING * 2;

        const groupNode: Node = {
          id: groupId,
          type: "group",
          position: { x: groupX, y: groupY },
          style: { width: groupWidth, height: groupHeight },
          data: { label: "2 Aufgaben", childCount: 2 },
          zIndex: -1,
        };

        setNodes((nds) => {
          const updatedNodes = nds.map((node) => {
            if (node.id === draggedNode.id) {
              return {
                ...node,
                position: { x: GROUP_PADDING, y: GROUP_HEADER + GROUP_PADDING },
                parentId: groupId,
              };
            }
            if (node.id === overlappingTask.id) {
              return {
                ...node,
                position: {
                  x: GROUP_PADDING,
                  y: GROUP_HEADER + GROUP_PADDING + NODE_HEIGHT + NODE_GAP,
                },
                parentId: groupId,
              };
            }
            return node;
          });
          return [groupNode, ...updatedNodes];
        });

        // Remove ALL edges connected to grouped nodes (no edges from/to grouped nodes)
        setEdges((eds) =>
          eds.filter(
            (e) =>
              e.source !== draggedNode.id &&
              e.target !== draggedNode.id &&
              e.source !== overlappingTask.id &&
              e.target !== overlappingTask.id,
          ),
        );

        setHasFlowChanges(true);
        toast({
          title: "Gruppe erstellt",
          description: "2 Aufgaben wurden gruppiert.",
        });
      }
    },
    [nodes, setNodes, setEdges, recalculateGroup, toast],
  );

  // Group rename handler
  const handleRenameGroup = useCallback(
    (groupId: string, newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === groupId) {
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        }),
      );
      setHasFlowChanges(true);
    },
    [setNodes],
  );

  // Group dissolve handler
  const handleDissolveGroup = useCallback(
    (groupId: string) => {
      const groupNode = nodes.find((n) => n.id === groupId);
      if (!groupNode) return;

      setNodes((nds) => {
        // Get children and remove parentId, set absolute position
        const children = nds.filter((n) => n.parentId === groupId);
        const updatedNodes = nds
          .filter((n) => n.id !== groupId) // Remove group
          .map((node) => {
            if (node.parentId === groupId) {
              const childIndex = children.findIndex((c) => c.id === node.id);
              return {
                ...node,
                position: {
                  x: groupNode.position.x + GROUP_PADDING,
                  y:
                    groupNode.position.y +
                    GROUP_HEADER +
                    GROUP_PADDING +
                    childIndex * (NODE_HEIGHT + NODE_GAP),
                },
                parentId: undefined,
              };
            }
            return node;
          });
        return updatedNodes;
      });
      setHasFlowChanges(true);
      toast({
        title: "Gruppe aufgelöst",
        description: "Die Aufgaben wurden aus der Gruppe entfernt.",
      });
    },
    [nodes, setNodes, toast],
  );

  // Add callbacks to group nodes AND ensure task nodes have their callbacks
  const nodesWithGroupCallbacks = useMemo(
    () =>
      nodes.map((node) => {
        if (node.type === "group") {
          return {
            ...node,
            data: {
              ...node.data,
              onRename: (newLabel: string) =>
                handleRenameGroup(node.id, newLabel),
              onDissolve: () => handleDissolveGroup(node.id),
              onRequestDissolve: () => {
                setGroupToDissolve(() => () => handleDissolveGroup(node.id));
                setShowDissolveGroupDialog(true);
              },
            },
          };
        }
        // Ensure all task nodes have their callbacks (especially important for grouped tasks)
        if (node.type === "task") {
          return {
            ...node,
            data: {
              ...node.data,
              onEdit: handleEditTaskFromFlow,
              onToggleStatus: handleToggleTaskFromFlow,
              onDelete: handleDeleteTaskFromFlow,
              onMaterialToggle: handleMaterialToggle,
            },
          };
        }
        return node;
      }),
    [
      nodes,
      handleRenameGroup,
      handleDissolveGroup,
      handleEditTaskFromFlow,
      handleToggleTaskFromFlow,
      handleDeleteTaskFromFlow,
      handleMaterialToggle,
    ],
  );

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
                (t) => t.id === node.data.taskId,
              );
              if (task) {
                return {
                  ...node,
                  id: node.id,
                  type: node.type,
                  position: node.position,
                  parentId: node.parentId,
                  expandParent: node.expandParent,
                  style: node.style,
                  zIndex: node.zIndex,
                  data: {
                    ...node.data,
                    label: task.title,
                    status: task.status,
                    description: task.description,
                    assignedTo: task.assignedTo,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    needsMaterial: node.data.needsMaterial || false,
                    materialTaskCreated: node.data.materialTaskCreated || false,
                    onEdit: handleEditTaskFromFlow,
                    onToggleStatus: handleToggleTaskFromFlow,
                    onDelete: handleDeleteTaskFromFlow,
                    onMaterialToggle: handleMaterialToggle,
                  },
                };
              }
            }
            // For group nodes and other types, preserve all properties
            return {
              ...node,
              id: node.id,
              type: node.type,
              position: node.position,
              parentId: node.parentId,
              expandParent: node.expandParent,
              style: node.style,
              zIndex: node.zIndex,
              data: node.data,
            };
          });
          // Sort nodes so parents come before children
          const sortedNodes = updatedNodes.sort((a, b) => {
            if (a.type === "group" && b.type !== "group") return -1;
            if (a.type !== "group" && b.type === "group") return 1;
            return 0;
          });
          setNodes(sortedNodes);
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
          needsMaterial: false,
          materialTaskCreated: false,
          onEdit: handleEditTaskFromFlow,
          onToggleStatus: handleToggleTaskFromFlow,
          onDelete: handleDeleteTaskFromFlow,
          onMaterialToggle: handleMaterialToggle,
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
      handleMaterialToggle,
      setNodes,
      setEdges,
    ],
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
    [setEdges],
  );

  // Handler for deleting edges on click/tap (for iPad support)
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setEdgeToDelete(edge);
    setShowDeleteEdgeDialog(true);
  }, []);

  // Confirm edge deletion
  const handleConfirmDeleteEdge = useCallback(() => {
    if (edgeToDelete) {
      setEdges((eds) => eds.filter((e) => e.id !== edgeToDelete.id));
      setHasFlowChanges(true);
      toast({
        title: "Verbindung gelöscht",
        description: "Die Verbindung wurde entfernt.",
      });
    }
    setEdgeToDelete(null);
    setShowDeleteEdgeDialog(false);
  }, [edgeToDelete, setEdges, toast]);

  const saveFlow = async () => {
    if (!selectedProject) return;

    try {
      // Remove callback functions from nodes before saving (they can't be serialized)
      const cleanedNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          onEdit: undefined,
          onToggleStatus: undefined,
          onDelete: undefined,
        },
        style: node.style,
        parentId: node.parentId,
        expandParent: node.expandParent,
        zIndex: node.zIndex,
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
      managerId: "",
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
      managerId: project.managerId || "",
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
        await projectService.updateProject(selectedProject.id, {
          ...projectForm,
          managerId: projectForm.managerId || undefined,
        });
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
          managerId: projectForm.managerId || undefined,
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
          taskForm,
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
            }),
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
            u.email === taskForm.assignedTo,
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
          (p) => p.id === selectedProject.id,
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
        taskToDelete.taskId,
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
                        const flowOrderMap = getFlowchartTaskOrder(project);
                        const tasks = sortTasksByFlowOrder(
                          project.tasks || [],
                          flowOrderMap,
                        );
                        const completedTasks = tasks.filter(
                          (t) => t.status === "DONE",
                        ).length;

                        return (
                          <Card
                            key={project.id}
                            className={cn(
                              "transition-all hover:shadow-md",
                              project.status === "COMPLETED" && "opacity-70",
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
                                        getStatusBadgeClass(project.status),
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
                                        getPriorityBadgeClass(project.priority),
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
                                          getProgressColor(progress),
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
                                            project.startDate,
                                          ).toLocaleDateString("de-DE")}
                                        </span>
                                      )}
                                      {project.endDate && (
                                        <span className="flex items-center gap-1">
                                          <Target className="h-3 w-3" />
                                          Ende:{" "}
                                          {new Date(
                                            project.endDate,
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
                                    <div className="space-y-1">
                                      {tasks.map((task, index) => {
                                        const flowOrder = flowOrderMap.get(
                                          task.id,
                                        );
                                        const priorityBorderColors: Record<
                                          string,
                                          string
                                        > = {
                                          URGENT: "border-l-red-500",
                                          HIGH: "border-l-orange-500",
                                          NORMAL: "border-l-blue-500",
                                          LOW: "border-l-gray-400",
                                        };
                                        return (
                                          <div
                                            key={task.id}
                                            className={cn(
                                              "flex items-center justify-between p-2 px-3 bg-muted/30 rounded-md hover:bg-muted/60 transition-all border-l-4 group",
                                              priorityBorderColors[
                                                task.priority || "NORMAL"
                                              ],
                                              task.status === "DONE" &&
                                                "opacity-60",
                                            )}
                                          >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              {/* Task Number from Flow */}
                                              <span
                                                className={cn(
                                                  "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                                                  task.status === "DONE"
                                                    ? "bg-green-500/20 text-green-600"
                                                    : "bg-primary/10 text-primary",
                                                )}
                                              >
                                                {flowOrder ?? index + 1}
                                              </span>
                                              <button
                                                onClick={() =>
                                                  toggleTaskStatus(
                                                    project,
                                                    task,
                                                  )
                                                }
                                                className="hover:scale-110 transition-transform flex-shrink-0"
                                              >
                                                {task.status === "DONE" ? (
                                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                ) : task.status ===
                                                  "IN_PROGRESS" ? (
                                                  <Clock className="h-4 w-4 text-blue-500" />
                                                ) : task.status === "REVIEW" ? (
                                                  <Eye className="h-4 w-4 text-yellow-600" />
                                                ) : (
                                                  <Circle className="h-4 w-4 text-gray-400" />
                                                )}
                                              </button>
                                              <div className="min-w-0 flex-1">
                                                <p
                                                  className={cn(
                                                    "font-medium text-sm truncate",
                                                    task.status === "DONE" &&
                                                      "line-through text-muted-foreground",
                                                  )}
                                                >
                                                  {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                  {task.description && (
                                                    <span className="truncate max-w-[200px]">
                                                      {task.description}
                                                    </span>
                                                  )}
                                                  {task.assignedTo && (
                                                    <span className="flex items-center gap-1 flex-shrink-0">
                                                      <UserIcon className="h-3 w-3" />
                                                      {task.assignedTo}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              <Badge
                                                className={cn(
                                                  "text-[10px] px-1.5 py-0 h-5",
                                                  getTaskStatusBadgeClass(
                                                    task.status,
                                                  ),
                                                )}
                                              >
                                                {getStatusLabel(task.status)}
                                              </Badge>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() =>
                                                  openEditTaskDialog(
                                                    project,
                                                    task,
                                                  )
                                                }
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => {
                                                  setTaskToDelete({
                                                    projectId: project.id,
                                                    taskId: task.id,
                                                  });
                                                  setShowDeleteTaskDialog(true);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })}
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
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-4">
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
                                (t) => t.status === "DONE",
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
            className="flex-1 h-[calc(95vh-100px)] border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
            ref={flowRef}
          >
            <ReactFlow
              nodes={nodesWithGroupCallbacks}
              edges={edges
                .filter((e) => {
                  // Hide edges from/to nodes that are in a group
                  const sourceNode = nodes.find((n) => n.id === e.source);
                  const targetNode = nodes.find((n) => n.id === e.target);
                  if (sourceNode?.parentId || targetNode?.parentId)
                    return false;
                  return true;
                })
                .map((e) => {
                  // Color edges green if source node is completed
                  const sourceNode = nodes.find((n) => n.id === e.source);
                  const sourceData = sourceNode?.data as
                    | FlowNodeData
                    | undefined;

                  // Check if source is a group - if so, check if all children are done
                  let isSourceDone = false;
                  if (sourceNode?.type === "start") {
                    isSourceDone = true;
                  } else if (sourceNode?.type === "group") {
                    // Get all child nodes of this group
                    const childNodes = nodes.filter(
                      (n) => n.parentId === sourceNode.id,
                    );
                    // Group is done if all children are done
                    isSourceDone =
                      childNodes.length > 0 &&
                      childNodes.every((child) => {
                        const childData = child.data as
                          | FlowNodeData
                          | undefined;
                        return childData?.status === "DONE";
                      });
                  } else if (sourceNode?.type === "milestone") {
                    isSourceDone =
                      (sourceNode.data as MilestoneNodeData)?.completed ===
                      true;
                  } else if (sourceData?.status === "DONE") {
                    isSourceDone = true;
                  }

                  return {
                    ...e,
                    style: {
                      stroke: isSourceDone ? "#22c55e" : "#64748b",
                      strokeWidth: isSourceDone ? 3 : 2,
                    },
                    animated: !isSourceDone, // Only animate if not completed
                  };
                })}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                setHasFlowChanges(true);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                setHasFlowChanges(true);
              }}
              onNodeDragStop={handleNodeDragStop}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              deleteKeyCode={["Backspace", "Delete"]}
              fitView
              className="bg-slate-50 dark:bg-slate-900"
            >
              <Controls className="!bg-slate-800 !border-slate-700 !shadow-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white [&>button:hover]:!bg-slate-600 [&>button>svg]:!fill-white" />
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
                          getPriorityBadgeClass(priority),
                      )}
                    >
                      {getPriorityLabel(priority)}
                    </Button>
                  ),
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
            <div className="space-y-2">
              <Label>Projektleiter</Label>
              <Select
                value={projectForm.managerId || "none"}
                onValueChange={(v) =>
                  setProjectForm({
                    ...projectForm,
                    managerId: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Projektleiter auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Projektleiter</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Delete Edge Dialog (Flowchart Connection) */}
      <AlertDialog
        open={showDeleteEdgeDialog}
        onOpenChange={(open) => {
          setShowDeleteEdgeDialog(open);
          if (!open) setEdgeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verbindung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Verbindung zwischen den Elementen wirklich
              entfernen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteEdge}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Flow Task Dialog */}
      <AlertDialog
        open={showDeleteFlowTaskDialog}
        onOpenChange={(open) => {
          setShowDeleteFlowTaskDialog(open);
          if (!open) setFlowTaskToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Aufgabe wirklich aus dem Flowchart löschen? Die
              Aufgabe wird dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTaskFromFlow}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dissolve Group Dialog */}
      <AlertDialog
        open={showDissolveGroupDialog}
        onOpenChange={(open) => {
          setShowDissolveGroupDialog(open);
          if (!open) setGroupToDissolve(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gruppe auflösen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Gruppe wirklich auflösen? Die enthaltenen
              Aufgaben bleiben erhalten und werden einzeln angezeigt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (groupToDissolve) {
                  groupToDissolve();
                }
                setGroupToDissolve(null);
                setShowDissolveGroupDialog(false);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Auflösen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
