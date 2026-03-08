import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Plus,
  BarChart3,
  ClipboardList,
  Calculator,
  Eye,
  Settings,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import type { Rig } from "@/services/rig.service";
import type { TenderConfiguration } from "@/services/tender.service";
import type { ProjectRequirements, EquipmentItem } from "./types";
import TenderBoard from "@/components/tender-board/TenderBoard";

interface TenderTabProps {
  // Current configuration
  selectedRig: Rig | null;
  requirements: ProjectRequirements;
  selectedEquipment: Record<string, EquipmentItem[]>;
  calculateTotal: () => number;

  // Tender data
  savedConfigurations: TenderConfiguration[];
  loadingTenders: boolean;

  // View mode
  tenderViewMode: "table" | "gantt" | "board";
  setTenderViewMode: (mode: "table" | "gantt" | "board") => void;

  // Actions
  onSaveConfiguration: () => void;
  onToggleContract: (id: string) => void;
  onDeleteTender: (id: string) => void;
  onEquipmentManagement: (config: TenderConfiguration) => void;
  onGoToRequirements: () => void;
  onBack: () => void;

  // Helpers
  calculateTenderDuration: (config: TenderConfiguration) => number;
  calculateDaysElapsed: (config: TenderConfiguration) => number;
}

export function TenderTab({
  selectedRig,
  requirements,
  selectedEquipment,
  calculateTotal,
  savedConfigurations,
  loadingTenders,
  tenderViewMode,
  setTenderViewMode,
  onSaveConfiguration,
  onToggleContract,
  onDeleteTender,
  onEquipmentManagement,
  onGoToRequirements,
  onBack,
  calculateTenderDuration,
  calculateDaysElapsed,
}: TenderTabProps) {
  const hasCurrentConfig = !!(selectedRig && requirements.projectName);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  Tender-Management
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                  Professionelle Verwaltung aller Bohranlage-Konfigurationen und
                  Vertragsstatus
                </CardDescription>
              </div>
            </div>
            {savedConfigurations.length > 0 && (
              <div className="flex items-center gap-4 text-sm bg-card px-4 py-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
                  <span className="font-medium">
                    Unter Vertrag:{" "}
                    {
                      savedConfigurations.filter((c) => c.isUnderContract)
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm" />
                  <span className="font-medium">
                    Ausstehend:{" "}
                    {
                      savedConfigurations.filter((c) => !c.isUnderContract)
                        .length
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* View Toggle and Save Button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant={tenderViewMode === "board" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTenderViewMode("board")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Board
                </Button>
                <Button
                  variant={tenderViewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTenderViewMode("table")}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Tabelle
                </Button>
                <Button
                  variant={tenderViewMode === "gantt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTenderViewMode("gantt")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gantt-Ansicht
                </Button>
              </div>

              {hasCurrentConfig ? (
                <Button
                  onClick={onSaveConfiguration}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Aktuelle Konfiguration als Tender speichern
                </Button>
              ) : (
                <Button
                  onClick={onGoToRequirements}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Tender erstellen
                </Button>
              )}
            </div>

            {/* Board View */}
            {tenderViewMode === "board" && <TenderBoard />}

            {/* Gantt Chart View */}
            {tenderViewMode === "gantt" && (
              <GanttView
                configurations={savedConfigurations}
                calculateTenderDuration={calculateTenderDuration}
                calculateDaysElapsed={calculateDaysElapsed}
              />
            )}

            {/* Table View */}
            {tenderViewMode === "table" && (
              <TenderTable
                hasCurrentConfig={hasCurrentConfig}
                selectedRig={selectedRig}
                requirements={requirements}
                selectedEquipment={selectedEquipment}
                calculateTotal={calculateTotal}
                savedConfigurations={savedConfigurations}
                loadingTenders={loadingTenders}
                onSaveConfiguration={onSaveConfiguration}
                onToggleContract={onToggleContract}
                onDeleteTender={onDeleteTender}
                onEquipmentManagement={onEquipmentManagement}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wizard navigation */}
      <div className="flex justify-start pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück: Zusammenfassung
        </Button>
      </div>
    </div>
  );
}

// ── Gantt View Sub-Component ─────────────────────────
function GanttView({
  configurations,
  calculateTenderDuration,
  calculateDaysElapsed,
}: {
  configurations: TenderConfiguration[];
  calculateTenderDuration: (c: TenderConfiguration) => number;
  calculateDaysElapsed: (c: TenderConfiguration) => number;
}) {
  const contractedConfigs = configurations.filter(
    (c) => c.isUnderContract && c.contractStartDate,
  );

  if (contractedConfigs.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center py-8">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              Keine Verträge aktiv
            </p>
            <p className="text-sm text-muted-foreground">
              Vergeben Sie einen Vertrag, um das Gantt-Diagramm anzuzeigen.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Vertragslaufzeiten - Gantt-Diagramm
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contractedConfigs.map((config) => {
            const duration = calculateTenderDuration(config);
            const elapsed = calculateDaysElapsed(config);
            const progress =
              duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;

            return (
              <div key={config.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {config.selectedRig?.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {config.projectName}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {elapsed} / {duration} Tage ({progress.toFixed(0)}%)
                  </span>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="h-full flex items-center justify-end pr-2">
                      {progress > 15 && (
                        <span className="text-xs font-semibold text-white">
                          {progress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Start:{" "}
                    {new Date(config.contractStartDate!).toLocaleDateString(
                      "de-DE",
                    )}
                  </span>
                  <span>
                    Ende:{" "}
                    {config.contractEndDate
                      ? new Date(config.contractEndDate).toLocaleDateString("de-DE")
                      : new Date(
                          new Date(config.contractStartDate!).getTime() +
                            duration * 24 * 60 * 60 * 1000,
                        ).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Table View Sub-Component ─────────────────────────
function TenderTable({
  hasCurrentConfig,
  selectedRig,
  requirements,
  selectedEquipment,
  calculateTotal,
  savedConfigurations,
  loadingTenders,
  onSaveConfiguration,
  onToggleContract,
  onDeleteTender,
  onEquipmentManagement,
}: {
  hasCurrentConfig: boolean;
  selectedRig: Rig | null;
  requirements: ProjectRequirements;
  selectedEquipment: Record<string, EquipmentItem[]>;
  calculateTotal: () => number;
  savedConfigurations: TenderConfiguration[];
  loadingTenders: boolean;
  onSaveConfiguration: () => void;
  onToggleContract: (id: string) => void;
  onDeleteTender: (id: string) => void;
  onEquipmentManagement: (config: TenderConfiguration) => void;
}) {
  const equipTotal = Object.values(selectedEquipment)
    .flat()
    .reduce((sum, eq) => sum + parseFloat(eq.price), 0);

  return (
    <div className="rounded-xl border-2 border-primary/20 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <th className="text-left p-4 font-bold text-primary">
                Rig & Projekt
              </th>
              <th className="text-left p-4 font-bold text-primary">
                Tagesrate Details
              </th>
              <th className="text-left p-4 font-bold text-primary">Dauer</th>
              <th className="text-left p-4 font-bold text-primary">Status</th>
              <th className="text-left p-4 font-bold text-primary">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {/* Current Configuration Row */}
            {hasCurrentConfig && selectedRig && (
              <tr className="border-b bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedRig.name}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      Aktuelle Konfiguration
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {requirements.projectName}
                  </div>
                </td>
                <td className="p-3">
                  <PriceBreakdown
                    rigRate={parseFloat(selectedRig.dayRate)}
                    equipCount={Object.values(selectedEquipment).flat().length}
                    equipTotal={equipTotal}
                    total={calculateTotal()}
                  />
                </td>
                <td className="p-3">{requirements.projectDuration}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-300"
                  >
                    Ausstehend
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    onClick={onSaveConfiguration}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Speichern
                  </Button>
                </td>
              </tr>
            )}

            {/* Pending configurations */}
            {savedConfigurations
              .filter((c) => !c.isUnderContract)
              .map((config) => (
                <TenderRow
                  key={config.id}
                  config={config}
                  variant="pending"
                  onToggleContract={onToggleContract}
                  onDelete={onDeleteTender}
                  onEquipmentManagement={onEquipmentManagement}
                />
              ))}

            {/* Contract section header */}
            {savedConfigurations.some((c) => c.isUnderContract) && (
              <tr className="bg-green-50 dark:bg-green-950/20">
                <td colSpan={5} className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Anlagen unter Vertrag
                    </h4>
                  </div>
                </td>
              </tr>
            )}

            {/* Contracted configurations */}
            {savedConfigurations
              .filter((c) => c.isUnderContract)
              .map((config) => (
                <TenderRow
                  key={config.id}
                  config={config}
                  variant="contracted"
                  onToggleContract={onToggleContract}
                  onDelete={onDeleteTender}
                  onEquipmentManagement={onEquipmentManagement}
                />
              ))}

            {/* Empty / Loading state */}
            {loadingTenders && savedConfigurations.length === 0 && (
              <tr className="border-b">
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  Tender werden geladen...
                </td>
              </tr>
            )}
            {!loadingTenders &&
              savedConfigurations.length === 0 &&
              !hasCurrentConfig && (
                <tr className="border-b">
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Calculator className="h-8 w-8 text-muted-foreground/50" />
                      <span>Keine Tender-Konfigurationen gespeichert.</span>
                      <span className="text-sm">
                        Erstellen Sie eine Konfiguration und speichern Sie sie
                        als Tender.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Price Breakdown Mini Component ─────────────────────
function PriceBreakdown({
  rigRate,
  equipCount,
  equipTotal,
  total,
}: {
  rigRate: number;
  equipCount: number;
  equipTotal: number;
  total: number;
}) {
  return (
    <div className="bg-card p-3 rounded-lg border shadow-sm space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Rig Basis:
        </span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          €{rigRate.toLocaleString("de-DE")}/Tag
        </span>
      </div>
      {equipCount > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Equipment ({equipCount}):
          </span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            €{equipTotal.toLocaleString("de-DE")}/Tag
          </span>
        </div>
      )}
      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Gesamtsumme:
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            €{total.toLocaleString("de-DE")}/Tag
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tender Row ─────────────────────────────────────────
function TenderRow({
  config,
  variant,
  onToggleContract,
  onDelete,
  onEquipmentManagement,
}: {
  config: TenderConfiguration;
  variant: "pending" | "contracted";
  onToggleContract: (id: string) => void;
  onDelete: (id: string) => void;
  onEquipmentManagement: (config: TenderConfiguration) => void;
}) {
  const isPending = variant === "pending";
  const rigRate = parseFloat(config.selectedRig?.dayRate ?? "0");
  const equipItems = config.selectedEquipment
    ? Object.values(config.selectedEquipment).flat()
    : [];
  const equipTotal = equipItems.reduce(
    (sum, eq) => sum + parseFloat(eq.price),
    0,
  );
  const total = rigRate + equipTotal;
  const colorClass = isPending
    ? "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
    : "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30";
  const borderLabel = isPending
    ? "border-yellow-500 text-yellow-700"
    : "border-green-500 text-green-700";

  return (
    <tr className={`border-b ${colorClass} cursor-pointer`}>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={borderLabel}>
            {config.selectedRig?.name || "Unbekanntes Rig"}
          </Badge>
          {!isPending && (
            <Badge
              variant="default"
              className="bg-green-500 text-white text-xs"
            >
              Unter Vertrag
            </Badge>
          )}
        </div>
        <div
          className={`text-sm ${isPending ? "text-yellow-700" : "text-green-700"} font-medium mt-1`}
        >
          {config.projectName}
        </div>
      </td>
      <td className="p-3">
        <PriceBreakdown
          rigRate={rigRate}
          equipCount={equipItems.length}
          equipTotal={equipTotal}
          total={total}
        />
      </td>
      <td
        className={`p-3 ${isPending ? "text-yellow-700" : "text-green-700 font-medium"}`}
      >
        {config.projectDuration}
      </td>
      <td className="p-3">
        <Button
          size="sm"
          variant={isPending ? "outline" : "default"}
          className={
            isPending
              ? "border-yellow-500 text-yellow-700 hover:bg-yellow-100"
              : "bg-green-600 hover:bg-green-700 text-white"
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleContract(config.id);
          }}
        >
          {isPending ? "Ausstehend" : "✓ Unter Vertrag"}
        </Button>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 hover:bg-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              onEquipmentManagement(config);
            }}
            title="Equipment verwalten"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={
              isPending
                ? "border-yellow-300 hover:bg-yellow-100"
                : "border-green-300 hover:bg-green-100"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 hover:bg-red-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(config.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
