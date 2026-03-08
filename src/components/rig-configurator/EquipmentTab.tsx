import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronLeft,
  ChevronRight,
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
  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <CardTitle>Zusatzausrüstung wählen</CardTitle>
          <CardDescription>
            Wählen Sie die benötigte Zusatzausrüstung für Ihr Projekt
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[calc(100vh-350px)] pr-4">
            <div className="space-y-4">
              {Object.entries(equipmentCategories).map(([key, category]) => {
                const Icon = CATEGORY_ICONS[key] || Package;
                const selected = selectedEquipment[key] || [];

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <h3 className="text-base font-semibold">
                          {category.name}
                        </h3>
                        {selected.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {selected.length}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAddEquipment(key)}
                        className="gap-1 h-8 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Hinzufügen
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {category.items.map((item) => {
                        const isSelected = selected.some(
                          (s) => s.id === item.id,
                        );
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/5 border-primary"
                                : "hover:bg-muted/50 hover:border-muted-foreground/20"
                            }`}
                            onClick={() => onToggleEquipment(key, item)}
                          >
                            <Checkbox checked={isSelected} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {Object.entries(item)
                                  .filter(
                                    ([k]) =>
                                      k !== "id" &&
                                      k !== "name" &&
                                      k !== "price",
                                  )
                                  .map(([, value]) => value)
                                  .join(" • ")}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1.5">
                                <div>
                                  <p className="font-bold text-green-600 text-sm">
                                    €{" "}
                                    {parseFloat(item.price).toLocaleString(
                                      "de-DE",
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    /Tag
                                  </p>
                                </div>
                                <div className="flex gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onQuickAction(key, item);
                                    }}
                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                    title="Tender-Aufgabe erstellen"
                                  >
                                    <ClipboardList className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditEquipment(key, item);
                                    }}
                                    className="h-7 w-7 p-0"
                                    title="Equipment bearbeiten"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteEquipment(key, item.id);
                                    }}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    title="Equipment löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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
