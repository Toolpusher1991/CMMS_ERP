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
import { X, Save } from "lucide-react";
import type { Rig } from "@/services/rig.service";
import type { EquipmentItem } from "../types";

interface PriceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRig: Rig | null;
  editingEquipmentItem: EquipmentItem | null;
  tempPrice: string;
  setTempPrice: (price: string) => void;
  onSave: () => void;
}

export function PriceEditDialog({
  open,
  onOpenChange,
  editingRig,
  editingEquipmentItem,
  tempPrice,
  setTempPrice,
  onSave,
}: PriceEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preis bearbeiten</DialogTitle>
          <DialogDescription>
            {editingRig && `Tagesrate für ${editingRig.name} anpassen`}
            {editingEquipmentItem &&
              `Preis für ${editingEquipmentItem.name} anpassen`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preis (€)</Label>
            <Input
              id="price"
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              placeholder="z.B. 85000"
              className="text-lg font-semibold"
            />
            <p className="text-sm text-muted-foreground">
              Formatiert: €{" "}
              {tempPrice ? parseFloat(tempPrice).toLocaleString("de-DE") : "0"}
              {(editingRig || editingEquipmentItem) && " / Tag"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
          <Button
            onClick={onSave}
            disabled={!tempPrice || parseFloat(tempPrice) <= 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Preis speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
