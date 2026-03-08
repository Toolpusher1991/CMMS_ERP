import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  FileDown,
  Save,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  User,
  Ruler,
  Weight,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
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
  const rigDayRate = selectedRig ? parseFloat(selectedRig.dayRate) : 0;
  const rigCostPct = total > 0 ? Math.round((rigDayRate / total) * 100) : 0;
  const equipCostPct = total > 0 ? Math.round((equipmentTotal / total) * 100) : 0;
  const categoriesWithItems = Object.entries(selectedEquipment).filter(
    ([, items]) => items.length > 0,
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {requirements.projectName || "Konfigurationsübersicht"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {requirements.clientName && `${requirements.clientName} — `}
            Angebotszusammenfassung & Kostenkalkulation
          </p>
        </div>
        <div className="flex gap-2">
          {canSaveTender && (
            <Button
              onClick={onSaveAsTender}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Save className="mr-2 h-4 w-4" />
              Als Tender speichern
            </Button>
          )}
          <Button
            onClick={onExport}
            size="lg"
            className="bg-green-600 hover:bg-green-700 shadow-lg"
          >
            <FileDown className="mr-2 h-5 w-5" />
            PDF-Angebot erstellen
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Tagesrate Gesamt
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  € {total.toLocaleString("de-DE")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {durationDays > 0 ? `Projektkosten (${durationDays}d)` : "Projektkosten"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {durationDays > 0
                    ? `€ ${(total * durationDays).toLocaleString("de-DE")}`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Equipment
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {equipmentItems.length} Pos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Projektdauer
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {requirements.projectDuration || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout: Project Info + Rig Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Information */}
        <Card className="border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Projekt-Details
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: Building2, label: "Projektname", value: requirements.projectName },
                { icon: User, label: "Kunde", value: requirements.clientName },
                { icon: MapPin, label: "Standort", value: requirements.location },
                { icon: Calendar, label: "Dauer", value: requirements.projectDuration },
                { icon: Ruler, label: "Zieltiefe", value: requirements.depth ? `${requirements.depth} m` : "" },
                { icon: Weight, label: "Hakenlast", value: requirements.hookLoad ? `${requirements.hookLoad} t` : "" },
              ]
                .filter((item) => item.value)
                .map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold">{value}</span>
                    </div>
                  </div>
                ))}
            </div>
            {requirements.additionalNotes && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Anmerkungen</p>
                <p className="text-sm">{requirements.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Rig */}
        <Card className="border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ausgewählte Anlage
              </h3>
            </div>
            {selectedRig ? (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xl font-bold">{selectedRig.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {selectedRig.description}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-sm px-3 py-1">
                    € {parseFloat(selectedRig.dayRate).toLocaleString("de-DE")}/Tag
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Max. Tiefe", value: `${selectedRig.maxDepth?.toLocaleString()} m` },
                    { label: "Hakenlast", value: `${selectedRig.maxHookLoad} t` },
                    { label: "Crew", value: `${selectedRig.crewSize} Personen` },
                    { label: "Mobilisierung", value: selectedRig.mobilizationTime },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-muted/50 rounded-lg p-2.5 border border-muted"
                    >
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Keine Anlage ausgewählt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Equipment Breakdown */}
      {categoriesWithItems.length > 0 && (
        <Card className="border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Ausgewählte Ausrüstung
                </h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {equipmentItems.length} Positionen
              </Badge>
            </div>
            <div className="space-y-4">
              {categoriesWithItems.map(([key, items]) => {
                const category = equipmentCategories[key];
                const catTotal = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{category?.name ?? key}</p>
                      <span className="text-sm font-semibold text-green-600">
                        € {catTotal.toLocaleString("de-DE")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm bg-muted/40 px-3 py-2 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-green-600 ml-2 whitespace-nowrap">
                            € {parseFloat(item.price).toLocaleString("de-DE")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Kostenkalkulation
            </h3>
          </div>

          {/* Cost distribution bar */}
          {total > 0 && (
            <div className="mb-5">
              <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 rounded-l-full transition-all"
                  style={{ width: `${rigCostPct}%` }}
                />
                <div
                  className="bg-purple-500 rounded-r-full transition-all"
                  style={{ width: `${equipCostPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Anlage ({rigCostPct}%)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  Equipment ({equipCostPct}%)
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {selectedRig && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Bohranlage {selectedRig.name}</span>
                </div>
                <span className="font-semibold">
                  € {parseFloat(selectedRig.dayRate).toLocaleString("de-DE")}
                </span>
              </div>
            )}
            {equipmentItems.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">
                    Zusatzausrüstung ({equipmentItems.length} Positionen)
                  </span>
                </div>
                <span className="font-semibold">
                  € {equipmentTotal.toLocaleString("de-DE")}
                </span>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Gesamt Tagesrate</span>
            <span className="text-3xl font-bold text-primary">
              € {total.toLocaleString("de-DE")}
            </span>
          </div>

          {durationDays > 0 && (
            <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-between">
              <div>
                <span className="font-semibold">Projektgesamtkosten</span>
                <p className="text-xs text-muted-foreground">
                  {durationDays} Tage × € {total.toLocaleString("de-DE")}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">
                € {(total * durationDays).toLocaleString("de-DE")}
              </span>
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
