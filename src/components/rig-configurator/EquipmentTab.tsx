import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Edit,
  Trash2,
  ClipboardList,
  Package,
  Wrench,
  Droplets,
  Zap,
  Users,
  Shield,
  Settings,
  AlertCircle,
  Truck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { EquipmentCatalog } from "@/data/equipment-catalog";
import type { EquipmentItem } from "./types";

// Icon mapping for equipment categories
const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  drillPipe: Wrench,
  tanks: Droplets,
  power: Zap,
  camps: Users,
  safety: Shield,
  mud: Settings,
  bop: AlertCircle,
  cranes: Truck,
  misc: Package,
};

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  drillPipe:
    "from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-800",
  tanks: "from-cyan-500/10 to-cyan-500/5 border-cyan-200 dark:border-cyan-800",
  power:
    "from-yellow-500/10 to-yellow-500/5 border-yellow-200 dark:border-yellow-800",
  camps:
    "from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-800",
  safety: "from-red-500/10 to-red-500/5 border-red-200 dark:border-red-800",
  mud: "from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-800",
  bop: "from-rose-500/10 to-rose-500/5 border-rose-200 dark:border-rose-800",
  cranes: "from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-800",
  misc: "from-gray-500/10 to-gray-500/5 border-gray-200 dark:border-gray-800",
};

const CATEGORY_ICON_COLORS: Record<string, string> = {
  drillPipe: "text-orange-600",
  tanks: "text-cyan-600",
  power: "text-yellow-600",
  camps: "text-purple-600",
  safety: "text-red-600",
  mud: "text-emerald-600",
  bop: "text-rose-600",
  cranes: "text-blue-600",
  misc: "text-gray-600",
};

interface EquipmentTabProps {
  equipmentCategories: EquipmentCatalog;
  selectedEquipment: Record<string, EquipmentItem[]>;
  onToggleEquipment: (category: string, item: EquipmentItem) => void;
  onAddEquipment: (category: string) => void;
  onEditEquipment: (category: string, item: EquipmentItem) => void;
  onDeleteEquipment: (category: string, itemId: string) => void;
  onQuickAction: (categoryKey: string, item: EquipmentItem) => void;
  onBack: () => void;
  onNext: () => void;
}

export function EquipmentTab({
  equipmentCategories,
  selectedEquipment,
  onToggleEquipment,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onQuickAction,
  onBack,
  onNext,
}: EquipmentTabProps) {
  // Track which categories are expanded — start with all expanded
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () =>
      Object.keys(equipmentCategories).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {},
      ),
  );

  const totalSelected = Object.values(selectedEquipment).flat().length;
  const totalEquipmentCost = Object.values(selectedEquipment)
    .flat()
    .reduce((sum, item) => sum + parseFloat(item.price), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3 border">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Ausgewählt
            </p>
            <p className="text-lg font-bold">{totalSelected} Positionen</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Equipment-Kosten
            </p>
            <p className="text-lg font-bold text-green-600">
              € {totalEquipmentCost.toLocaleString("de-DE")}/Tag
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allOpen = Object.values(openCategories).every(Boolean);
              setOpenCategories(
                Object.keys(equipmentCategories).reduce(
                  (acc, key) => ({ ...acc, [key]: !allOpen }),
                  {},
                ),
              );
            }}
          >
            {Object.values(openCategories).every(Boolean)
              ? "Alle zuklappen"
              : "Alle aufklappen"}
          </Button>
        </div>
      </div>

      {/* Equipment categories */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-3 pr-4">
          {Object.entries(equipmentCategories).map(([key, category]) => {
            const Icon = CATEGORY_ICONS[key] || Package;
            const selected = selectedEquipment[key] || [];
            const isOpen = openCategories[key] ?? true;
            const colorClass = CATEGORY_COLORS[key] || CATEGORY_COLORS.misc;
            const iconColor = CATEGORY_ICON_COLORS[key] || "text-gray-600";
            const categoryTotal = selected.reduce(
              (sum, item) => sum + parseFloat(item.price),
              0,
            );

            return (
              <Collapsible
                key={key}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCategories((prev) => ({ ...prev, [key]: open }))
                }
              >
                <Card
                  className={`border bg-gradient-to-r ${colorClass} overflow-hidden`}
                >
                  {/* Category header — always visible */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg bg-background/80 shadow-sm ${iconColor}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {category.items.length} verfügbar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {selected.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/90 text-primary-foreground text-xs px-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {selected.length} gewählt
                            </Badge>
                            <span className="text-sm font-semibold text-green-600">
                              € {categoryTotal.toLocaleString("de-DE")}
                            </span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEquipment(key);
                          }}
                          className="h-7 gap-1 text-xs"
                          title="Equipment hinzufügen"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Collapsible equipment items */}
                  <CollapsibleContent>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <TooltipProvider delayDuration={300}>
                          {category.items.map((item) => {
                            const isSelected = selected.some(
                              (s) => s.id === item.id,
                            );
                            const specs = Object.entries(item)
                              .filter(
                                ([k]) =>
                                  k !== "id" && k !== "name" && k !== "price",
                              )
                              .map(([, value]) => value)
                              .join(" • ");

                            return (
                              <div
                                key={item.id}
                                className={`group relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "bg-background/60 hover:bg-background hover:border-muted-foreground/30 hover:shadow-sm"
                                }`}
                                onClick={() => onToggleEquipment(key, item)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm leading-tight truncate">
                                    {item.name}
                                  </p>
                                  {specs && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                      {specs}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <div className="text-right mr-1">
                                    <p className="font-bold text-green-600 text-sm whitespace-nowrap">
                                      €{" "}
                                      {parseFloat(item.price).toLocaleString(
                                        "de-DE",
                                      )}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      /Tag
                                    </p>
                                  </div>
                                  {/* Action buttons — visible on hover */}
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickAction(key, item);
                                          }}
                                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                          <ClipboardList className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        Tender-Aufgabe
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditEquipment(key, item);
                                          }}
                                          className="h-7 w-7 p-0 hover:bg-muted"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        Bearbeiten
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteEquipment(key, item.id);
                                          }}
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        Löschen
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Wizard navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück: Anlagen
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          Weiter: Zusammenfassung
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
