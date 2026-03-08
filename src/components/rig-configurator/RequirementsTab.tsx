import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, RotateCcw, ChevronRight } from "lucide-react";
import type { ProjectRequirements } from "./types";

interface RequirementsTabProps {
  requirements: ProjectRequirements;
  setRequirements: React.Dispatch<React.SetStateAction<ProjectRequirements>>;
  matchedRigsCount: number;
  onFindRigs: () => void;
  onReset: () => void;
}

export function RequirementsTab({
  requirements,
  setRequirements,
  matchedRigsCount,
  onFindRigs,
  onReset,
}: RequirementsTabProps) {
  const updateField = <K extends keyof ProjectRequirements>(
    field: K,
    value: ProjectRequirements[K],
  ) => {
    setRequirements((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <CardTitle>Projekt-Anforderungen</CardTitle>
          <CardDescription>
            Geben Sie die Projekt-Details und Bohr-Parameter ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Projektname *</Label>
              <Input
                id="projectName"
                value={requirements.projectName}
                onChange={(e) => updateField("projectName", e.target.value)}
                placeholder="z.B. North Sea Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Kunde *</Label>
              <Input
                id="clientName"
                value={requirements.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="Kundenname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Standort *</Label>
              <Input
                id="location"
                value={requirements.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Bohrstandort"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Projektdauer (Tage)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={requirements.projectDuration.replace(/\D/g, "")}
                onChange={(e) =>
                  updateField(
                    "projectDuration",
                    e.target.value ? `${e.target.value} Tage` : "",
                  )
                }
                placeholder="z.B. 90"
              />
            </div>
          </div>

          <Separator />

          {/* Technical Parameters */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Technische Parameter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depth">Bohrtiefe (m) *</Label>
                <Input
                  id="depth"
                  type="number"
                  value={requirements.depth}
                  onChange={(e) => updateField("depth", e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hookLoad">Hakenlast (t) *</Label>
                <Input
                  id="hookLoad"
                  type="number"
                  value={requirements.hookLoad}
                  onChange={(e) => updateField("hookLoad", e.target.value)}
                  placeholder="400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footprint">Platzbedarf</Label>
                <Select
                  value={requirements.footprint}
                  onValueChange={(value) =>
                    updateField(
                      "footprint",
                      value as "" | "Klein" | "Mittel" | "Groß",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Klein">Klein</SelectItem>
                    <SelectItem value="Mittel">Mittel</SelectItem>
                    <SelectItem value="Groß">Groß</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="torque">Rotary-Drehmoment (Nm)</Label>
                <Input
                  id="torque"
                  type="number"
                  value={requirements.rotaryTorque}
                  onChange={(e) => updateField("rotaryTorque", e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pressure">Pumpendruck (psi)</Label>
                <Input
                  id="pressure"
                  type="number"
                  value={requirements.pumpPressure}
                  onChange={(e) => updateField("pumpPressure", e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mudWeight">Spülungsgewicht (ppg)</Label>
                <Input
                  id="mudWeight"
                  type="number"
                  step="0.1"
                  value={requirements.mudWeight}
                  onChange={(e) => updateField("mudWeight", e.target.value)}
                  placeholder="12.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="casingSize">Casing Größe (&quot;)</Label>
                <Input
                  id="casingSize"
                  value={requirements.casingSize}
                  onChange={(e) => updateField("casingSize", e.target.value)}
                  placeholder='13 3/8"'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holeSize">Bohrloch Größe (&quot;)</Label>
                <Input
                  id="holeSize"
                  value={requirements.holeSize}
                  onChange={(e) => updateField("holeSize", e.target.value)}
                  placeholder='17 1/2"'
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formPressure">Formationsdruck (psi)</Label>
                <Input
                  id="formPressure"
                  type="number"
                  value={requirements.formationPressure}
                  onChange={(e) =>
                    updateField("formationPressure", e.target.value)
                  }
                  placeholder="8000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Zusätzliche Anforderungen</Label>
            <Textarea
              id="notes"
              value={requirements.additionalNotes}
              onChange={(e) => updateField("additionalNotes", e.target.value)}
              placeholder="Spezielle Anforderungen, Besonderheiten..."
              rows={4}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={!requirements.depth && !requirements.hookLoad}
              onClick={onFindRigs}
            >
              <Search className="mr-2 h-5 w-5" />
              Passende Anlagen finden ({matchedRigsCount})
            </Button>
            <Button size="lg" variant="outline" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurücksetzen
            </Button>
          </div>

          {/* Wizard: next step */}
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={onFindRigs}>
              Weiter: Anlagen auswählen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
