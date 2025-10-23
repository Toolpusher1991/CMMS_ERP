import { useState, useEffect } from "react";
import { LoginPage } from "@/pages/LoginPage";
import { RegistrationPage } from "@/pages/RegistrationPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { EnhancedUserAdminPage } from "@/pages/EnhancedUserAdminPage";
import ProjectList from "@/pages/ProjectList";
import WorkOrderManagement from "@/pages/WorkOrderManagement";
import ActionTracker from "@/pages/ActionTracker";
import RigConfigurator from "@/pages/RigConfigurator";
import FailureReporting from "@/pages/FailureReporting";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { authService } from "@/services/auth.service";
import type { User } from "@/services/auth.service";

type AuthView = "login" | "register" | "forgot-password";
type AppPage =
  | "projects"
  | "users"
  | "workorders"
  | "actions"
  | "tender"
  | "failures";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [currentPage, setCurrentPage] = useState<AppPage>("projects");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = authService.getToken();
    const savedUser = authService.getCurrentUser();

    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setIsAuthenticated(true);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="cmms-erp-theme">
        {authView === "register" && (
          <RegistrationPage onBackToLogin={() => setAuthView("login")} />
        )}
        {authView === "forgot-password" && (
          <ForgotPasswordPage onBackToLogin={() => setAuthView("login")} />
        )}
        {authView === "login" && (
          <LoginPage
            onLogin={handleLogin}
            onRegister={() => setAuthView("register")}
            onForgotPassword={() => setAuthView("forgot-password")}
          />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="cmms-erp-theme">
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                MaintAIn
              </h1>
              <nav className="flex gap-2">
                <Button
                  variant={currentPage === "projects" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("projects")}
                  size="sm"
                >
                  Projekte
                </Button>
                <Button
                  variant={currentPage === "workorders" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("workorders")}
                  size="sm"
                >
                  Work Orders
                </Button>
                <Button
                  variant={currentPage === "actions" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("actions")}
                  size="sm"
                >
                  Action Tracker
                </Button>
                <Button
                  variant={currentPage === "failures" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("failures")}
                  size="sm"
                >
                  Schadensmeldungen
                </Button>
                <Button
                  variant={currentPage === "tender" ? "default" : "ghost"}
                  onClick={() => setCurrentPage("tender")}
                  size="sm"
                >
                  Bohranlagen
                </Button>
                {user.role === "ADMIN" && (
                  <Button
                    variant={currentPage === "users" ? "default" : "ghost"}
                    onClick={() => setCurrentPage("users")}
                    size="sm"
                  >
                    Benutzerverwaltung
                  </Button>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName} ({user.role})
              </span>
              <ModeToggle />
              <Button onClick={handleLogout} variant="outline">
                Abmelden
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-6">
          {currentPage === "projects" && <ProjectList />}
          {currentPage === "workorders" && <WorkOrderManagement />}
          {currentPage === "actions" && <ActionTracker />}
          {currentPage === "failures" && <FailureReporting />}
          {currentPage === "tender" && <RigConfigurator />}
          {currentPage === "users" && <EnhancedUserAdminPage />}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
