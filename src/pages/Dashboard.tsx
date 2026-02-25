import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  createElement,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  CheckCircle,
  Wrench,
  FileText,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCountUp } from "@/hooks/useCountUp";
import {
  DashboardStatsSkeleton,
  QuickAccessSkeleton,
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useDashboardData } from "@/hooks/useQueryHooks";
import type { DashboardStats, QuickAccessItem } from "@/types";
import * as assetIntegrityApi from "@/services/assetIntegrityApi";
import {
  isNoteOverdue,
  getDaysOverdue,
  calculateOverdueNotes,
} from "@/components/asset-integrity/utils";
import type { AssetRig } from "@/components/asset-integrity/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DashboardProps {
  onNavigate?: (page: string, itemId?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { toast } = useToast();
  const {
    actions,
    projects,
    failureReports,
    isLoading: loading,
    error: loadError,
    refetch: loadData,
  } = useDashboardData();

  // Asset Integrity Data
  const { data: assetRigs = [] } = useQuery<AssetRig[]>({
    queryKey: queryKeys.assetRigs.list(),
    queryFn: async () => {
      try {
        const rigs = await assetIntegrityApi.getAllRigs();
        return Array.isArray(rigs) ? rigs : [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Asset Integrity metrics
  const assetMetrics = useMemo(() => {
    const operational = assetRigs.filter(
      (r) => r.contractStatus === "operational",
    ).length;
    const stacked = assetRigs.filter(
      (r) => r.contractStatus === "stacked",
    ).length;
    const overhaul = assetRigs.filter(
      (r) => r.contractStatus === "overhaul",
    ).length;
    const overdueInspections = assetRigs.reduce(
      (sum, rig) =>
        sum +
        (rig.inspections?.filter((i) => i.status === "overdue").length ?? 0),
      0,
    );
    const overdueNotes = calculateOverdueNotes(assetRigs);
    return { operational, stacked, overhaul, overdueInspections, overdueNotes };
  }, [assetRigs]);

  const [showOverdueNotesModal, setShowOverdueNotesModal] = useState(false);

  // Toast notification for overdue notes
  const overdueToastShown = useRef(false);
  useEffect(() => {
    if (assetRigs.length > 0 && !overdueToastShown.current) {
      const count = assetMetrics.overdueNotes;
      if (count > 0) {
        overdueToastShown.current = true;
        toast({
          title: `⚠️ ${count} Notiz${count > 1 ? "en" : ""} ${count > 1 ? "sind" : "ist"} überfällig`,
          description:
            "Klicken Sie auf 'Details', um alle überfälligen Notizen anzuzeigen.",
          action: createElement(
            ToastAction,
            {
              altText: "Details anzeigen",
              onClick: () => setShowOverdueNotesModal(true),
            } as React.ComponentProps<typeof ToastAction>,
            "Details anzeigen",
          ) as unknown as React.ReactElement<typeof ToastAction>,
        });
      }
    }
  }, [assetRigs, assetMetrics.overdueNotes, toast]);
  const [quickAccessFilter, setQuickAccessFilter] = useState<
    "all" | "projects" | "actions" | "failures"
  >("all");
  const [lastNavigatedPage, setLastNavigatedPage] = useState<string | null>(
    null,
  );
  const [currentUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

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
                {loadError instanceof Error
                  ? loadError.message
                  : String(loadError)}
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

      {/* Asset Integrity Overview */}
      {assetRigs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold tracking-tight">
              Asset Integrity
            </h2>
            <Badge variant="outline" className="text-xs ml-1">
              {assetRigs.length} Anlagen
            </Badge>
          </div>

          {/* Row 1: Rig Status */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => onNavigate?.("asset-integrity")}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#00d9ff]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Operational
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(0,217,255,0.15)] flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-[#00d9ff]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {assetMetrics.operational}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Im Einsatz
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => onNavigate?.("asset-integrity")}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#64748b]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Stacked
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(100,116,139,0.15)] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#94a3b8]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{assetMetrics.stacked}</div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Verfügbar
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => onNavigate?.("asset-integrity")}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#f59e0b]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Overhaul
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-[#f59e0b]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {assetMetrics.overhaul}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  In Wartung
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => onNavigate?.("asset-integrity")}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#ef4444]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Overdue Insp.
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#ef4444]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {assetMetrics.overdueInspections}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Sofortige Maßnahmen
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() =>
                assetMetrics.overdueNotes > 0 && setShowOverdueNotesModal(true)
              }
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#ef4444]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Überf. Notizen
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#ef4444]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold">
                    {assetMetrics.overdueNotes}
                  </div>
                  {assetMetrics.overdueNotes > 0 && (
                    <span className="text-[10px] text-red-400 font-medium">
                      Aktion nötig
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Zu bearbeiten
                </p>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => onNavigate?.("asset-integrity")}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#ef4444]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Krit. Issues
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-[#ef4444]" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {assetRigs.reduce(
                    (sum, rig) =>
                      sum +
                      (rig.issues?.filter(
                        (i) =>
                          i.severity === "critical" && i.status !== "closed",
                      ).length ?? 0),
                    0,
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Hohe Priorität
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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

      {/* Overdue Notes Modal */}
      <Dialog
        open={showOverdueNotesModal}
        onOpenChange={setShowOverdueNotesModal}
      >
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-400" />
              📝 Überfällige Notizen ({assetMetrics.overdueNotes})
            </DialogTitle>
            <DialogDescription>
              Alle Notizen mit überschrittener Deadline, sortiert nach
              Dringlichkeit
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(() => {
              const allOverdueNotes: Array<{
                noteId: string;
                rigId: string;
                rigName: string;
                description: string;
                deadline: string;
                createdDate: string;
                daysOverdue: number;
              }> = [];

              assetRigs.forEach((rig) => {
                rig.generalInfo?.forEach((note) => {
                  if (isNoteOverdue(note)) {
                    allOverdueNotes.push({
                      noteId: note.id,
                      rigId: rig.id,
                      rigName: rig.name,
                      description: note.description,
                      deadline: note.deadline!,
                      createdDate: note.createdDate,
                      daysOverdue: getDaysOverdue(note),
                    });
                  }
                });
              });

              allOverdueNotes.sort((a, b) => b.daysOverdue - a.daysOverdue);

              if (allOverdueNotes.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                    <p className="text-lg font-medium">
                      Keine überfälligen Notizen
                    </p>
                    <p className="text-sm mt-1">
                      Alle Deadlines sind im Zeitplan.
                    </p>
                  </div>
                );
              }

              return allOverdueNotes.map((note) => (
                <div
                  key={`${note.rigId}-${note.noteId}`}
                  className="border border-red-500/30 bg-red-500/5 rounded-lg overflow-hidden"
                >
                  <div className="relative pl-4 pr-4 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="text-xs border-blue-500/30 text-blue-400"
                      >
                        {note.rigName}
                      </Badge>
                      <span className="text-xs font-semibold text-red-400">
                        🔴 vor {note.daysOverdue} Tag
                        {note.daysOverdue !== 1 ? "en" : ""} überfällig
                      </span>
                    </div>

                    <p className="text-sm text-foreground mb-2 leading-relaxed">
                      {note.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1 text-red-400 font-medium">
                        <Calendar className="h-3 w-3" />
                        Deadline:{" "}
                        {new Date(note.deadline).toLocaleDateString("de-DE")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Erstellt:{" "}
                        {new Date(note.createdDate).toLocaleDateString("de-DE")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setShowOverdueNotesModal(false);
                          onNavigate?.("asset-integrity");
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Zur Anlage
                      </Button>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          <DialogFooter className="flex-shrink-0 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowOverdueNotesModal(false)}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
