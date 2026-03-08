import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

interface QuickActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: { categoryName: string; equipmentName: string } | null;
  form: { assignedTo: string; description: string };
  setForm: (form: { assignedTo: string; description: string }) => void;
  users: { id: string; email: string; firstName: string; lastName: string }[];
  onSubmit: () => void;
}

export function QuickActionDialog({
  open,
  onOpenChange,
  equipment,
  form,
  setForm,
  users,
  onSubmit,
}: QuickActionDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
    setForm({ assignedTo: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tender-Aufgabe erstellen</DialogTitle>
          <DialogDescription>
            Erstelle eine neue Aufgabe für {equipment?.equipmentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Equipment</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{equipment?.equipmentName}</p>
              <p className="text-sm text-muted-foreground">
                {equipment?.categoryName}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Zuweisen an *</Label>
            <Select
              value={form.assignedTo}
              onValueChange={(value) => setForm({ ...form, assignedTo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Benutzer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Aufgabenbeschreibung *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="z.B. @Philip Bitte Preise für die Tanks kalkulieren"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Tipp: Verwende @ um Personen zu erwähnen
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Hinweis:</strong> Die Aufgabe wird automatisch dem Action
              Tracker mit einer Frist von 7 Tagen hinzugefügt.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Action erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
