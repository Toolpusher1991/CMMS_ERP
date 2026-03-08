import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Save, RefreshCw } from "lucide-react";
import type { Rig } from "@/services/rig.service";

interface RigEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRigData: Rig | null;
  setEditingRigData: React.Dispatch<React.SetStateAction<Rig | null>>;
  saving: boolean;
  onSave: () => void;
}

export function RigEditDialog({
  open,
  onOpenChange,
  editingRigData,
  setEditingRigData,
  saving,
  onSave,
}: RigEditDialogProps) {
  if (!editingRigData) return null;

  const updateField = <K extends keyof Rig>(field: K, value: Rig[K]) => {
    setEditingRigData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const canSave =
    !!editingRigData.maxDepth &&
    !!editingRigData.maxHookLoad &&
    !!editingRigData.rotaryTorque &&
    !!editingRigData.pumpPressure &&
    !!editingRigData.drawworks &&
    !!editingRigData.mudPumps &&
    !!editingRigData.topDrive &&
    !!editingRigData.dayRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bohranlage bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die technischen Spezifikationen und Equipment-Details
            für {editingRigData.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Technical Main Specifications */}
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
              🔧 Technische Hauptspezifikationen
              <span className="ml-2 text-xs bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded">
                Admin bearbeitbar
              </span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDepth">
                  Max. Bohrtiefe (m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxDepth"
                  type="number"
                  value={editingRigData.maxDepth}
                  onChange={(e) =>
                    updateField("maxDepth", parseInt(e.target.value) || 0)
                  }
                  placeholder="z.B. 2800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHookLoad">
                  Max. Hakenlast (t) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxHookLoad"
                  type="number"
                  value={editingRigData.maxHookLoad}
                  onChange={(e) =>
                    updateField("maxHookLoad", parseInt(e.target.value) || 0)
                  }
                  placeholder="z.B. 207"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rotaryTorque">
                  Drehmoment (Nm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rotaryTorque"
                  type="number"
                  value={editingRigData.rotaryTorque}
                  onChange={(e) =>
                    updateField("rotaryTorque", parseInt(e.target.value) || 0)
                  }
                  placeholder="z.B. 25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pumpPressure">
                  Pumpendruck (psi) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pumpPressure"
                  type="number"
                  value={editingRigData.pumpPressure}
                  onChange={(e) =>
                    updateField("pumpPressure", parseInt(e.target.value) || 0)
                  }
                  placeholder="z.B. 4200"
                />
              </div>
            </div>
          </div>

          {/* Equipment Details */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              ⚙️ Equipment Details
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawworks">
                Drawworks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="drawworks"
                value={editingRigData.drawworks}
                onChange={(e) => updateField("drawworks", e.target.value)}
                placeholder="z.B. 2000 HP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mudPumps">
                Mud Pumps <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mudPumps"
                value={editingRigData.mudPumps}
                onChange={(e) => updateField("mudPumps", e.target.value)}
                placeholder="z.B. 2x 2200 HP Triplex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topDrive">
                Top Drive <span className="text-red-500">*</span>
              </Label>
              <Input
                id="topDrive"
                value={editingRigData.topDrive}
                onChange={(e) => updateField("topDrive", e.target.value)}
                placeholder="z.B. 1000 HP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="derrickCapacity">
                Derrick Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="derrickCapacity"
                value={editingRigData.derrickCapacity}
                onChange={(e) => updateField("derrickCapacity", e.target.value)}
                placeholder="z.B. 1000 t"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crewSize">
                Crew Size <span className="text-red-500">*</span>
              </Label>
              <Input
                id="crewSize"
                value={editingRigData.crewSize}
                onChange={(e) => updateField("crewSize", e.target.value)}
                placeholder="z.B. 45-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobilizationTime">
                Mobilization Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobilizationTime"
                value={editingRigData.mobilizationTime}
                onChange={(e) =>
                  updateField("mobilizationTime", e.target.value)
                }
                placeholder="z.B. 30-45 Tage"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="dayRate">
              Tagesrate (€) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dayRate"
              type="number"
              value={editingRigData.dayRate}
              onChange={(e) => updateField("dayRate", e.target.value)}
              placeholder="85000"
            />
            {editingRigData.dayRate && (
              <p className="text-sm text-muted-foreground">
                Formatiert: €{" "}
                {parseFloat(editingRigData.dayRate).toLocaleString("de-DE")} /
                Tag
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Diese Änderungen werden in der Datenbank gespeichert und sind
              für alle Benutzer sichtbar.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={saving || !canSave}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Im Backend speichern
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
