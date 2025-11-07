import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ListTodo,
  Building2,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ClipboardCheck,
  BookOpen,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppPage =
  | "dashboard"
  | "projects"
  | "users"
  | "workorders"
  | "actions"
  | "tender"
  | "failures"
  | "inspections"
  | "manuals"
  | "locations"
  | "debug";

interface NavItem {
  title: string;
  page: AppPage;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { title: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { title: "Projekte", page: "projects", icon: FolderKanban },
  { title: "Work Orders", page: "workorders", icon: FileText },
  { title: "Action Tracker", page: "actions", icon: ListTodo },
  { title: "Inspektionsberichte", page: "inspections", icon: ClipboardCheck },
  {
    title: "Equipment Manuals",
    page: "manuals",
    icon: BookOpen,
    adminOnly: true,
  },
  { title: "Bohranlagen", page: "tender", icon: Building2 },
  { title: "Störungsmeldung", page: "failures", icon: AlertTriangle },
  { title: "System Debug", page: "debug", icon: Terminal, adminOnly: true },
  { title: "Benutzerverwaltung", page: "users", icon: Users, adminOnly: true },
  { title: "Standorte", page: "locations", icon: MapPin, adminOnly: true },
];

interface SidebarProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
  userRole?: string;
}

export function Sidebar({ currentPage, onPageChange, userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Filter nav items based on user role
  const navItems = useMemo(() => {
    if (userRole === "ADMIN") {
      return allNavItems;
    }
    return allNavItems.filter((item) => !item.adminOnly);
  }, [userRole]);

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar-accent">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-sidebar-foreground">
              MaintAIn
            </span>
          </div>
        )}
        {collapsed && (
          <LayoutDashboard className="h-6 w-6 text-primary mx-auto" />
        )}
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end p-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => onPageChange(item.page)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate text-left">
                  {item.title}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Optional */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            MaintAIn CMMS v1.0
          </p>
        </div>
      )}
    </div>
  );
}
