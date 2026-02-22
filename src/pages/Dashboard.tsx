import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { actionService, type Action } from "@/services/action.service";
import { projectService, type Project } from "@/services/project.service";
import { apiClient } from "@/services/api";
import {
  PRIORITY_CONFIG,
  ACTION_STATUS_CONFIG,
  PROJECT_STATUS_CONFIG,
  TASK_STATUS_CONFIG,
  getRelativeDateDE,
} from "@/lib/constants";
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
  Building2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCountUp } from "@/hooks/useCountUp";
import {
  DashboardStatsSkeleton,
  QuickAccessSkeleton,
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import type { FailureReport, DashboardStats, QuickAccessItem } from "@/types";

interface DashboardProps {
  onNavigate?: (page: string, itemId?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { toast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [failureReports, setFailureReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quickAccessFilter, setQuickAccessFilter] = useState<
    "all" | "projects" | "actions" | "failures"
  >("all");
  const [lastNavigatedPage, setLastNavigatedPage] = useState<string | null>(
    null,
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
      setLoadError(null);

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
        ],
      );

      setActions(actionsData);
      setProjects(projectsData.projects);
      setFailureReports(failureReportsData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      setLoadError(message);
      toast({
        variant: "destructive",
        title: "Fehler beim Laden",
        description: `Dashboard-Daten konnten nicht geladen werden: ${message}`,
      });
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

  const isOverdue = useCallback((dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }, []);

  // Memoized stats calculation for better performance
  const stats = useMemo((): DashboardStats => {
    if (!currentUser)
      return {
        openFailureReports: 0,
        myProjects: 0,
        myActions: 0,
        completed: 0,
      };

    // Count open failure reports (not converted to action and not resolved)
    const openFailureReports = failureReports.filter(
      (report) => report.status === "REPORTED" || report.status === "IN_REVIEW",
    ).length;

    const myProjects = projects
      .filter(
        (project) =>
          project.manager?.email === currentUser.email ||
          project.members?.some((m) => m.user.email === currentUser.email),
      )
      .filter(
        (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED",
      ).length;

    const myActions = actions.filter(
      (action) =>
        action.assignedTo === currentUser.email &&
        action.status !== "COMPLETED",
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let completed = 0;

    completed += actions.filter(
      (action) =>
        action.assignedTo === currentUser.email &&
        action.status === "COMPLETED" &&
        action.completedAt &&
        new Date(action.completedAt) >= weekAgo,
    ).length;

    projects.forEach((project) => {
      if (project.tasks) {
        completed += project.tasks.filter(
          (task) =>
            task.assignedTo === currentUser.email &&
            task.status === "DONE" &&
            task.completedAt &&
            new Date(task.completedAt) >= weekAgo,
        ).length;
      }
    });

    return {
      openFailureReports,
      myProjects,
      myActions,
      completed,
    };
  }, [currentUser, failureReports, projects, actions]);

  // Animated counts
  const animatedFailures = useCountUp(stats.openFailureReports, 1200, 100);
  const animatedProjects = useCountUp(stats.myProjects, 1200, 200);
  const animatedActions = useCountUp(stats.myActions, 1200, 300);
  const animatedCompleted = useCountUp(stats.completed, 1200, 400);

  const totalItems =
    stats.openFailureReports + stats.myProjects + stats.myActions;
  const completionRate =
    totalItems > 0
      ? Math.round((stats.completed / (totalItems + stats.completed)) * 100)
      : 0;
  const animatedCompletionRate = useCountUp(completionRate, 1500, 500);

  const getQuickAccessItems = (): QuickAccessItem[] => {
    if (!currentUser) return [];

    const items: QuickAccessItem[] = [];

    // Add actions based on filter
    if (quickAccessFilter === "all" || quickAccessFilter === "actions") {
      actions
        .filter(
          (action) =>
            action.assignedTo === currentUser.email &&
            action.status !== "COMPLETED",
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
                (m) => m.user.email === currentUser.email,
              )) &&
            project.status !== "COMPLETED" &&
            project.status !== "CANCELLED",
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
                task.assignedTo === currentUser.email && task.status !== "DONE",
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
            report.status === "REPORTED" || report.status === "IN_REVIEW",
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
    const key = status.toUpperCase();
    const fallback = "bg-gray-500/10 text-gray-700 border-gray-500/20";
    if (type === "action") {
      return (
        (ACTION_STATUS_CONFIG as Record<string, { color: string }>)[key]
          ?.color ?? fallback
      );
    }
    if (type === "project") {
      return (
        (PROJECT_STATUS_CONFIG as Record<string, { color: string }>)[key]
          ?.color ?? fallback
      );
    }
    if (type === "task") {
      return (
        (TASK_STATUS_CONFIG as Record<string, { color: string }>)[key]?.color ??
        fallback
      );
    }
    return fallback;
  };

  const getPriorityColor = (priority: string) => {
    const key = priority.toUpperCase();
    return (
      (PRIORITY_CONFIG as Record<string, { color: string }>)[key]?.color ??
      "bg-gray-500/10 text-gray-700 border-gray-500/20"
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === "action") return <ClipboardList className="h-4 w-4" />;
    if (type === "project") return <FolderKanban className="h-4 w-4" />;
    if (type === "failure") return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const formatDate = (dateStr?: string) => getRelativeDateDE(dateStr);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Skeleton Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-black p-8 shadow-xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/10 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <DashboardStatsSkeleton />

        {/* Quick Access Skeleton */}
        <QuickAccessSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Error Banner */}
      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Fehler beim Laden der Dashboard-Daten
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loadError}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      )}

      {/* Welcome Banner with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-black p-8 shadow-xl border border-slate-700/50">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))]"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Greeting & Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {/* Company Logo Placeholder */}
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                <Building2 className="h-8 w-8 text-slate-200" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {getGreeting()}, {currentUser?.firstName || "User"}!
                </h1>
                <p className="text-slate-300 text-sm md:text-base mt-1">
                  {currentUser?.email || "Willkommen im CMMS"}
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl">
              {lastNavigatedPage === "projects"
                ? "Hier sind deine offenen Projekte"
                : lastNavigatedPage === "actions"
                  ? "Hier sind deine offenen Actions"
                  : lastNavigatedPage === "failures"
                    ? "Hier sind die offenen Störmeldungen"
                    : "Deine persönliche Übersicht für heute"}
            </p>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-white">
                {animatedFailures + animatedProjects + animatedActions}
              </div>
              <div className="text-slate-300 text-sm">Offene Tasks</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-white">
                {animatedCompletionRate}%
              </div>
              <div className="text-slate-300 text-sm">Erledigt</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
            quickAccessFilter === "failures"
              ? "ring-2 ring-red-500 shadow-xl"
              : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => {
            setQuickAccessFilter("failures");
            setLastNavigatedPage("failures");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setQuickAccessFilter("failures");
              setLastNavigatedPage("failures");
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offene Störmeldungen
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {animatedFailures}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Noch nicht bearbeitet
            </p>
          </CardContent>
        </Card>
        <Card
          className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
            quickAccessFilter === "projects"
              ? "ring-2 ring-blue-500 shadow-xl"
              : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => {
            setQuickAccessFilter("projects");
            setLastNavigatedPage("projects");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setQuickAccessFilter("projects");
              setLastNavigatedPage("projects");
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meine Projekte
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {animatedProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Aktive Projekte
            </p>
          </CardContent>
        </Card>
        <Card
          className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
            quickAccessFilter === "actions"
              ? "ring-2 ring-orange-500 shadow-xl"
              : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => {
            setQuickAccessFilter("actions");
            setLastNavigatedPage("actions");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setQuickAccessFilter("actions");
              setLastNavigatedPage("actions");
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meine Actions
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {animatedActions}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Zu bearbeiten
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diese Woche erledigt
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {animatedCompleted}
            </div>
            <div className="mt-3">
              <Progress value={animatedCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {animatedCompletionRate}% Erledigungsrate
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
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
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
                              item.type,
                            )}`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(
                              item.priority,
                            )}`}
                          >
                            {(
                              PRIORITY_CONFIG as Record<
                                string,
                                { label: string }
                              >
                            )[item.priority.toUpperCase()]?.label ??
                              item.priority}
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
