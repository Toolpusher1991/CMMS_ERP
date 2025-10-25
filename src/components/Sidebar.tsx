import { useState } from "react";
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
  | "failures";

interface NavItem {
  title: string;
  page: AppPage;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { title: "Projekte", page: "projects", icon: FolderKanban },
  { title: "Work Orders", page: "workorders", icon: FileText },
  { title: "Action Tracker", page: "actions", icon: ListTodo },
  { title: "Bohranlagen", page: "tender", icon: Building2 },
  { title: "Störungsmeldung", page: "failures", icon: AlertTriangle },
  { title: "Benutzerverwaltung", page: "users", icon: Users },
];

interface SidebarProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-[#1a2332] border-r border-[#2d3748] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2d3748] bg-[#151d2a]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-[#22d3ee]" />
            <span className="font-bold text-lg text-white">MaintAIn</span>
          </div>
        )}
        {collapsed && (
          <LayoutDashboard className="h-6 w-6 text-[#22d3ee] mx-auto" />
        )}
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end p-2 border-b border-[#2d3748]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 hover:bg-[#2d3748] text-slate-400 hover:text-white"
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
                  ? "bg-[#22d3ee] text-[#0f172a] hover:bg-[#06b6d4]"
                  : "text-slate-300 hover:bg-[#2d3748] hover:text-white",
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
