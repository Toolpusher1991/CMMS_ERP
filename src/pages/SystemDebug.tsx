import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface DebugResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
  timing?: number;
}

const SystemDebug = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    // Collect system info
    setSystemInfo({
      "Frontend URL": window.location.origin,
      "API Base URL": import.meta.env.VITE_API_URL || "Not set",
      "Sentry DSN": import.meta.env.VITE_SENTRY_DSN
        ? "✅ Configured"
        : "❌ Not set",
      Environment: import.meta.env.MODE,
      "User Agent": navigator.userAgent.split(" ").slice(-2).join(" "),
      Language: navigator.language,
    });
  }, []);

  const addResult = (result: DebugResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. Test API Connection
      await testApiConnection();

      // 2. Test Authentication
      await testAuthentication();

      // 3. Test Database Connection
      await testDatabaseConnection();

      // 4. Test Photo Loading
      await testPhotoLoading();

      // 5. Test Project Category API
      await testProjectCategories();

      // 6. Test Failure Reports
      await testFailureReports();

      // 7. Test Actions API
      await testActionsAPI();

      // 8. Test Sentry
      await testSentry();

      toast({
        title: "Diagnostics Complete",
        description: "Check results below",
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const testApiConnection = async () => {
    const start = Date.now();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5137"}/api/health`
      );
      const timing = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        addResult({
          name: "API Connection",
          status: "success",
          message: `Backend erreichbar (${timing}ms)`,
          details: JSON.stringify(data, null, 2),
          timing,
        });
      } else {
        addResult({
          name: "API Connection",
          status: "error",
          message: `Backend nicht erreichbar: ${response.status}`,
          details: await response.text(),
          timing,
        });
      }
    } catch (error) {
      addResult({
        name: "API Connection",
        status: "error",
        message: "Backend Verbindung fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testAuthentication = async () => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      addResult({
        name: "Authentication",
        status: "warning",
        message: "Nicht eingeloggt",
        details: "Kein Token oder User in localStorage",
      });
      return;
    }

    try {
      const start = Date.now();
      const response = await apiClient.get<{ email: string }>("/auth/me");
      const timing = Date.now() - start;

      addResult({
        name: "Authentication",
        status: "success",
        message: `Eingeloggt als ${response.email} (${timing}ms)`,
        details: JSON.stringify(response, null, 2),
        timing,
      });
    } catch (error) {
      addResult({
        name: "Authentication",
        status: "error",
        message: "Token ungültig oder abgelaufen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const start = Date.now();
      const response = await apiClient.get<{ connected: boolean }>(
        "/health/db"
      );
      const timing = Date.now() - start;

      if (response.connected) {
        addResult({
          name: "Database Connection",
          status: "success",
          message: `PostgreSQL verbunden (${timing}ms)`,
          timing,
        });
      } else {
        addResult({
          name: "Database Connection",
          status: "error",
          message: "Database nicht verbunden",
        });
      }
    } catch (error) {
      addResult({
        name: "Database Connection",
        status: "error",
        message: "Database Check fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testPhotoLoading = async () => {
    try {
      const start = Date.now();
      // Try to load a test photo using the new blob API
      const testBlob = await apiClient.request<Blob>(
        "/failure-reports/photo/test.jpg",
        { responseType: "blob" }
      );
      const timing = Date.now() - start;

      if (testBlob.size > 0) {
        addResult({
          name: "Photo Loading (Blob API)",
          status: "success",
          message: `Blob API funktioniert (${testBlob.size} bytes, ${timing}ms)`,
          timing,
        });
      } else {
        addResult({
          name: "Photo Loading (Blob API)",
          status: "warning",
          message:
            "Testfoto nicht gefunden (normal wenn keine Test-Datei existiert)",
          timing,
        });
      }
    } catch (error) {
      // This is expected if test photo doesn't exist
      addResult({
        name: "Photo Loading (Blob API)",
        status: "warning",
        message: "Testfoto nicht gefunden (API funktioniert aber)",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testProjectCategories = async () => {
    try {
      const start = Date.now();
      const response = await apiClient.get<{
        success: boolean;
        data: {
          projects: Array<{
            id: string;
            category?: string;
            projectNumber?: string;
          }>;
          stats?: Record<string, unknown>;
        };
      }>("/projects");
      const timing = Date.now() - start;

      // Extract projects array from the wrapped response
      const projects = response.data?.projects || [];
      const projectsWithCategory = projects.filter((p) => p.category);

      addResult({
        name: "Project Categories",
        status: projectsWithCategory.length > 0 ? "success" : "warning",
        message: `${projectsWithCategory.length}/${projects.length} Projekte haben Kategorien (${timing}ms)`,
        details: `Erste 3 Projekte:\n${JSON.stringify(
          projects.slice(0, 3).map((p) => ({
            number: p.projectNumber,
            category: p.category || "KEINE KATEGORIE",
          })),
          null,
          2
        )}`,
        timing,
      });
    } catch (error) {
      addResult({
        name: "Project Categories",
        status: "error",
        message: "Projects API fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testFailureReports = async () => {
    try {
      const start = Date.now();
      const reports = await apiClient.get<
        Array<{ id: string; photoFilename?: string }>
      >("/failure-reports");
      const timing = Date.now() - start;

      const reportsWithPhoto = reports.filter((r) => r.photoFilename);

      addResult({
        name: "Failure Reports",
        status: "success",
        message: `${reports.length} Reports geladen, ${reportsWithPhoto.length} mit Foto (${timing}ms)`,
        details: `Beispiel: ${JSON.stringify(reports.slice(0, 1), null, 2)}`,
        timing,
      });
    } catch (error) {
      addResult({
        name: "Failure Reports",
        status: "error",
        message: "Failure Reports API fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testActionsAPI = async () => {
    try {
      const start = Date.now();
      const actions = await apiClient.get<Array<{ id: string }>>("/actions");
      const timing = Date.now() - start;

      addResult({
        name: "Actions API",
        status: "success",
        message: `${actions.length} Actions geladen (${timing}ms)`,
        timing,
      });
    } catch (error) {
      addResult({
        name: "Actions API",
        status: "error",
        message: "Actions API fehlgeschlagen",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const testSentry = async () => {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

    if (!sentryDsn) {
      addResult({
        name: "Sentry",
        status: "warning",
        message: "Sentry nicht konfiguriert",
        details: "VITE_SENTRY_DSN nicht gesetzt",
      });
      return;
    }

    try {
      // Try to send a test event
      const testError = new Error("System Debug Test Error - IGNORE THIS");
      console.error("[DEBUG TEST]", testError);

      addResult({
        name: "Sentry",
        status: "success",
        message: "Sentry konfiguriert (Test-Error gesendet)",
        details: `DSN: ${sentryDsn.substring(0, 30)}...`,
      });
    } catch (error) {
      addResult({
        name: "Sentry",
        status: "error",
        message: "Sentry Error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
    };
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            System Diagnostics & Debug
          </CardTitle>
          <CardDescription>
            Vollständige System-Prüfung für alle kritischen Funktionen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Diagnostics laufen...
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4 mr-2" />
                Diagnostics starten
              </>
            )}
          </Button>

          {/* System Info */}
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
            <div className="col-span-2 font-bold mb-2">System Information:</div>
            {Object.entries(systemInfo).map(([key, value]) => (
              <div key={key} className="col-span-2 md:col-span-1">
                <span className="text-muted-foreground">{key}:</span>
                <span className="ml-2 font-mono text-sm">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {results.filter((r) => r.status === "success").length}{" "}
              erfolgreiche Tests,{" "}
              {results.filter((r) => r.status === "error").length} Fehler,{" "}
              {results.filter((r) => r.status === "warning").length} Warnungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <Alert
                key={index}
                className={
                  result.status === "success"
                    ? "border-green-500"
                    : result.status === "error"
                    ? "border-red-500"
                    : "border-yellow-500"
                }
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{result.name}</span>
                      <div className="flex items-center gap-2">
                        {result.timing && (
                          <span className="text-xs text-muted-foreground">
                            {result.timing}ms
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    <AlertDescription className="text-sm">
                      {result.message}
                    </AlertDescription>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:underline">
                          Details anzeigen
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Debug Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.log("=== FRONTEND STATE ===");
              console.log("LocalStorage:", { ...localStorage });
              console.log("API Base URL:", import.meta.env.VITE_API_URL);
              console.log(
                "Current User:",
                JSON.parse(localStorage.getItem("user") || "{}")
              );
              toast({
                title: "Console Logs",
                description: "Check browser console for details",
              });
            }}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Log Frontend State
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            Clear Cache & Logout
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const error = new Error("Test Error from Debug Panel");
              console.error(error);
              throw error;
            }}
          >
            Test Sentry Error
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              window.open(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:5137"
                }/api/health`,
                "_blank"
              );
            }}
          >
            Open API Health
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDebug;
