import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Plus,
  Eye,
  Download,
  Wrench,
  Package,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MaintenanceSchedule {
  id: string;
  taskName: string;
  description?: string;
  interval: string;
  intervalHours?: number;
  intervalDays?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  estimatedDuration?: string;
  requiredTools?: string;
  safetyNotes?: string;
}

interface SparePart {
  id: string;
  partNumber: string;
  partName: string;
  description?: string;
  category?: string;
  quantity?: number;
  manufacturer?: string;
  supplier?: string;
  replacementInterval?: string;
  criticalPart: boolean;
}

interface Specification {
  id: string;
  category: string;
  name: string;
  value: string;
  unit?: string;
  notes?: string;
}

interface EquipmentManual {
  id: string;
  equipmentName: string;
  equipmentNumber?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  plant: string;
  location?: string;
  manualFileName: string;
  manualFilePath: string;
  manualFileSize: number;
  uploadedAt: string;
  uploadedBy?: string;
  aiProcessed: boolean;
  aiProcessedAt?: string;
  summary?: string;
  maintenanceSchedules?: MaintenanceSchedule[];
  spareParts?: SparePart[];
  specifications?: Specification[];
  createdAt: string;
  updatedAt: string;
}

const EquipmentManuals: React.FC = () => {
  const { toast } = useToast();
  const [manuals, setManuals] = useState<EquipmentManual[]>([]);
  const [filteredManuals, setFilteredManuals] = useState<EquipmentManual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManual, setSelectedManual] = useState<EquipmentManual | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Filters
  const [filterPlant, setFilterPlant] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    equipmentName: "",
    equipmentNumber: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    plant: "",
    location: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadManuals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [manuals, filterPlant, searchTerm]);

  const loadManuals = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: EquipmentManual[];
      }>("/equipment-manuals");

      if (response.success && response.data) {
        setManuals(response.data);
      }
    } catch (error) {
      console.error("Error loading manuals:", error);
      toast({
        title: "Fehler",
        description: "Manuals konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...manuals];

    if (filterPlant !== "all") {
      filtered = filtered.filter((m) => m.plant === filterPlant);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.equipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredManuals(filtered);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast({
          title: "Fehler",
          description: "Bitte nur PDF-Dateien hochladen.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.equipmentName || !uploadForm.plant) {
      toast({
        title: "Fehler",
        description:
          "Bitte füllen Sie alle Pflichtfelder aus und wählen Sie eine Datei.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Uploading manual...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("equipmentName", uploadForm.equipmentName);
      formData.append("plant", uploadForm.plant);
      if (uploadForm.equipmentNumber)
        formData.append("equipmentNumber", uploadForm.equipmentNumber);
      if (uploadForm.manufacturer)
        formData.append("manufacturer", uploadForm.manufacturer);
      if (uploadForm.model) formData.append("model", uploadForm.model);
      if (uploadForm.serialNumber)
        formData.append("serialNumber", uploadForm.serialNumber);
      if (uploadForm.location) formData.append("location", uploadForm.location);

      const response = await apiClient.post<{
        success: boolean;
        data: EquipmentManual;
      }>("/equipment-manuals/upload", formData);

      if (response.success && response.data) {
        setUploadProgress("Analyzing manual with AI...");

        // Start AI processing
        await apiClient.post(`/equipment-manuals/${response.data.id}/process`);

        toast({
          title: "Erfolgreich",
          description: "Manual hochgeladen und wird analysiert.",
        });

        setIsUploadDialogOpen(false);
        setUploadForm({
          equipmentName: "",
          equipmentNumber: "",
          manufacturer: "",
          model: "",
          serialNumber: "",
          plant: "",
          location: "",
        });
        setSelectedFile(null);
        loadManuals();
      }
    } catch (error) {
      console.error("Error uploading manual:", error);
      toast({
        title: "Fehler",
        description: "Manual konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleViewManual = (manual: EquipmentManual) => {
    setSelectedManual(manual);
    setIsViewDialogOpen(true);
  };

  const handleDeleteManual = async (id: string) => {
    if (!confirm("Möchten Sie dieses Manual wirklich löschen?")) return;

    try {
      await apiClient.delete(`/equipment-manuals/${id}`);
      toast({
        title: "Erfolgreich",
        description: "Manual wurde gelöscht.",
      });
      loadManuals();
    } catch (error) {
      console.error("Error deleting manual:", error);
      toast({
        title: "Fehler",
        description: "Manual konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      LOW: "secondary",
      MEDIUM: "default",
      HIGH: "destructive",
      CRITICAL: "destructive",
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Equipment Manuals
            <Badge variant="secondary" className="ml-2">
              BETA
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie Equipment-Handbücher mit AI-gestützter Extraktion von
            Wartungsplänen und Ersatzteilen
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Manual hochladen
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>SAP IH01-inspirierte Struktur</AlertTitle>
        <AlertDescription>
          Upload Sie Equipment-Handbücher und die AI extrahiert automatisch
          Wartungsintervalle, Ersatzteillisten und technische Spezifikationen.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Anlage</Label>
            <Select value={filterPlant} onValueChange={setFilterPlant}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Anlagen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Anlagen</SelectItem>
                <SelectItem value="T208">T208</SelectItem>
                <SelectItem value="T209">T209</SelectItem>
                <SelectItem value="T210">T210</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Suche</Label>
            <Input
              placeholder="Equipment Name, Nummer, Hersteller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manuals List */}
      <Card>
        <CardHeader>
          <CardTitle>Hochgeladene Manuals ({filteredManuals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredManuals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Manuals gefunden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Anlage</TableHead>
                  <TableHead>Hersteller</TableHead>
                  <TableHead>Manual</TableHead>
                  <TableHead>AI-Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManuals.map((manual) => (
                  <TableRow key={manual.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{manual.equipmentName}</p>
                        {manual.equipmentNumber && (
                          <p className="text-sm text-muted-foreground">
                            #{manual.equipmentNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{manual.plant}</Badge>
                    </TableCell>
                    <TableCell>
                      {manual.manufacturer || "-"}
                      {manual.model && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({manual.model})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{manual.manualFileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(manual.manualFileSize)})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {manual.aiProcessed ? (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 w-fit"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Verarbeitet
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 w-fit"
                        >
                          <Loader2 className="w-3 h-3 animate-spin" />
                          In Bearbeitung
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(manual.uploadedAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewManual(manual)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/equipment-manuals/${manual.id}/download`,
                              "_blank"
                            )
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteManual(manual.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Manual hochladen</DialogTitle>
            <DialogDescription>
              Laden Sie ein Equipment-Handbuch (PDF) hoch. Die AI wird
              automatisch Wartungspläne und Ersatzteile extrahieren.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="manual-file">
                Manual (PDF) <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2">
                <Input
                  id="manual-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ausgewählt: {selectedFile.name} (
                    {formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
            </div>

            {/* Equipment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="equipmentName">
                  Equipment Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="equipmentName"
                  value={uploadForm.equipmentName}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      equipmentName: e.target.value,
                    })
                  }
                  placeholder="z.B. Crown Block, Mud Pump"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="equipmentNumber">Equipment Nummer</Label>
                <Input
                  id="equipmentNumber"
                  value={uploadForm.equipmentNumber}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      equipmentNumber: e.target.value,
                    })
                  }
                  placeholder="z.B. EQ-001"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="plant">
                  Anlage <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={uploadForm.plant}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, plant: value })
                  }
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Anlage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T208">T208</SelectItem>
                    <SelectItem value="T209">T209</SelectItem>
                    <SelectItem value="T210">T210</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manufacturer">Hersteller</Label>
                <Input
                  id="manufacturer"
                  value={uploadForm.manufacturer}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      manufacturer: e.target.value,
                    })
                  }
                  placeholder="z.B. National Oilwell Varco"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="model">Modell</Label>
                <Input
                  id="model"
                  value={uploadForm.model}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, model: e.target.value })
                  }
                  placeholder="z.B. 7500"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="serialNumber">Seriennummer</Label>
                <Input
                  id="serialNumber"
                  value={uploadForm.serialNumber}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      serialNumber: e.target.value,
                    })
                  }
                  placeholder="z.B. SN123456"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="location">Standort auf Rig</Label>
                <Input
                  id="location"
                  value={uploadForm.location}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, location: e.target.value })
                  }
                  placeholder="z.B. Drill Floor"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Verarbeitung läuft...</AlertTitle>
                <AlertDescription>{uploadProgress}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Abbrechen
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Hochladen & Analysieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Manual Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedManual?.equipmentName}
              {selectedManual?.aiProcessed ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AI Verarbeitet
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  In Bearbeitung
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedManual?.equipmentNumber &&
                `Equipment #${selectedManual.equipmentNumber} • `}
              {selectedManual?.manufacturer} {selectedManual?.model}
            </DialogDescription>
          </DialogHeader>

          {selectedManual && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="maintenance">
                  <Wrench className="w-4 h-4 mr-2" />
                  Wartung ({selectedManual.maintenanceSchedules?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="parts">
                  <Package className="w-4 h-4 mr-2" />
                  Ersatzteile ({selectedManual.spareParts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="specs">
                  <Info className="w-4 h-4 mr-2" />
                  Spezifikationen ({selectedManual.specifications?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Equipment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Equipment Name
                      </Label>
                      <p className="font-medium">
                        {selectedManual.equipmentName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Equipment Nummer
                      </Label>
                      <p className="font-medium">
                        {selectedManual.equipmentNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Anlage</Label>
                      <Badge variant="outline">{selectedManual.plant}</Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Standort</Label>
                      <p className="font-medium">
                        {selectedManual.location || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Hersteller
                      </Label>
                      <p className="font-medium">
                        {selectedManual.manufacturer || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Modell</Label>
                      <p className="font-medium">
                        {selectedManual.model || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Seriennummer
                      </Label>
                      <p className="font-medium">
                        {selectedManual.serialNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Hochgeladen
                      </Label>
                      <p className="font-medium">
                        {new Date(selectedManual.uploadedAt).toLocaleDateString(
                          "de-DE"
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {selectedManual.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI-Zusammenfassung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">
                        {selectedManual.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Dokument</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span>{selectedManual.manualFileName}</span>
                      <Badge variant="secondary">
                        {formatFileSize(selectedManual.manualFileSize)}
                      </Badge>
                    </div>
                    <Button
                      onClick={() =>
                        window.open(
                          `/api/equipment-manuals/${selectedManual.id}/download`,
                          "_blank"
                        )
                      }
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Manual herunterladen
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance">
                <Card>
                  <CardHeader>
                    <CardTitle>Wartungspläne</CardTitle>
                    <CardDescription>
                      Aus dem Manual extrahierte Wartungsintervalle und Aufgaben
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedManual.maintenanceSchedules ||
                    selectedManual.maintenanceSchedules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Wartungspläne extrahiert</p>
                        {!selectedManual.aiProcessed && (
                          <p className="text-sm mt-2">
                            AI-Verarbeitung läuft noch...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedManual.maintenanceSchedules.map((schedule) => (
                          <Card key={schedule.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {schedule.taskName}
                                  </CardTitle>
                                  {schedule.category && (
                                    <Badge variant="outline" className="mt-1">
                                      {schedule.category}
                                    </Badge>
                                  )}
                                </div>
                                {getPriorityBadge(schedule.priority)}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {schedule.description && (
                                <p className="text-sm">
                                  {schedule.description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">
                                    Intervall
                                  </Label>
                                  <p className="font-medium">
                                    {schedule.interval}
                                  </p>
                                </div>
                                {schedule.estimatedDuration && (
                                  <div>
                                    <Label className="text-muted-foreground">
                                      Dauer
                                    </Label>
                                    <p className="font-medium">
                                      {schedule.estimatedDuration}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {schedule.requiredTools && (
                                <div>
                                  <Label className="text-muted-foreground">
                                    Benötigte Werkzeuge
                                  </Label>
                                  <p className="text-sm">
                                    {schedule.requiredTools}
                                  </p>
                                </div>
                              )}
                              {schedule.safetyNotes && (
                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Sicherheitshinweise</AlertTitle>
                                  <AlertDescription>
                                    {schedule.safetyNotes}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Spare Parts Tab */}
              <TabsContent value="parts">
                <Card>
                  <CardHeader>
                    <CardTitle>Ersatzteile</CardTitle>
                    <CardDescription>
                      Aus dem Manual extrahierte Ersatzteile und Teilenummern
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedManual.spareParts ||
                    selectedManual.spareParts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Ersatzteile extrahiert</p>
                        {!selectedManual.aiProcessed && (
                          <p className="text-sm mt-2">
                            AI-Verarbeitung läuft noch...
                          </p>
                        )}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teilenummer</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Kategorie</TableHead>
                            <TableHead>Hersteller</TableHead>
                            <TableHead>Austauschintervall</TableHead>
                            <TableHead>Kritisch</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedManual.spareParts.map((part) => (
                            <TableRow key={part.id}>
                              <TableCell className="font-mono text-sm">
                                {part.partNumber}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{part.partName}</p>
                                  {part.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {part.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {part.category ? (
                                  <Badge variant="outline">
                                    {part.category}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>{part.manufacturer || "-"}</TableCell>
                              <TableCell>
                                {part.replacementInterval || "-"}
                              </TableCell>
                              <TableCell>
                                {part.criticalPart ? (
                                  <Badge variant="destructive">Ja</Badge>
                                ) : (
                                  <Badge variant="secondary">Nein</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Specifications Tab */}
              <TabsContent value="specs">
                <Card>
                  <CardHeader>
                    <CardTitle>Technische Spezifikationen</CardTitle>
                    <CardDescription>
                      Aus dem Manual extrahierte technische Daten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedManual.specifications ||
                    selectedManual.specifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Spezifikationen extrahiert</p>
                        {!selectedManual.aiProcessed && (
                          <p className="text-sm mt-2">
                            AI-Verarbeitung läuft noch...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Group by category */}
                        {Object.entries(
                          selectedManual.specifications.reduce((acc, spec) => {
                            if (!acc[spec.category]) acc[spec.category] = [];
                            acc[spec.category].push(spec);
                            return acc;
                          }, {} as Record<string, Specification[]>)
                        ).map(([category, specs]) => (
                          <Card key={category}>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {category}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableBody>
                                  {specs.map((spec) => (
                                    <TableRow key={spec.id}>
                                      <TableCell className="font-medium">
                                        {spec.name}
                                      </TableCell>
                                      <TableCell>
                                        {spec.value} {spec.unit && spec.unit}
                                      </TableCell>
                                      {spec.notes && (
                                        <TableCell className="text-sm text-muted-foreground">
                                          {spec.notes}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentManuals;
