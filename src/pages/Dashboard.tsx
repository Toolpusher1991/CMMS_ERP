import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { actionService, type Action } from "@/services/action.service";
import { projectService, type Project } from "@/services/project.service";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  AlertTriangle,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FailureReport {
  id: string;
  ticketNumber: string; // Format: T208-202510-001
  plant: "T208" | "T207" | "T700" | "T46";
  title: string;
  description: string;
  location?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "IN_REVIEW" | "CONVERTED_TO_ACTION" | "RESOLVED";
  photoFilename?: string;
  photoPath?: string;
  reportedBy: string;
  reportedByName: string;
  convertedToActionId?: string;
  convertedAt?: string;
  convertedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  openFailureReports: number;
  myProjects: number;
  myActions: number;
  completed: number;
}

interface QuickAccessItem {
  id: string;
  type: "project" | "action" | "task" | "failure";
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId?: string;
  isOverdue: boolean;
  plant?: string;
}

interface DashboardProps {
  onNavigate?: (page: string, itemId?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [failureReports, setFailureReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAccessFilter, setQuickAccessFilter] = useState<
    "all" | "projects" | "actions" | "failures"
  >("all");
  const [lastNavigatedPage, setLastNavigatedPage] = useState<string | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      const [actionsData, projectsData, failureReportsData] = await Promise.all(
        [
          actionService.getAll(),
          projectService.getProjects(),
          apiClient.request<FailureReport[]>("/failure-reports"),
        ]
      );

      setActions(actionsData);
      setProjects(projectsData.projects);
      setFailureReports(failureReportsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const calculateStats = (): DashboardStats => {
    if (!currentUser)
      return {
        openFailureReports: 0,
        myProjects: 0,
        myActions: 0,
        completed: 0,
      };

    // Count open failure reports (not converted to action and not resolved)
    const openFailureReports = failureReports.filter(
      (report) => report.status === "REPORTED" || report.status === "IN_REVIEW"
    ).length;

    const myProjects = projects
      .filter(
        (project) =>
          project.manager?.email === currentUser.email ||
          project.members?.some((m) => m.user.email === currentUser.email)
      )
      .filter(
        (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
      ).length;

    const myActions = actions.filter(
      (action) =>
        action.assignedTo === currentUser.email && action.status !== "COMPLETED"
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let completed = 0;

    completed += actions.filter(
      (action) =>
        action.assignedTo === currentUser.email &&
        action.status === "COMPLETED" &&
        action.completedAt &&
        new Date(action.completedAt) >= weekAgo
    ).length;

    projects.forEach((project) => {
      if (project.tasks) {
        completed += project.tasks.filter(
          (task) =>
            task.assignedTo === currentUser.email &&
            task.status === "DONE" &&
            task.completedAt &&
            new Date(task.completedAt) >= weekAgo
        ).length;
      }
    });

    return { openFailureReports, myProjects, myActions, completed };
  };

  const getQuickAccessItems = (): QuickAccessItem[] => {
    if (!currentUser) return [];

    const items: QuickAccessItem[] = [];

    // Add actions based on filter
    if (quickAccessFilter === "all" || quickAccessFilter === "actions") {
      actions
        .filter(
          (action) =>
            action.assignedTo === currentUser.email &&
            action.status !== "COMPLETED"
        )
        .forEach((action) => {
          items.push({
            id: action.id,
            type: "action",
            title: action.title,
            description: action.description,
            status: action.status,
            priority: action.priority,
            dueDate: action.dueDate,
            isOverdue: isOverdue(action.dueDate),
            plant: action.plant,
          });
        });
    }

    // Add projects based on filter
    if (quickAccessFilter === "all" || quickAccessFilter === "projects") {
      projects
        .filter(
          (project) =>
            (project.manager?.email === currentUser.email ||
              project.members?.some(
                (m) => m.user.email === currentUser.email
              )) &&
            project.status !== "COMPLETED" &&
            project.status !== "CANCELLED"
        )
        .forEach((project) => {
          items.push({
            id: project.id,
            type: "project",
            title: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            dueDate: project.endDate,
            isOverdue: isOverdue(project.endDate),
            plant: project.plant,
          });
        });
    }

    // Add tasks only if showing all
    if (quickAccessFilter === "all") {
      projects.forEach((project) => {
        if (project.tasks) {
          project.tasks
            .filter(
              (task) =>
                task.assignedTo === currentUser.email && task.status !== "DONE"
            )
            .forEach((task) => {
              items.push({
                id: task.id,
                type: "task",
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                projectId: project.id,
                isOverdue: isOverdue(task.dueDate),
              });
            });
        }
      });
    }

    // Add failure reports if filtered
    if (quickAccessFilter === "failures") {
      failureReports
        .filter(
          (report) =>
            report.status === "REPORTED" || report.status === "IN_REVIEW"
        )
        .forEach((report) => {
          items.push({
            id: report.id,
            type: "failure",
            title: report.title,
            description: report.description,
            status: report.status,
            priority: report.severity,
            dueDate: undefined,
            isOverdue: false,
            plant: report.plant,
          });
        });
    }

    return items.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;

      const priorityOrder = {
        URGENT: 0,
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        NORMAL: 2,
        LOW: 3,
      };
      const aPriority =
        priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority =
        priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;

      if (aPriority !== bPriority) return aPriority - bPriority;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return 0;
    });
  };

  const stats = calculateStats();
  const quickAccessItems = getQuickAccessItems();

  const handleItemClick = (item: QuickAccessItem) => {
    if (!onNavigate) return;

    if (item.type === "action") {
      setLastNavigatedPage("actions");
      onNavigate("actions", item.id);
    } else if (item.type === "project") {
      setLastNavigatedPage("projects");
      onNavigate("projects", item.id);
    } else if (item.type === "task" && item.projectId) {
      setLastNavigatedPage("projects");
      onNavigate("projects", item.projectId);
    } else if (item.type === "failure") {
      setLastNavigatedPage("failures");
      onNavigate("failure-reporting", item.id);
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === "action") {
      if (status === "COMPLETED")
        return "bg-green-500/10 text-green-700 border-green-500/20";
      if (status === "IN_PROGRESS")
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
    if (type === "project") {
      if (status === "COMPLETED")
        return "bg-green-500/10 text-green-700 border-green-500/20";
      if (status === "IN_PROGRESS")
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      if (status === "ON_HOLD")
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
    if (type === "task") {
      if (status === "DONE")
        return "bg-green-500/10 text-green-700 border-green-500/20";
      if (status === "IN_PROGRESS")
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      if (status === "REVIEW")
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
    return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "URGENT")
      return "bg-red-500/10 text-red-700 border-red-500/20";
    if (priority === "HIGH")
      return "bg-orange-500/10 text-orange-700 border-orange-500/20";
    if (priority === "NORMAL")
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  const getTypeIcon = (type: string) => {
    if (type === "action") return <ClipboardList className="h-4 w-4" />;
    if (type === "project") return <FolderKanban className="h-4 w-4" />;
    if (type === "failure") return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} Tage überfällig`;
    if (diffDays === 0) return "Heute fällig";
    if (diffDays === 1) return "Morgen fällig";
    if (diffDays <= 7) return `In ${diffDays} Tagen`;

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalItems =
    stats.openFailureReports + stats.myProjects + stats.myActions;
  const completionRate =
    totalItems > 0
      ? Math.round((stats.completed / (totalItems + stats.completed)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          {getGreeting()}, {currentUser?.firstName || "User"}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          {lastNavigatedPage === "projects"
            ? "Hier sind deine offenen Projekte"
            : lastNavigatedPage === "actions"
            ? "Hier sind deine offenen Actions"
            : lastNavigatedPage === "failures"
            ? "Hier sind die offenen Störmeldungen"
            : "Hier ist deine persönliche Übersicht für heute"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow cursor-pointer ${
            quickAccessFilter === "failures" ? "ring-2 ring-red-500" : ""
          }`}
          onClick={() => {
            setQuickAccessFilter("failures");
            setLastNavigatedPage("failures");
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Offene Störmeldungen
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">
              {stats.openFailureReports}
            </div>
            <p className="text-xs text-red-700 dark:text-red-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Noch nicht bearbeitet
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer ${
            quickAccessFilter === "projects" ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => {
            setQuickAccessFilter("projects");
            setLastNavigatedPage("projects");
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Meine Projekte
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.myProjects}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Aktive Projekte
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow cursor-pointer ${
            quickAccessFilter === "actions" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => {
            setQuickAccessFilter("actions");
            setLastNavigatedPage("actions");
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Meine Actions
            </CardTitle>
            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {stats.myActions}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Zu bearbeiten
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Diese Woche erledigt
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {stats.completed}
            </div>
            <div className="mt-3">
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                {completionRate}% Completion Rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Schnellzugriff
            </h2>
            <p className="text-muted-foreground">
              {quickAccessFilter === "all" &&
                "Deine zugewiesenen Aufgaben, Projekte und Actions"}
              {quickAccessFilter === "projects" &&
                "Deine zugewiesenen Projekte"}
              {quickAccessFilter === "actions" && "Deine zugewiesenen Actions"}
              {quickAccessFilter === "failures" && "Alle offenen Störmeldungen"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quickAccessFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickAccessFilter("all")}
              >
                Alle anzeigen
              </Button>
            )}
            <Badge variant="outline" className="text-sm">
              {quickAccessItems.length} Items
            </Badge>
          </div>
        </div>
        <div className="grid gap-3">
          {quickAccessItems.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold">
                  {quickAccessFilter === "failures"
                    ? "Keine offenen Störmeldungen! 🎉"
                    : "Alles erledigt! 🎉"}
                </h3>
                <p className="text-muted-foreground">
                  {quickAccessFilter === "failures"
                    ? "Es gibt momentan keine offenen Störmeldungen"
                    : "Du hast momentan keine offenen Aufgaben"}
                </p>
              </div>
            </Card>
          ) : (
            quickAccessItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${
                  item.isOverdue
                    ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                    : item.priority === "URGENT"
                    ? "border-l-orange-500"
                    : item.priority === "HIGH"
                    ? "border-l-yellow-500"
                    : "border-l-blue-500"
                }`}
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getTypeIcon(item.type)}</div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {item.title}
                          </h3>
                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {item.plant && (
                            <Badge
                              variant="secondary"
                              className="text-sm font-bold px-3 py-1"
                            >
                              {item.plant}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {item.type === "task"
                              ? "Task"
                              : item.type === "project"
                              ? "Projekt"
                              : item.type === "failure"
                              ? "Störmeldung"
                              : "Action"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(
                              item.status,
                              item.type
                            )}`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            {item.priority === "URGENT"
                              ? "Dringend"
                              : item.priority === "HIGH"
                              ? "Hoch"
                              : item.priority === "NORMAL"
                              ? "Normal"
                              : "Niedrig"}
                          </Badge>
                          {item.dueDate && (
                            <Badge
                              variant="outline"
                              className={`text-xs flex items-center gap-1 ${
                                item.isOverdue
                                  ? "bg-red-500/10 text-red-700 border-red-500/20"
                                  : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                              }`}
                            >
                              {item.isOverdue ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : (
                                <Calendar className="h-3 w-3" />
                              )}
                              {formatDate(item.dueDate)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      {quickAccessItems.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Tipp: Klicke auf ein Item um direkt zur Detail-Ansicht zu
                gelangen
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
