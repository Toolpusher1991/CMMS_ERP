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
  Edit,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { Rig } from "@/services/rig.service";
import type { MatchedRig } from "@/hooks/useRigConfigurator";
import type { TenderConfiguration } from "@/services/tender.service";

interface RigSelectionTabProps {
  matchedRigs: MatchedRig[];
  selectedRig: Rig | null;
  isAdmin: boolean;
  savedConfigurations: TenderConfiguration[];
  onSelectRig: (rig: Rig) => void;
  onEditRigPrice: (rig: Rig) => void;
  onEditRig: (rig: Rig) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Checks if a rig is currently under contract in any active tender */
function getContractInfo(
  rigId: string,
  savedConfigurations: TenderConfiguration[],
): {
  isUnderContract: boolean;
  tenders: { projectName: string; clientName?: string; status: string }[];
} {
  const activeTenders = savedConfigurations.filter(
    (config) =>
      config.isUnderContract &&
      config.selectedRig?.id === rigId &&
      !["COMPLETED", "CANCELLED", "REJECTED"].includes(config.status),
  );
  return {
    isUnderContract: activeTenders.length > 0,
    tenders: activeTenders.map((t) => ({
      projectName: t.projectName,
      clientName: t.clientName,
      status: t.status,
    })),
  };
}

export function RigSelectionTab({
  matchedRigs,
  selectedRig,
  isAdmin,
  savedConfigurations,
  onSelectRig,
  onEditRigPrice,
  onEditRig,
  onBack,
  onNext,
}: RigSelectionTabProps) {
  return (
    <div className="space-y-4">
      {matchedRigs.map((rig, index) => {
        const contractInfo = getContractInfo(rig.id, savedConfigurations);

        return (
          <Card
            key={rig.id}
            className={`cursor-pointer transition-all border-2 ${
              selectedRig?.id === rig.id
                ? "ring-2 ring-primary shadow-lg border-primary"
                : "hover:shadow-md hover:border-primary/50"
            } ${
              rig.isSuitable && index === 0
                ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                : ""
            }`}
            onClick={() => onSelectRig(rig)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{rig.name}</CardTitle>
                    <Badge variant="secondary">{rig.category}</Badge>
                    {rig.isSuitable && index === 0 && (
                      <Badge className="bg-green-500">EMPFEHLUNG</Badge>
                    )}
                    {selectedRig?.id === rig.id && (
                      <Badge className="bg-blue-500">AUSGEWÄHLT</Badge>
                    )}
                    {contractInfo.isUnderContract && (
                      <Badge className="bg-amber-500 text-white animate-pulse">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        UNTER VERTRAG
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {rig.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tagesrate</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-2xl font-bold text-green-600">
                      € {parseFloat(rig.dayRate).toLocaleString("de-DE")}
                    </p>
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRigPrice(rig);
                          }}
                          className="h-8 w-8 p-0"
                          title="Preis bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRig(rig);
                          }}
                          className="h-8 px-3"
                          title="Rig bearbeiten"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Admin
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Contract Warning Banner */}
            {contractInfo.isUnderContract && (
              <div className="mx-6 mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Diese Anlage ist aktuell unter Vertrag
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {contractInfo.tenders.map((tender, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300"
                        >
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">
                            {tender.projectName}
                          </span>
                          {tender.clientName && (
                            <span className="text-amber-600 dark:text-amber-400">
                              — {tender.clientName}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700"
                          >
                            {tender.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                      Auswahl ist trotzdem möglich — bitte Verfügbarkeit prüfen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                    MAX. TIEFE
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {rig.maxDepth.toLocaleString()} m
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                    HAKENLAST
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {rig.maxHookLoad} t
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                    DREHMOMENT
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {rig.rotaryTorque.toLocaleString()} Nm
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">
                    PUMPENDRUCK
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {rig.pumpPressure.toLocaleString()} psi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Drawworks</p>
                  <p className="font-semibold">{rig.drawworks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mud Pumps</p>
                  <p className="font-semibold">{rig.mudPumps}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Top Drive</p>
                  <p className="font-semibold">{rig.topDrive}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Crew Size</p>
                  <p className="font-semibold">{rig.crewSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mobilisierung</p>
                  <p className="font-semibold">{rig.mobilizationTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platzbedarf</p>
                  <p className="font-semibold">{rig.footprint}</p>
                </div>
              </div>

              {rig.warnings && rig.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    ⚠️ Hinweise:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                    {rig.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {rig.applications.map((app) => (
                  <Badge key={app} variant="outline">
                    {app}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Wizard navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück: Anforderungen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!selectedRig}
        >
          Weiter: Equipment
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
