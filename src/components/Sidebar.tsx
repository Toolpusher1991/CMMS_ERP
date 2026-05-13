import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Building2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield,
  Package,
  ClipboardCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isTabletDevice } from "@/lib/device-detection";

type AppPage =
  | "dashboard"
  | "projects"
  | "actions"
  | "tender"
  | "failures"
  | "cspl"
  | "integrity"
  | "inspections"
  | "drillsense"
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
  { title: "Action Tracker", page: "actions", icon: ListTodo },
  { title: "Asset Integrity", page: "integrity", icon: Shield },
  { title: "CSPL Gap Analysis", page: "cspl", icon: Package },
  { title: "Inspektionen", page: "inspections", icon: ClipboardCheck },
  { title: "DrillSense", page: "drillsense", icon: Activity },
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
  // Auto-collapse on iPad portrait
  const [collapsed, setCollapsed] = useState(() => {
    if (isTabletDevice() && window.innerWidth < 1024) return true;
    return false;
  });

  // React to orientation changes on iPad
  useEffect(() => {
    if (!isTabletDevice()) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
        "flex flex-col h-screen bg-[#143269] transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded flex items-center justify-center font-bold text-sm text-white">
              H&P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-wide">
                MaintAIn
              </span>
              <span className="text-[10px] text-white/50 font-medium">
                Maintenance Intelligence
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-white/20 rounded flex items-center justify-center font-bold text-sm text-white mx-auto">
            H&P
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end p-2 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-11 w-11 text-white/60 hover:text-white hover:bg-white/10"
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
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;

            const navButton = (
              <button
                key={item.page}
                onClick={() => onPageChange(item.page)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group relative touch-manipulation min-h-[44px]",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center",
                )}
              >
                {/* Active Indicator */}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-[#24C26B] rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-white"
                      : "text-white/60 group-hover:text-white",
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

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#24C26B] animate-pulse" />
            <p className="text-xs text-white/40 font-medium">v1.0.0</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="p-3 border-t border-white/10 flex justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#24C26B] animate-pulse" />
        </div>
      )}
    </div>
  );
}
