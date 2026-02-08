import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ListTodo,
  Building2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Settings,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AppPage =
  | "dashboard"
  | "projects"
  | "workorders"
  | "actions"
  | "tender"
  | "failures"
  | "inspections"
  | "shifts"
  | "admin";

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
  { title: "Schichtplan", page: "shifts", icon: CalendarDays },
  { title: "Inspektionsberichte", page: "inspections", icon: ClipboardCheck },
  { title: "Bohranlagen", page: "tender", icon: Building2 },
  { title: "Störungsmeldung", page: "failures", icon: AlertTriangle },
  { title: "Admin", page: "admin", icon: Settings, adminOnly: true },
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
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-gradient-to-r from-slate-900 to-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                MaintAIn
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Maintenance Intelligence
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg mx-auto">
            <Building2 className="h-5 w-5 text-white" />
          </div>
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
      <TooltipProvider delayDuration={300}>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;

            // Farbcodierung für verschiedene Bereiche
            const getIconColor = () => {
              if (isActive) return "";
              switch (item.page) {
                case "dashboard":
                  return "text-blue-500";
                case "projects":
                  return "text-purple-500";
                case "workorders":
                  return "text-cyan-500";
                case "actions":
                  return "text-orange-500";
                case "inspections":
                  return "text-green-500";
                case "shifts":
                  return "text-teal-500";
                case "tender":
                  return "text-indigo-500";
                case "failures":
                  return "text-red-500";
                case "admin":
                  return "text-slate-400";
                default:
                  return "text-slate-400";
              }
            };

            const navButton = (
              <button
                key={item.page}
                onClick={() => onPageChange(item.page)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-sidebar-foreground hover:bg-slate-800/50 hover:shadow-md",
                  collapsed && "justify-center",
                )}
              >
                {/* Active Indicator */}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : getIconColor(),
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate text-left">
                    {item.title}
                  </span>
                )}
              </button>
            );

            // Wrap mit Tooltip wenn collapsed
            if (collapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>
      </TooltipProvider>

      {/* Footer - Optional */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">v1.0.0</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
