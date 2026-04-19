import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Filter,
  Search,
  ChevronDown,
  Check,
  Factory,
  Zap,
  Wrench,
  Shield,
  Settings,
  MoreHorizontal,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  assignedPlant?: string;
}

interface RigInfo {
  id: string;
  name: string;
}

interface RigStats {
  open: number;
  inProgress: number;
  total: number;
}

interface ActionFilterCardProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  disciplineFilter: string;
  onDisciplineChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  userFilter: string;
  onUserChange: (value: string) => void;
  users: User[];
  // Plant selector props
  activePlant: string;
  onPlantChange: (value: string) => void;
  availableRigs: RigInfo[];
  getActionStats: (rigName: string) => RigStats;
}

// ─── Chip data matching CreationWizard presets ───

const STATUS_CHIPS = [
  { id: "all", label: "Alle" },
  { id: "OPEN", label: "Offen" },
  { id: "IN_PROGRESS", label: "Aktiv" },
  { id: "COMPLETED", label: "Erledigt" },
];

const DISCIPLINE_CHIPS = [
  { id: "all", label: "Alle", icon: null },
  { id: "ELEKTRIK", label: "Elektrik", icon: <Zap className="h-3 w-3" /> },
  { id: "MECHANIK", label: "Mechanik", icon: <Wrench className="h-3 w-3" /> },
  {
    id: "WELL_CONTROL",
    label: "Well Control",
    icon: <Shield className="h-3 w-3" />,
  },
  {
    id: "HYDRAULIK",
    label: "Hydraulik",
    icon: <Settings className="h-3 w-3" />,
  },
  {
    id: "SONSTIGES",
    label: "Sonstiges",
    icon: <MoreHorizontal className="h-3 w-3" />,
  },
];

const PRIORITY_CHIPS = [
  { id: "all", label: "Alle", icon: null, color: "" },
  {
    id: "LOW",
    label: "Niedrig",
    icon: <ArrowDown className="h-3 w-3" />,
    color: "text-[#64646E]",
  },
  {
    id: "MEDIUM",
    label: "Mittel",
    icon: <Minus className="h-3 w-3" />,
    color: "text-[#2B5597]",
  },
  {
    id: "HIGH",
    label: "Hoch",
    icon: <ArrowUp className="h-3 w-3" />,
    color: "text-[#E37222]",
  },
  {
    id: "URGENT",
    label: "Dringend",
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "text-[#C8102E]",
  },
];

// ─── Chip toggle button ───

function ChipToggle({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] uppercase tracking-[0.8px] font-medium rounded-sm border transition-all duration-150 whitespace-nowrap",
        active
          ? "bg-[#143269] text-white border-[#143269]"
          : "bg-white text-[#64646E] border-[#C8C8D2] hover:border-[#2B5597] hover:text-[#143269]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ───

export function ActionFilterCard({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  disciplineFilter,
  onDisciplineChange,
  priorityFilter,
  onPriorityChange,
  userFilter,
  onUserChange,
  users,
  activePlant,
  onPlantChange,
  availableRigs,
  getActionStats,
}: ActionFilterCardProps) {
  const [plantOpen, setPlantOpen] = useState(false);

  const activeCount = [
    statusFilter,
    disciplineFilter,
    priorityFilter,
    userFilter,
  ].filter((f) => f !== "all").length;

  return (
    <div className="mb-4 border border-[#C8C8D2]/60 bg-white">
      {/* Header row: Plant selector + Search + Filter count */}
      <div className="px-4 py-3 border-b border-[#C8C8D2]/40 flex items-center gap-3">
        {/* Plant Combobox */}
        <Popover open={plantOpen} onOpenChange={setPlantOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 bg-[#F0F0FA] border border-[#C8C8D2] rounded-sm hover:border-[#2B5597] transition-colors min-w-[200px]"
            >
              <Factory className="h-4 w-4 text-[#143269]" />
              <span className="text-[13px] font-medium text-[#143269] truncate">
                {activePlant || "Anlage wählen..."}
              </span>
              {(() => {
                if (!activePlant) return null;
                const stats = getActionStats(activePlant);
                const openCount = stats.open + stats.inProgress;
                if (openCount > 0) {
                  return (
                    <Badge
                      variant="destructive"
                      className="px-1.5 py-0 text-[9px] font-medium h-4 ml-auto"
                    >
                      {openCount}
                    </Badge>
                  );
                }
                return null;
              })()}
              <ChevronDown className="h-3.5 w-3.5 text-[#64646E] ml-auto shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Anlage suchen..." />
              <CommandList className="max-h-[280px]">
                <CommandEmpty>Keine Anlage gefunden.</CommandEmpty>
                <CommandGroup>
                  {availableRigs.map((rig) => {
                    const stats = getActionStats(rig.name);
                    const openCount = stats.open + stats.inProgress;
                    const isActive = activePlant === rig.name;
                    return (
                      <CommandItem
                        key={rig.id}
                        value={rig.name}
                        onSelect={() => {
                          onPlantChange(rig.name);
                          setPlantOpen(false);
                        }}
                        className="flex items-center gap-2 py-2 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isActive
                              ? "opacity-100 text-[#00B2E3]"
                              : "opacity-0",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[13px]",
                            isActive
                              ? "font-medium text-[#143269]"
                              : "text-[#000]",
                          )}
                        >
                          {rig.name}
                        </span>
                        {openCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="px-1.5 py-0 text-[9px] font-medium h-4 ml-auto"
                          >
                            {openCount} Offen
                          </Badge>
                        )}
                        {openCount === 0 && stats.total > 0 && (
                          <span className="text-[10px] text-[#24C26B] ml-auto">
                            Erledigt
                          </span>
                        )}
                        {stats.total === 0 && (
                          <span className="text-[10px] text-[#C8C8D2] ml-auto">
                            Leer
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <span className="text-[11px] text-[#64646E] uppercase tracking-[1px] hidden sm:inline">
          {availableRigs.length} Anlagen
        </span>

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64646E]" />
          <Input
            placeholder="Action suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-[13px] border-[#C8C8D2] focus:border-[#2B5597]"
          />
        </div>

        {/* Filter indicator */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[#64646E]" />
          {activeCount > 0 && (
            <Badge className="bg-[#00B2E3] text-white text-[9px] px-1.5 py-0 h-4">
              {activeCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Chip filters row */}
      <div className="px-4 py-3 flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* Status chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[1.2px] font-medium text-[#64646E] mr-1">
            Status
          </span>
          {STATUS_CHIPS.map((chip) => (
            <ChipToggle
              key={chip.id}
              active={statusFilter === chip.id}
              onClick={() => onStatusChange(chip.id)}
            >
              {chip.label}
            </ChipToggle>
          ))}
        </div>

        {/* Discipline chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[1.2px] font-medium text-[#64646E] mr-1">
            Kategorie
          </span>
          {DISCIPLINE_CHIPS.map((chip) => (
            <ChipToggle
              key={chip.id}
              active={disciplineFilter === chip.id}
              onClick={() => onDisciplineChange(chip.id)}
            >
              {chip.icon}
              {chip.label}
            </ChipToggle>
          ))}
        </div>

        {/* Priority chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[1.2px] font-medium text-[#64646E] mr-1">
            Priorität
          </span>
          {PRIORITY_CHIPS.map((chip) => (
            <ChipToggle
              key={chip.id}
              active={priorityFilter === chip.id}
              onClick={() => onPriorityChange(chip.id)}
              className={priorityFilter === chip.id ? "" : chip.color}
            >
              {chip.icon}
              {chip.label}
            </ChipToggle>
          ))}
        </div>

        {/* User dropdown */}
        <div className="flex items-center gap-3 ml-auto">
          <Select value={userFilter} onValueChange={onUserChange}>
            <SelectTrigger className="h-8 text-[11px] w-[140px] border-[#C8C8D2]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle User</SelectItem>
              {users.map((user) => {
                const fullName = `${user.firstName} ${user.lastName}`;
                return (
                  <SelectItem key={user.id} value={fullName}>
                    {fullName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Reset all filters */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onStatusChange("all");
                onDisciplineChange("all");
                onPriorityChange("all");
                onUserChange("all");
                onSearchChange("");
              }}
              className="flex items-center gap-1 text-[11px] text-[#C8102E] hover:text-[#C8102E]/80 transition-colors"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
