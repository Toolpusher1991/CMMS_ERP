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
import { X, Save, Plus } from "lucide-react";
import type { EquipmentCatalog } from "@/data/equipment-catalog";

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  selectedCategory: string;
  equipmentCategories: EquipmentCatalog;
  form: Record<string, string>;
  setForm: (form: Record<string, string>) => void;
  onSave: () => void;
}

export function EquipmentFormDialog({
  open,
  onOpenChange,
  mode,
  selectedCategory,
  equipmentCategories,
  form,
  setForm,
  onSave,
}: EquipmentFormDialogProps) {
  const extraFields = Object.entries(form).filter(
    ([key]) => key !== "id" && key !== "name" && key !== "price",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Neues Equipment hinzufügen"
              : "Equipment bearbeiten"}
          </DialogTitle>
          <DialogDescription>
            {selectedCategory && equipmentCategories[selectedCategory]?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="equipment-name">Name *</Label>
            <Input
              id="equipment-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='z.B. 5" Bohrgestänge (Drill Pipe)'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment-price">Preis (€ / Tag) *</Label>
            <Input
              id="equipment-price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="450"
            />
            {form.price && (
              <p className="text-sm text-muted-foreground">
                Formatiert: € {parseFloat(form.price).toLocaleString("de-DE")} /
                Tag
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Zusätzliche Eigenschaften (optional)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Fügen Sie beliebige zusätzliche Informationen hinzu
            </p>

            {extraFields.map(([key, value], index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Eigenschaft (z.B. spec, capacity)"
                  value={key}
                  onChange={(e) => {
                    const newForm = { ...form };
                    delete newForm[key];
                    newForm[e.target.value] = value;
                    setForm(newForm);
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="Wert"
                  value={value}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const newForm = { ...form };
                    delete newForm[key];
                    setForm(newForm);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({ ...form, [`property_${Date.now()}`]: "" })
              }
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Eigenschaft hinzufügen
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={!form.name || !form.price}>
            <Save className="mr-2 h-4 w-4" />
            {mode === "add" ? "Hinzufügen" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
