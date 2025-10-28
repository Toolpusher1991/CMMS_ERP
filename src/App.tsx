import { useState, useEffect } from "react";
import { LoginPage } from "@/pages/LoginPage";
import { RegistrationPage } from "@/pages/RegistrationPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { EnhancedUserAdminPage } from "@/pages/EnhancedUserAdminPage";
import Dashboard from "@/pages/Dashboard";
import ProjectList from "@/pages/ProjectList";
import WorkOrderManagement from "@/pages/WorkOrderManagement";
import ActionTracker from "@/pages/ActionTracker";
import RigConfigurator from "@/pages/RigConfigurator";
import FailureReporting from "@/pages/FailureReporting";
import SystemDebug from "@/pages/SystemDebug";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { MobileLayout } from "@/components/MobileLayout";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { authService } from "@/services/auth.service";
import { isMobileDevice } from "@/lib/device-detection";
import type { User } from "@/services/auth.service";

// Sentry Error Test Button Component
function ErrorButton() {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        throw new Error("Sentry Test Error - This is your first error!");
      }}
    >
      🐛 Test Sentry
    </Button>
  );
}

type AuthView = "login" | "register" | "forgot-password";
type AppPage =
  | "dashboard"
  | "projects"
  | "users"
  | "workorders"
  | "actions"
  | "tender"
  | "failures"
  | "debug";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = authService.getToken();
    const savedUser = authService.getCurrentUser();

    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(savedUser);
    }

    // Detect mobile device
    setIsMobile(isMobileDevice());

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
    if (isMobile) {
      setAuthView("login");
    }
  };

  const handleMobileNavigate = (page: string) => {
    if (page === "login") {
      setAuthView("login");
      setIsAuthenticated(false);
    } else if (page === "failures") {
      setCurrentPage("failures");
    }
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
        {/* Always show login page when not authenticated */}
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
      {isMobile ? (
        // Mobile View: Simplified layout with only Failure Reporting
        <MobileLayout
          isLoggedIn={true}
          userName={`${user.firstName} ${user.lastName}`}
          onLogout={handleLogout}
          onNavigate={handleMobileNavigate}
        >
          {currentPage === "failures" && <FailureReporting />}
        </MobileLayout>
      ) : (
        // Desktop View: Full app with Sidebar
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            userRole={user.role}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header - Minimal */}
            <header className="h-16 border-b border-[#2d3748] bg-[#151d2a] flex items-center justify-end px-4 gap-3">
              <span className="text-sm text-slate-300 mr-auto ml-4">
                {user.firstName} {user.lastName}
              </span>
              <ErrorButton />
              <NotificationBell onNavigate={setCurrentPage} />
              <ModeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-[#2d3748] hover:bg-[#2d3748]"
              >
                Abmelden
              </Button>
            </header>

            {/* Content Area with Scroll */}
            <main className="flex-1 overflow-y-auto bg-[#0f1419]">
              <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8">
                {currentPage === "dashboard" && <Dashboard />}
                {currentPage === "projects" && <ProjectList />}
                {currentPage === "workorders" && <WorkOrderManagement />}
                {currentPage === "actions" && <ActionTracker />}
                {currentPage === "failures" && <FailureReporting />}
                {currentPage === "tender" && <RigConfigurator />}
                {currentPage === "debug" && <SystemDebug />}
                {currentPage === "users" && user.role === "ADMIN" && (
                  <EnhancedUserAdminPage />
                )}
              </div>
            </main>
          </div>

          {/* Floating Chatbot */}
          <FloatingChatButton />
        </div>
      )}
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
