import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileDown, Save, ChevronLeft, ChevronRight } from "lucide-react";
import type { Rig } from "@/services/rig.service";
import type { EquipmentCatalog } from "@/data/equipment-catalog";
import type { ProjectRequirements, EquipmentItem } from "./types";

interface SummaryTabProps {
  requirements: ProjectRequirements;
  selectedRig: Rig | null;
  selectedEquipment: Record<string, EquipmentItem[]>;
  equipmentCategories: EquipmentCatalog;
  calculateTotal: () => number;
  onExport: () => void;
  onSaveAsTender: () => void;
  canSaveTender: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function SummaryTab({
  requirements,
  selectedRig,
  selectedEquipment,
  equipmentCategories,
  calculateTotal,
  onExport,
  onSaveAsTender,
  canSaveTender,
  onBack,
  onNext,
}: SummaryTabProps) {
  const total = calculateTotal();
  const equipmentItems = Object.values(selectedEquipment).flat();
  const equipmentTotal = equipmentItems.reduce(
    (sum, item) => sum + parseFloat(item.price),
    0,
  );
  const durationDays = parseInt(
    requirements.projectDuration.replace(/\D/g, "") || "0",
  );

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Konfigurations-Zusammenfassung</CardTitle>
              <CardDescription>
                Überprüfen Sie Ihre Auswahl und erstellen Sie ein
                professionelles Angebot
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onExport}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <FileDown className="mr-2 h-5 w-5" />
                Angebot als PDF erstellen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Projekt-Informationen
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Projektname</p>
                <p className="font-semibold">
                  {requirements.projectName || "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Kunde</p>
                <p className="font-semibold">
                  {requirements.clientName || "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Standort</p>
                <p className="font-semibold">{requirements.location || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dauer</p>
                <p className="font-semibold">
                  {requirements.projectDuration || "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Selected Rig */}
          {selectedRig && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Ausgewählte Anlage</h3>
              <div className="bg-primary/5 border-2 border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xl font-bold">{selectedRig.name}</p>
                  <p className="text-xl font-bold text-primary">
                    € {parseFloat(selectedRig.dayRate).toLocaleString("de-DE")}
                    /Tag
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedRig.description}
                </p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Max. Tiefe</p>
                    <p className="font-semibold">{selectedRig.maxDepth}m</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hakenlast</p>
                    <p className="font-semibold">{selectedRig.maxHookLoad}t</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Crew</p>
                    <p className="font-semibold">{selectedRig.crewSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobilisierung</p>
                    <p className="font-semibold">
                      {selectedRig.mobilizationTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Selected Equipment */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Ausgewählte Zusatzausrüstung
            </h3>
            {equipmentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Zusatzausrüstung ausgewählt
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(selectedEquipment)
                  .filter(([, items]) => items.length > 0)
                  .map(([key, items]) => {
                    const category = equipmentCategories[key];
                    return (
                      <div key={key}>
                        <p className="font-semibold text-sm mb-2">
                          {category?.name ?? key}
                        </p>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                            >
                              <span>{item.name}</span>
                              <span className="font-semibold text-green-600">
                                €{" "}
                                {parseFloat(item.price).toLocaleString("de-DE")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <Separator />

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Kosten-Übersicht (Tagesraten)
            </h3>
            <div className="space-y-2 text-sm mb-4">
              {selectedRig && (
                <div className="flex justify-between">
                  <span>Bohranlage {selectedRig.name}</span>
                  <span className="font-semibold">
                    € {parseFloat(selectedRig.dayRate).toLocaleString("de-DE")}
                  </span>
                </div>
              )}
              {equipmentItems.length > 0 && (
                <div className="flex justify-between">
                  <span>
                    Zusatzausrüstung ({equipmentItems.length} Positionen)
                  </span>
                  <span className="font-semibold">
                    € {equipmentTotal.toLocaleString("de-DE")}
                  </span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Gesamt Tagesrate</span>
              <span className="text-3xl font-bold text-primary">
                € {total.toLocaleString("de-DE")}
              </span>
            </div>
            {durationDays > 0 && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    Projektkosten ({requirements.projectDuration})
                  </span>
                  <span className="text-xl font-bold text-primary">
                    € {(total * durationDays).toLocaleString("de-DE")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Save as Tender */}
          {canSaveTender && (
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={onSaveAsTender}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                <Save className="mr-2 h-5 w-5" />
                Als Tender speichern
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück: Equipment
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          Weiter: Tender-Management
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
