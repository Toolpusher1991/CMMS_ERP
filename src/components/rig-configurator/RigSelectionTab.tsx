import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import type { Rig } from "@/services/rig.service";
import type { MatchedRig } from "@/hooks/useRigConfigurator";

interface RigSelectionTabProps {
  matchedRigs: MatchedRig[];
  selectedRig: Rig | null;
  isAdmin: boolean;
  onSelectRig: (rig: Rig) => void;
  onEditRigPrice: (rig: Rig) => void;
  onEditRig: (rig: Rig) => void;
  onBack: () => void;
  onNext: () => void;
}

export function RigSelectionTab({
  matchedRigs,
  selectedRig,
  isAdmin,
  onSelectRig,
  onEditRigPrice,
  onEditRig,
  onBack,
  onNext,
}: RigSelectionTabProps) {
  return (
    <div className="space-y-4">
      {matchedRigs.map((rig, index) => (
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
      ))}

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
