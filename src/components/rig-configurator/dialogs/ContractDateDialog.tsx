import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import type { TenderConfiguration } from "@/services/tender.service";

interface ContractDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingConfig: TenderConfiguration | null;
  contractStartDate: Date | undefined;
  setContractStartDate: (date: Date | undefined) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function ContractDateDialog({
  open,
  onOpenChange,
  pendingConfig,
  contractStartDate,
  setContractStartDate,
  isSubmitting,
  onConfirm,
}: ContractDateDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vertragsstartdatum festlegen</DialogTitle>
          <DialogDescription>
            Wählen Sie das Startdatum für den Vertrag mit{" "}
            <strong>{pendingConfig?.selectedRig?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vertragsbeginn *</Label>
            <DatePicker
              date={contractStartDate}
              onSelect={setContractStartDate}
              placeholder="Startdatum wählen"
            />
          </div>

          {pendingConfig && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projekt:</span>
                    <span className="font-medium">
                      {pendingConfig.projectName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Geplante Dauer:
                    </span>
                    <span className="font-medium">
                      {pendingConfig.projectDuration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tagesrate:</span>
                    <span className="font-medium text-primary">
                      €{pendingConfig.totalPrice.toLocaleString("de-DE")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!contractStartDate || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Wird gespeichert..." : "Vertrag starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
