import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { actionService, type Action } from "@/services/action.service";
import {
  failureReportService,
  type FailureReport,
} from "@/services/failure-report.service";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  ClipboardList,
  FileWarning,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Plant = "T208" | "T207" | "T700" | "T46";

interface PlantStats {
  plant: Plant;
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  high: number;
  urgent: number;
}

interface FailureReportStats {
  total: number;
  reported: number;
  converted: number;
}

export default function Dashboard() {
  const [actions, setActions] = useState<Action[]>([]);
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionsData, reportsData] = await Promise.all([
        actionService.getAll(),
        failureReportService.getAll(),
      ]);
      setActions(actionsData);
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlantStats = (plant: Plant): PlantStats => {
    const plantActions = actions.filter((a) => a.plant === plant);

    return {
      plant,
      total: plantActions.length,
      open: plantActions.filter((a) => a.status === "OPEN").length,
      inProgress: plantActions.filter((a) => a.status === "IN_PROGRESS").length,
      completed: plantActions.filter((a) => a.status === "COMPLETED").length,
      high: plantActions.filter((a) => a.priority === "HIGH").length,
      urgent: plantActions.filter((a) => a.priority === "URGENT").length,
    };
  };

  const calculateFailureReportStats = (): FailureReportStats => {
    return {
      total: reports.length,
      reported: reports.filter((r) => r.status === "REPORTED").length,
      converted: reports.filter((r) => r.status === "CONVERTED_TO_ACTION")
        .length,
    };
  };

  const plants: Plant[] = ["T208", "T207", "T700", "T46"];
  const allStats = plants.map(calculatePlantStats);
  const failureStats = calculateFailureReportStats();

  const totalStats = {
    total: actions.length,
    open: actions.filter((a) => a.status === "OPEN").length,
    inProgress: actions.filter((a) => a.status === "IN_PROGRESS").length,
    completed: actions.filter((a) => a.status === "COMPLETED").length,
    urgent: actions.filter((a) => a.priority === "URGENT").length,
  };

  const getTrendIcon = (open: number, total: number) => {
    if (total === 0) return <Activity className="h-4 w-4" />;
    const percentage = (open / total) * 100;
    if (percentage > 50)
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    if (percentage > 25) return <Activity className="h-4 w-4 text-amber-600" />;
    return <TrendingDown className="h-4 w-4 text-emerald-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Übersicht der Actions und Störungsmeldungen
        </p>
      </div>

      {/* Overview Cards - Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Action Tracker Übersicht
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Gesamt Actions
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {totalStats.total}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Alle Anlagen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Offen
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {totalStats.open}
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                Benötigen Zuweisung
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                In Bearbeitung
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalStats.inProgress}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Wird bearbeitet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Abgeschlossen
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {totalStats.completed}
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Erfolgreich erledigt
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Failure Reports Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Störungsmeldungen
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Gemeldete Störungen
              </CardTitle>
              <FileWarning className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {failureStats.total}
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                Gesamt gemeldet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Neu Gemeldet
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {failureStats.reported}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Warten auf Konvertierung
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-400">
                → Actions
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                {failureStats.converted}
              </div>
              <p className="text-xs text-teal-700 dark:text-teal-400 mt-1">
                Zu Actions konvertiert
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plant Statistics - Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Actions nach Anlagen</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {allStats.map((stats) => (
            <Card
              key={stats.plant}
              className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-700"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Anlage {stats.plant}
                  </CardTitle>
                  {getTrendIcon(stats.open, stats.total)}
                </div>
                <CardDescription className="text-sm">
                  Action Tracker Übersicht
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gesamt</span>
                  <span className="text-lg font-bold">{stats.total}</span>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Offen</span>
                    <Badge
                      variant="outline"
                      className={`${
                        stats.open > 0
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {stats.open}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      In Bearbeitung
                    </span>
                    <Badge
                      variant="outline"
                      className={`${
                        stats.inProgress > 0
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {stats.inProgress}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Abgeschlossen</span>
                    <Badge
                      variant="outline"
                      className={`${
                        stats.completed > 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {stats.completed}
                    </Badge>
                  </div>
                </div>

                {/* Priority Breakdown */}
                {stats.total > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Hohe Priorität
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {stats.urgent > 0 && (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          <span>Dringend: {stats.urgent}</span>
                        </div>
                      )}
                      {stats.high > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          <span>Hoch: {stats.high}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
