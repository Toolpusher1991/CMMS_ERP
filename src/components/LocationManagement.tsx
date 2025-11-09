import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getLocations,
  saveLocations,
  resetLocations,
  DEFAULT_LOCATIONS,
  type Location,
} from "@/config/locations";
import { Switch } from "@/components/ui/switch";

export const LocationManagement = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Partial<Location>>({
    id: "",
    name: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    setLocations(getLocations());
  };

  const handleSave = () => {
    if (!formData.name || !formData.id) {
      toast({
        title: "Fehler",
        description: "ID und Name sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    let updatedLocations: Location[];

    if (editingLocation) {
      // Update existing
      updatedLocations = locations.map((loc) =>
        loc.id === editingLocation.id ? { ...(formData as Location) } : loc
      );
    } else {
      // Add new
      if (locations.some((loc) => loc.id === formData.id)) {
        toast({
          title: "Fehler",
          description: "Eine Location mit dieser ID existiert bereits",
          variant: "destructive",
        });
        return;
      }
      updatedLocations = [...locations, formData as Location];
    }

    setLocations(updatedLocations);
    saveLocations(updatedLocations);

    toast({
      title: "Erfolgreich",
      description: `Standort "${formData.name}" wurde gespeichert`,
    });

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    const updatedLocations = locations.filter((loc) => loc.id !== id);
    setLocations(updatedLocations);
    saveLocations(updatedLocations);

    toast({
      title: "Gelöscht",
      description: "Standort wurde entfernt",
    });
  };

  const handleReset = () => {
    if (
      confirm(
        "Möchten Sie wirklich alle Standorte auf die Standardwerte zurücksetzen?"
      )
    ) {
      resetLocations();
      setLocations(DEFAULT_LOCATIONS);
      toast({
        title: "Zurückgesetzt",
        description: "Standorte wurden auf Standard zurückgesetzt",
      });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      active: true,
    });
  };

  const toggleActive = (id: string) => {
    const updatedLocations = locations.map((loc) =>
      loc.id === id ? { ...loc, active: !loc.active } : loc
    );
    setLocations(updatedLocations);
    saveLocations(updatedLocations);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Standort-Verwaltung
              </CardTitle>
              <CardDescription>
                Verwalten Sie die verfügbaren Standorte für Actions und
                Schadensmeldungen
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Zurücksetzen
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Standort
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{location.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {location.id}
                      </Badge>
                      {!location.active && (
                        <Badge variant="destructive" className="text-xs">
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-muted-foreground">
                        {location.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`active-${location.id}`}
                      className="text-xs"
                    >
                      Aktiv
                    </Label>
                    <Switch
                      id={`active-${location.id}`}
                      checked={location.active}
                      onCheckedChange={() => toggleActive(location.id)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(location)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(location.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Standort bearbeiten" : "Neuer Standort"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Details für den Standort ein
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID (Kurzform) *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value.toUpperCase() })
                }
                placeholder="z.B. TD, MP1"
                disabled={!!editingLocation}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="z.B. Top Drive"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optionale Beschreibung"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
