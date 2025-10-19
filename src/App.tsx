import { useState, useEffect } from "react";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { UserAdminPage } from "@/pages/UserAdminPage";
import { authService } from "@/services/auth.service";
import type { User } from "@/services/auth.service";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
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
    setCurrentPage("dashboard");
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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "users":
        return <UserAdminPage />;
      case "settings":
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Einstellungen</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "profile":
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Profil</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      user={user}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
