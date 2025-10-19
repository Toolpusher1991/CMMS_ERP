import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function DashboardLayout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  user,
}: DashboardLayoutProps) {
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Benutzerverwaltung", icon: "👥", adminOnly: true },
    { id: "settings", label: "Einstellungen", icon: "⚙️" },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">CMMS ERP</h1>
            <nav className="hidden md:flex space-x-1">
              {filteredMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "secondary" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center space-x-2"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rolle: {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("profile")}>
                  👤 Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("settings")}>
                  ⚙️ Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  🚪 Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
