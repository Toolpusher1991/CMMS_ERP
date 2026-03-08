import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Settings, Save } from "lucide-react";
import type { TenderConfiguration } from "@/services/tender.service";
import type { EquipmentCatalog } from "@/data/equipment-catalog";
import type { EquipmentItem } from "../types";

interface EquipmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingConfig: TenderConfiguration | null;
  equipmentCategories: EquipmentCatalog;
  tempSelection: Record<string, EquipmentItem[]>;
  setTempSelection: React.Dispatch<
    React.SetStateAction<Record<string, EquipmentItem[]>>
  >;
  onSave: () => void;
}

export function EquipmentManagementDialog({
  open,
  onOpenChange,
  editingConfig,
  equipmentCategories,
  tempSelection,
  setTempSelection,
  onSave,
}: EquipmentManagementDialogProps) {
  const totalRate = editingConfig
    ? parseFloat(editingConfig.selectedRig.dayRate) +
      Object.values(tempSelection)
        .flat()
        .reduce((sum, eq) => sum + parseFloat(eq.price), 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Equipment verwalten - {editingConfig?.projectName}
          </DialogTitle>
          <DialogDescription>
            Fügen Sie Equipment hinzu oder entfernen Sie es, um die Tagesrate
            anzupassen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Total */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  Aktuelle Gesamt-Tagesrate:
                </span>
                <span className="text-2xl font-bold text-primary">
                  € {totalRate.toLocaleString("de-DE")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Categories */}
          {editingConfig &&
            Object.entries(equipmentCategories).map(
              ([category, categoryData]) => {
                const items = categoryData.items || [];
                const selectedItems = tempSelection[category] || [];

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {categoryData.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((item: EquipmentItem) => {
                          const isSelected = selectedItems.some(
                            (sel) => sel.id === item.id,
                          );
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    setTempSelection((prev) => {
                                      const current = prev[category] || [];
                                      if (checked) {
                                        return {
                                          ...prev,
                                          [category]: [...current, item],
                                        };
                                      } else {
                                        return {
                                          ...prev,
                                          [category]: current.filter(
                                            (i) => i.id !== item.id,
                                          ),
                                        };
                                      }
                                    });
                                  }}
                                />
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    €
                                    {parseFloat(item.price).toLocaleString(
                                      "de-DE",
                                    )}
                                    /Tag
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Badge className="bg-primary">Ausgewählt</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} className="bg-primary">
            <Save className="h-4 w-4 mr-2" />
            Änderungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
