import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ActionTask {
  id?: string;
  title: string;
  description?: string;
  assignedUser?: string;
  dueDate?: string;
  completed: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  plant?: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Partial<ActionTask>;
  onTaskChange: (task: Partial<ActionTask>) => void;
  onSave: () => void;
  availableUsers: User[];
  currentActionPlant?: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onTaskChange,
  onSave,
  availableUsers,
  currentActionPlant,
}: TaskDialogProps) {
  const filteredUsers = availableUsers.filter(
    (user) =>
      // Alle Admins und Manager
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      // ODER User der gleichen Anlage
      user.plant === currentActionPlant ||
      // ODER wenn keine plant zugewiesen, dann alle User
      !user.plant
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task.id ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
          </DialogTitle>
          <DialogDescription>
            {task.id
              ? "Bearbeiten Sie die Unteraufgabe für diese Action."
              : "Fügen Sie eine Unteraufgabe für diese Action hinzu."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titel *</Label>
            <Input
              id="task-title"
              value={task.title || ""}
              onChange={(e) => onTaskChange({ ...task, title: e.target.value })}
              placeholder="z.B. Kabel verlegen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Beschreibung</Label>
            <Textarea
              id="task-description"
              value={task.description || ""}
              onChange={(e) =>
                onTaskChange({
                  ...task,
                  description: e.target.value,
                })
              }
              placeholder="Detaillierte Beschreibung der Aufgabe"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-assigned">Zugewiesen an</Label>
            <Select
              value={task.assignedUser || ""}
              onValueChange={(value) =>
                onTaskChange({ ...task, assignedUser: value })
              }
            >
              <SelectTrigger id="task-assigned">
                <SelectValue placeholder="User auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Keine verfügbaren User
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        {user.plant && (
                          <Badge variant="secondary" className="text-xs">
                            {user.plant}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-duedate">Fälligkeitsdatum</Label>
            <Input
              id="task-duedate"
              type="date"
              value={task.dueDate || ""}
              onChange={(e) =>
                onTaskChange({ ...task, dueDate: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave}>
            {task.id ? "Aufgabe speichern" : "Aufgabe erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
