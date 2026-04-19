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
  X,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RigInfo {
  id: string;
  name: string;
}

interface RigStats {
  total: number;
  active: number;
  completed: number;
}

interface ProjectFilterCardProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  // Plant selector props
  activePlant: string;
  onPlantChange: (value: string) => void;
  availableRigs: RigInfo[];
  getProjectStats: (rigName: string) => RigStats;
}

// ─── Chip data matching the project statuses ───

const STATUS_CHIPS = [
  { id: "ALL", label: "Alle" },
  { id: "PLANNED", label: "Geplant" },
  { id: "IN_PROGRESS", label: "In Arbeit" },
  { id: "ON_HOLD", label: "Pausiert" },
  { id: "COMPLETED", label: "Erledigt" },
];

const SORT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "progress", label: "Fortschritt" },
  { id: "dueDate", label: "Fälligkeit" },
  { id: "priority", label: "Priorität" },
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

export function ProjectFilterCard({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  activePlant,
  onPlantChange,
  availableRigs,
  getProjectStats,
}: ProjectFilterCardProps) {
  const [plantOpen, setPlantOpen] = useState(false);

  const hasActiveFilters = statusFilter !== "ALL" || searchQuery.trim() !== "";

  return (
    <div className="mb-4 border border-[#C8C8D2]/60 bg-white">
      {/* Header row: Plant selector + Search */}
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
                const stats = getProjectStats(activePlant);
                if (stats.active > 0) {
                  return (
                    <Badge
                      variant="destructive"
                      className="px-1.5 py-0 text-[9px] font-medium h-4 ml-auto"
                    >
                      {stats.active}
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
                    const stats = getProjectStats(rig.name);
                    const isActive = activePlant === rig.name;
                    return (
                      <CommandItem
                        key={rig.id}
                        value={rig.name}
                        onSelect={() => {
                          onPlantChange(rig.name);
                          setPlantOpen(false);
                        }}
                        className="flex items-center gap-2 py-2"
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
                        {stats.active > 0 && (
                          <Badge
                            variant="destructive"
                            className="px-1.5 py-0 text-[9px] font-medium h-4 ml-auto"
                          >
                            {stats.active} Aktiv
                          </Badge>
                        )}
                        {stats.active === 0 && stats.total > 0 && (
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
            placeholder="Projekt suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-[13px] border-[#C8C8D2] focus:border-[#2B5597]"
          />
        </div>

        {/* Filter indicator */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[#64646E]" />
          {hasActiveFilters && (
            <Badge className="bg-[#00B2E3] text-white text-[9px] px-1.5 py-0 h-4">
              !
            </Badge>
          )}
        </div>
      </div>

      {/* Chip filters row */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
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

        {/* Sort + Reset */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-[#64646E]" />
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#C8C8D2]">
                <SelectValue placeholder="Sortierung" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset all filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onStatusChange("ALL");
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
