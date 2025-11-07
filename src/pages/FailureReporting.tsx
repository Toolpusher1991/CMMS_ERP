import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/services/api";
import { authService } from "@/services/auth.service";
import { isMobileDevice } from "@/lib/device-detection";
import { getActiveLocations } from "@/config/locations";
import { cn } from "@/lib/utils";
import "./FailureReporting.mobile.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Plus,
  Camera,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X,
  MapPin,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Global cache for user list (shared with ActionTracker)
interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedPlant?: string;
}

const userListCache: {
  data: UserListItem[] | null;
  timestamp: number;
  maxAge: number;
} = {
  data: null,
  timestamp: 0,
  maxAge: 5 * 60 * 1000, // 5 minutes
};

interface FailureReport {
  id: string;
  ticketNumber: string; // Format: T208-202510-001
  plant: "T208" | "T207" | "T700" | "T46";
  title: string;
  description: string;
  location?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "IN_REVIEW" | "CONVERTED_TO_ACTION" | "RESOLVED";
  photoFilename?: string;
  photoPath?: string;
  reportedBy: string;
  reportedByName: string;
  convertedToActionId?: string;
  convertedAt?: string;
  convertedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface FailureReportingProps {
  initialReportId?: string;
  onNavigateBack?: () => void;
}

const FailureReportingPage = ({ initialReportId, onNavigateBack }: FailureReportingProps) => {
  const { toast } = useToast();
  const isMobile = isMobileDevice();
  const [activeTab, setActiveTab] = useState<string>("T208");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [reportToConvert, setReportToConvert] = useState<FailureReport | null>(
    null
  );
  const [_isLoading, setIsLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoViewDialogOpen, setPhotoViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoUploadInProgressRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Get available plants based on current user
  const getAvailablePlants = () => {
    const currentUser = authService.getCurrentUser();
    const allPlants = ["T208", "T207", "T700", "T46"];

    // If user has assigned plant and is not admin/manager, only show their plant
    if (
      currentUser?.assignedPlant &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "MANAGER"
    ) {
      return [currentUser.assignedPlant];
    }

    // Show all plants for admins/managers or users without plant assignment
    return allPlants;
  };

  const [currentReport, setCurrentReport] = useState<Partial<FailureReport>>({
    plant: "T208",
    title: "",
    description: "",
    location: "",
    severity: "MEDIUM",
  });

  const [convertData, setConvertData] = useState({
    assignedTo: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: undefined as Date | undefined,
  });

  const [reports, setReports] = useState<FailureReport[]>([]);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      assignedPlant?: string;
    }>
  >([]);

  useEffect(() => {
    setIsMounted(true);
    loadReports();
    loadUsers();

    // Set initial active tab to user's first available plant
    const availablePlants = getAvailablePlants();
    if (availablePlants.length > 0) {
      setActiveTab(availablePlants[0]);
    }

    return () => {
      setIsMounted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initial report ID
  useEffect(() => {
    if (initialReportId && reports.length > 0) {
      const report = reports.find((r) => r.id === initialReportId);
      if (report) {
        // Switch to the correct plant tab
        setActiveTab(report.plant);
      }
    }
  }, [initialReportId, reports]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.request<FailureReport[]>(
        "/failure-reports"
      );
      setReports(response);

      if (isMounted) {
        toast({
          title: "Failure Reports geladen",
          description: `${response.length} Berichte erfolgreich geladen.`,
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden der Failure Reports:", error);
      if (isMounted) {
        toast({
          title: "Fehler",
          description: "Failure Reports konnten nicht geladen werden.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const loadUsers = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (
        userListCache.data &&
        now - userListCache.timestamp < userListCache.maxAge
      ) {
        console.log("Using cached user list");
        setUsers(userListCache.data);
        return;
      }

      // Fetch from API
      const response = await apiClient.request<
        Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          assignedPlant?: string;
        }>
      >("/users/list");

      // Update cache
      userListCache.data = response;
      userListCache.timestamp = Date.now();

      setUsers(response);
    } catch (error) {
      console.error("Fehler beim Laden der User:", error);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !photoUploadInProgressRef.current) {
      // Prüfe ob bereits ein Foto geladen ist
      if (
        photoFile &&
        photoFile.name === file.name &&
        photoFile.size === file.size
      ) {
        toast({
          title: "Foto bereits hinzugefügt",
          description: "Dieses Foto wurde bereits ausgewählt.",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (
      !currentReport.plant ||
      !currentReport.title ||
      !currentReport.description
    ) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Verhindere Doppel-Uploads
    if (photoUploadInProgressRef.current) {
      toast({
        title: "Bitte warten",
        description: "Upload läuft bereits...",
        variant: "destructive",
      });
      return;
    }

    try {
      photoUploadInProgressRef.current = true;
      setIsUploadingPhoto(true);

      const formData = new FormData();
      formData.append("plant", currentReport.plant);
      formData.append("title", currentReport.title);
      formData.append("description", currentReport.description);
      formData.append("location", currentReport.location || "");
      formData.append("severity", currentReport.severity || "MEDIUM");

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      // Dynamische API URL - funktioniert auf Desktop und Mobile
      console.log("📡 Sende Failure Report");
      console.log("📷 Mit Foto:", !!photoFile);

      // Don't set Content-Type header - browser will set it automatically with boundary
      const newReport = (await apiClient.post(
        "/failure-reports",
        formData
      )) as FailureReport;

      console.log("✅ Report erstellt:", newReport);
      setReports([newReport, ...reports]);

      setIsDialogOpen(false);
      setCurrentReport({
        plant: "T208",
        title: "",
        description: "",
        location: "",
        severity: "MEDIUM",
      });
      setPhotoFile(null);
      setPhotoPreview(null);

      toast({
        title: "Erfolg",
        description: "Failure Report wurde erstellt.",
      });
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      toast({
        title: "Fehler beim Erstellen",
        description: `${errorMessage}. Bitte prüfen Sie Ihre Internetverbindung.`,
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      photoUploadInProgressRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;

    try {
      await apiClient.delete(`/failure-reports/${reportToDelete}`);
      setReports(reports.filter((r) => r.id !== reportToDelete));

      toast({
        title: "Erfolg",
        description: "Failure Report wurde gelöscht.",
      });
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      toast({
        title: "Fehler",
        description: "Failure Report konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleConvertToAction = async () => {
    if (!reportToConvert || !convertData.assignedTo) {
      toast({
        title: "Fehler",
        description: "Bitte wähle einen Benutzer aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        assignedTo: convertData.assignedTo,
        priority: convertData.priority,
        dueDate: convertData.dueDate
          ? convertData.dueDate.toISOString()
          : undefined,
      };

      const response = (await apiClient.post(
        `/failure-reports/${reportToConvert.id}/convert-to-action`,
        payload
      )) as { action: { id: string } };

      setReports(
        reports.map((r) =>
          r.id === reportToConvert.id
            ? {
                ...r,
                status: "CONVERTED_TO_ACTION" as const,
                convertedToActionId: response.action.id,
              }
            : r
        )
      );

      toast({
        title: "Erfolg",
        description: "Failure Report wurde in Action umgewandelt.",
      });

      setConvertDialogOpen(false);
      setReportToConvert(null);
      setConvertData({
        assignedTo: "",
        priority: "MEDIUM",
        dueDate: undefined,
      });
    } catch (error) {
      console.error("Fehler beim Konvertieren:", error);
      toast({
        title: "Fehler",
        description: "Konvertierung fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      LOW: "bg-blue-500",
      MEDIUM: "bg-yellow-500",
      HIGH: "bg-orange-500",
      CRITICAL: "bg-red-500",
    };
    return (
      <Badge
        className={colors[severity as keyof typeof colors] || "bg-gray-500"}
      >
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      REPORTED: "bg-blue-500",
      IN_REVIEW: "bg-yellow-500",
      CONVERTED_TO_ACTION: "bg-green-500",
      RESOLVED: "bg-gray-500",
    };
    const labels = {
      REPORTED: "Gemeldet",
      IN_REVIEW: "In Prüfung",
      CONVERTED_TO_ACTION: "→ Action",
      RESOLVED: "Gelöst",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-500"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const filteredReports = reports.filter((r) => r.plant === activeTab);

  // Mobile View: Simplified - only creation, no table
  if (isMobile) {
    return (
      <div className="mobile-failure-reporting p-3 space-y-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => onNavigateBack ? onNavigateBack() : window.history.back()}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6" />
              Schadensmeldung
            </CardTitle>
            <CardDescription>
              Schaden schnell mit Foto dokumentieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Plus className="h-6 w-6 mr-2" />
              Neuen Schaden melden
            </Button>
          </CardContent>
        </Card>

        {/* Show recent reports count */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {reports.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Meldungen insgesamt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog - same as desktop */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuer Failure Report</DialogTitle>
              <DialogDescription>
                Melde einen Schaden oder Defekt mit Foto-Dokumentation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Anlage *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {getAvailablePlants().map((plant) => (
                      <Button
                        key={plant}
                        type="button"
                        variant={
                          currentReport.plant === plant ? "default" : "outline"
                        }
                        className={cn(
                          "w-full",
                          currentReport.plant === plant &&
                            "bg-primary text-primary-foreground"
                        )}
                        onClick={() =>
                          setCurrentReport({
                            ...currentReport,
                            plant: plant as "T208" | "T207" | "T700" | "T46",
                          })
                        }
                      >
                        {plant}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schweregrad *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        currentReport.severity === "LOW" ? "default" : "outline"
                      }
                      className={cn(
                        currentReport.severity === "LOW" &&
                          "bg-green-500 hover:bg-green-600 text-white"
                      )}
                      onClick={() =>
                        setCurrentReport({
                          ...currentReport,
                          severity: "LOW",
                        })
                      }
                    >
                      Niedrig
                    </Button>
                    <Button
                      type="button"
                      variant={
                        currentReport.severity === "MEDIUM"
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        currentReport.severity === "MEDIUM" &&
                          "bg-yellow-500 hover:bg-yellow-600 text-white"
                      )}
                      onClick={() =>
                        setCurrentReport({
                          ...currentReport,
                          severity: "MEDIUM",
                        })
                      }
                    >
                      Mittel
                    </Button>
                    <Button
                      type="button"
                      variant={
                        currentReport.severity === "HIGH"
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        currentReport.severity === "HIGH" &&
                          "bg-orange-500 hover:bg-orange-600 text-white"
                      )}
                      onClick={() =>
                        setCurrentReport({
                          ...currentReport,
                          severity: "HIGH",
                        })
                      }
                    >
                      Hoch
                    </Button>
                    <Button
                      type="button"
                      variant={
                        currentReport.severity === "CRITICAL"
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        currentReport.severity === "CRITICAL" &&
                          "bg-red-500 hover:bg-red-600 text-white"
                      )}
                      onClick={() =>
                        setCurrentReport({
                          ...currentReport,
                          severity: "CRITICAL",
                        })
                      }
                    >
                      Kritisch
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={currentReport.title}
                  onChange={(e) =>
                    setCurrentReport({
                      ...currentReport,
                      title: e.target.value,
                    })
                  }
                  placeholder="Kurze Beschreibung des Problems"
                />
              </div>

              <div className="space-y-2">
                <Label>Standort</Label>
                <Select
                  value={currentReport.location}
                  onValueChange={(value) =>
                    setCurrentReport({
                      ...currentReport,
                      location: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Standort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActiveLocations().map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  value={currentReport.description}
                  onChange={(e) =>
                    setCurrentReport({
                      ...currentReport,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detaillierte Beschreibung des Schadens"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto hinzufügen</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute(
                          "capture",
                          "environment"
                        );
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Kamera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Galerie
                  </Button>
                </div>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="w-full mt-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Foto entfernen
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-md border"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploadingPhoto}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={isUploadingPhoto}>
                {isUploadingPhoto ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Lädt hoch...
                  </>
                ) : (
                  "Report erstellen"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop View: Full table
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Back Button for Desktop */}
      <Button variant="ghost" onClick={() => onNavigateBack ? onNavigateBack() : window.history.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                Failure Reporting
              </CardTitle>
              <CardDescription className="text-sm">
                Mobile Schadensmeldung mit Foto-Dokumentation
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-20 bg-muted/30 p-2 gap-2">
              {getAvailablePlants().map((plant) => {
                const plantReports = reports.filter((r) => r.plant === plant);
                const openCount = plantReports.filter(
                  (r) => r.status === "REPORTED" || r.status === "IN_REVIEW"
                ).length;
                const totalCount = plantReports.length;

                return (
                  <TabsTrigger
                    key={plant}
                    value={plant}
                    className="relative flex-col h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm hover:shadow-md py-2 px-3"
                  >
                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                      <span className="text-base font-bold leading-tight">
                        {plant}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {openCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] opacity-70 leading-tight">
                              Offen:
                            </span>
                            <Badge
                              variant="destructive"
                              className="px-1.5 py-0 text-[10px] font-bold leading-tight h-4"
                            >
                              {openCount}
                            </Badge>
                          </div>
                        )}
                        {openCount === 0 && totalCount > 0 && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 leading-tight h-4"
                          >
                            ✓ Alle bearbeitet
                          </Badge>
                        )}
                        {totalCount === 0 && (
                          <span className="text-[10px] opacity-60 leading-tight">
                            Keine Reports
                          </span>
                        )}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {getAvailablePlants().map((plant) => (
              <TabsContent key={plant} value={plant}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px] py-3 text-base">
                          Ticket-Nr.
                        </TableHead>
                        <TableHead className="py-3 text-base">Status</TableHead>
                        <TableHead className="py-3 text-base">Titel</TableHead>
                        <TableHead className="py-3 text-base">
                          Schwere
                        </TableHead>
                        <TableHead className="py-3 text-base">
                          Gemeldet von
                        </TableHead>
                        <TableHead className="py-3 text-base">Foto</TableHead>
                        <TableHead className="py-3 text-base">Datum</TableHead>
                        <TableHead className="text-right py-3 text-base">
                          Aktionen
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-6 text-base"
                          >
                            Keine Failure Reports für {plant}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="py-3">
                              <span className="font-mono font-medium text-sm">
                                {report.ticketNumber}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              {getStatusBadge(report.status)}
                            </TableCell>
                            <TableCell className="py-3">
                              <div>
                                <div className="font-medium text-base">
                                  {report.title}
                                </div>
                                {report.location && (
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {report.location}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              {getSeverityBadge(report.severity)}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-base">
                                <div>{report.reportedByName}</div>
                                <div className="text-muted-foreground text-sm">
                                  {report.reportedBy}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {report.photoFilename ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    // If photoPath is a full URL (Cloudinary), use it directly
                                    if (
                                      report.photoPath &&
                                      (report.photoPath.startsWith("http://") ||
                                        report.photoPath.startsWith("https://"))
                                    ) {
                                      console.log(
                                        "📷 Using Cloudinary URL:",
                                        report.photoPath
                                      );
                                      setSelectedPhoto(report.photoPath);
                                      setPhotoViewDialogOpen(true);
                                      return;
                                    }

                                    // Otherwise, try to load via API (old local files)
                                    try {
                                      console.log(
                                        "📷 Loading photo via API:",
                                        report.photoFilename
                                      );
                                      // Use API client with blob response type
                                      const blob =
                                        await apiClient.request<Blob>(
                                          `/failure-reports/photo/${report.photoFilename}`,
                                          { responseType: "blob" }
                                        );

                                      // Create blob URL for image display
                                      const photoUrl =
                                        URL.createObjectURL(blob);

                                      console.log(
                                        "✅ Photo loaded successfully via API"
                                      );
                                      setSelectedPhoto(photoUrl);
                                      setPhotoViewDialogOpen(true);

                                      // Clean up blob URL after use
                                      setTimeout(
                                        () => URL.revokeObjectURL(photoUrl),
                                        10000
                                      );
                                    } catch (error) {
                                      console.error(
                                        "❌ Error loading photo via API:",
                                        error
                                      );
                                      // Fallback to direct URL
                                      const getApiUrl = () => {
                                        if (import.meta.env.VITE_API_BASE_URL) {
                                          return import.meta.env.VITE_API_BASE_URL.replace(
                                            "/api",
                                            ""
                                          );
                                        }
                                        return window.location.hostname ===
                                          "localhost"
                                          ? "http://localhost:5137"
                                          : "https://cmms-erp-backend.onrender.com";
                                      };
                                      setSelectedPhoto(
                                        `${getApiUrl()}/failure-reports/photo/${
                                          report.photoFilename
                                        }`
                                      );
                                      setPhotoViewDialogOpen(true);
                                    }
                                  }}
                                >
                                  📸 Foto ansehen
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Kein Foto
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(report.createdAt).toLocaleDateString(
                                  "de-DE"
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {report.status !== "CONVERTED_TO_ACTION" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReportToConvert(report);
                                      setConvertDialogOpen(true);
                                    }}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Zu Action
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setReportToDelete(report.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Failure Report</DialogTitle>
            <DialogDescription>
              Melde einen Schaden oder Defekt mit Foto-Dokumentation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Anlage *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {getAvailablePlants().map((plant) => (
                    <Button
                      key={plant}
                      type="button"
                      variant={
                        currentReport.plant === plant ? "default" : "outline"
                      }
                      className={cn(
                        "w-full",
                        currentReport.plant === plant &&
                          "bg-primary text-primary-foreground"
                      )}
                      onClick={() =>
                        setCurrentReport({
                          ...currentReport,
                          plant: plant as "T208" | "T207" | "T700" | "T46",
                        })
                      }
                    >
                      {plant}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schweregrad *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      currentReport.severity === "LOW" ? "default" : "outline"
                    }
                    className={cn(
                      currentReport.severity === "LOW" &&
                        "bg-green-500 hover:bg-green-600 text-white"
                    )}
                    onClick={() =>
                      setCurrentReport({
                        ...currentReport,
                        severity: "LOW",
                      })
                    }
                  >
                    Niedrig
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentReport.severity === "MEDIUM"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      currentReport.severity === "MEDIUM" &&
                        "bg-yellow-500 hover:bg-yellow-600 text-white"
                    )}
                    onClick={() =>
                      setCurrentReport({
                        ...currentReport,
                        severity: "MEDIUM",
                      })
                    }
                  >
                    Mittel
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentReport.severity === "HIGH" ? "default" : "outline"
                    }
                    className={cn(
                      currentReport.severity === "HIGH" &&
                        "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                    onClick={() =>
                      setCurrentReport({
                        ...currentReport,
                        severity: "HIGH",
                      })
                    }
                  >
                    Hoch
                  </Button>
                  <Button
                    type="button"
                    variant={
                      currentReport.severity === "CRITICAL"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      currentReport.severity === "CRITICAL" &&
                        "bg-red-500 hover:bg-red-600 text-white"
                    )}
                    onClick={() =>
                      setCurrentReport({
                        ...currentReport,
                        severity: "CRITICAL",
                      })
                    }
                  >
                    Kritisch
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={currentReport.title}
                onChange={(e) =>
                  setCurrentReport({ ...currentReport, title: e.target.value })
                }
                placeholder="Kurze Beschreibung des Problems"
              />
            </div>

            <div className="space-y-2">
              <Label>Standort</Label>
              <Select
                value={currentReport.location}
                onValueChange={(value) =>
                  setCurrentReport({
                    ...currentReport,
                    location: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standort auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {getActiveLocations().map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={currentReport.description}
                onChange={(e) =>
                  setCurrentReport({
                    ...currentReport,
                    description: e.target.value,
                  })
                }
                placeholder="Detaillierte Beschreibung des Schadens"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Foto aufnehmen</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {photoPreview ? "Foto ändern" : "Foto aufnehmen"}
                </Button>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-full h-auto rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploadingPhoto}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isUploadingPhoto}>
              {isUploadingPhoto ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Lädt hoch...
                </>
              ) : (
                "Report erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Action Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>In Action umwandeln</DialogTitle>
            <DialogDescription>
              Wandle diesen Failure Report in eine Action im Action Tracker um
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportToConvert && (
              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="text-xs font-mono text-muted-foreground">
                  Ticket: {reportToConvert.ticketNumber}
                </div>
                <div className="font-medium">{reportToConvert.title}</div>
                <div className="text-sm text-muted-foreground">
                  {reportToConvert.description}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Zugewiesen an *</Label>
              <Select
                value={convertData.assignedTo}
                onValueChange={(value) =>
                  setConvertData({ ...convertData, assignedTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="User auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => {
                      if (!user.assignedPlant) return true;
                      return user.assignedPlant === reportToConvert?.plant;
                    })
                    .map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.firstName} {user.lastName}
                        {user.assignedPlant && ` (${user.assignedPlant})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={convertData.priority}
                onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                  setConvertData({ ...convertData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorität wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Niedrig</SelectItem>
                  <SelectItem value="MEDIUM">Mittel</SelectItem>
                  <SelectItem value="HIGH">Hoch</SelectItem>
                  <SelectItem value="URGENT">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <DatePicker
                date={convertData.dueDate}
                onSelect={(date: Date | undefined) =>
                  setConvertData({ ...convertData, dueDate: date })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleConvertToAction}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Zu Action umwandeln
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Failure Report wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo View Dialog */}
      <Dialog open={photoViewDialogOpen} onOpenChange={setPhotoViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Foto ansehen</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Failure Report Foto"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={() => {
                  console.error("Fehler beim Laden des Fotos:", selectedPhoto);
                  toast({
                    title: "Fehler",
                    description: "Foto konnte nicht geladen werden.",
                    variant: "destructive",
                  });
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhotoViewDialogOpen(false);
                setSelectedPhoto(null);
              }}
            >
              Schließen
            </Button>
            {selectedPhoto && (
              <Button
                onClick={() => {
                  window.open(selectedPhoto, "_blank");
                }}
              >
                In neuem Tab öffnen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FailureReportingPage;
