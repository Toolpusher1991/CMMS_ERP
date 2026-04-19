import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRigs } from "@/hooks/useRigs";
import { isMobileDevice } from "@/lib/device-detection";
import { getActiveLocations } from "@/config/locations";
import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG, FAILURE_STATUS_CONFIG } from "@/lib/constants";
import { useUserList } from "@/hooks/useQueryHooks";
import "./FailureReporting.mobile.css";
import { Card, CardContent } from "@/components/ui/card";
// Tabs removed - using custom dropdown selector instead
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
  Building2,
  Check,
  ChevronsUpDown,
  Search,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FailureReport {
  id: string;
  ticketNumber: string; // Format: T208-202510-001
  plant: string;
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

const FailureReportingPage = ({
  initialReportId,
  onNavigateBack,
}: FailureReportingProps) => {
  const { toast } = useToast();
  const isMobile = isMobileDevice();
  const [activeTab, setActiveTab] = useState<string>("");
  const [plantSelectorOpen, setPlantSelectorOpen] = useState(false);
  const [plantSearchTerm, setPlantSearchTerm] = useState("");
  const plantDropdownRef = useRef<HTMLDivElement>(null);

  // Close plant dropdown on click outside
  useEffect(() => {
    if (!plantSelectorOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        plantDropdownRef.current &&
        !plantDropdownRef.current.contains(e.target as globalThis.Node)
      ) {
        setPlantSelectorOpen(false);
        setPlantSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [plantSelectorOpen]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [reportToConvert, setReportToConvert] = useState<FailureReport | null>(
    null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoViewDialogOpen, setPhotoViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoUploadInProgressRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  const queryClient = useQueryClient();

  // React Query: shared user list
  const { data: userListData } = useUserList();
  const users = userListData ?? [];

  // React Query: failure reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: queryKeys.failureReports.list(),
    queryFn: () => apiClient.request<FailureReport[]>("/failure-reports"),
  });
  const reports = useMemo(() => reportsData ?? [], [reportsData]);

  const getPlantStats = useCallback(
    (plant: string) => {
      const plantReports = reports.filter(
        (r: FailureReport) => r.plant === plant,
      );
      const openCount = plantReports.filter(
        (r: FailureReport) =>
          r.status === "REPORTED" || r.status === "IN_REVIEW",
      ).length;
      return { total: plantReports.length, open: openCount };
    },
    [reports],
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get available plants based on current user
  const getAvailablePlants = () => {
    const currentUser = useAuthStore.getState().user;
    const allPlants = availableRigs.map((rig) => rig.name);

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
    plant: "",
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

  const { rigs: availableRigs } = useRigs();

  // Set initial active tab when rigs load
  useEffect(() => {
    if (!activeTab && availableRigs.length > 0) {
      const availablePlants = getAvailablePlants();
      if (availablePlants.length > 0) {
        setActiveTab(availablePlants[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRigs]);

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

  // Set plant field to active tab when it changes (for new reports)
  useEffect(() => {
    if (activeTab && !currentReport.plant) {
      setCurrentReport((prev) => ({ ...prev, plant: activeTab }));
    }
  }, [activeTab, currentReport.plant]);

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

      // Don't set Content-Type header - browser will set it automatically with boundary
      const newReport = (await apiClient.post(
        "/failure-reports",
        formData,
      )) as FailureReport;

      queryClient.setQueryData<FailureReport[]>(
        queryKeys.failureReports.list(),
        (prev) => [newReport, ...(prev ?? [])],
      );
      // Also invalidate actions since failure reports are shown on Dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.failureReports.all });

      setIsDialogOpen(false);
      setCurrentReport({
        plant: activeTab,
        title: "",
        description: "",
        location: "",
        severity: "MEDIUM",
      });
      setPhotoFile(null);
      setPhotoPreview(null);

      toast({
        variant: "success" as const,
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
      queryClient.setQueryData<FailureReport[]>(
        queryKeys.failureReports.list(),
        (prev) => (prev ?? []).filter((r) => r.id !== reportToDelete),
      );

      toast({
        variant: "success" as const,
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
        payload,
      )) as { action: { id: string } };

      queryClient.setQueryData<FailureReport[]>(
        queryKeys.failureReports.list(),
        (prev) =>
          (prev ?? []).map((r) =>
            r.id === reportToConvert.id
              ? {
                  ...r,
                  status: "CONVERTED_TO_ACTION" as const,
                  convertedToActionId: response.action.id,
                }
              : r,
          ),
      );
      // Invalidate actions cache since a new action was created
      queryClient.invalidateQueries({ queryKey: queryKeys.actions.all });

      toast({
        variant: "success" as const,
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
    const key = severity.toUpperCase();
    const config = (
      SEVERITY_CONFIG as Record<string, { dotColor: string; label: string }>
    )[key];
    return (
      <Badge className={config?.dotColor ?? "bg-gray-500"}>
        {config?.label ?? severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const key = status.toUpperCase();
    const config = (
      FAILURE_STATUS_CONFIG as Record<
        string,
        { dotColor: string; label: string }
      >
    )[key];
    return (
      <Badge className={config?.dotColor ?? "bg-gray-500"}>
        {config?.label ?? status}
      </Badge>
    );
  };

  const filteredReports = reports.filter((r) => r.plant === activeTab);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  // Mobile View: Simplified - only creation, no table
  if (isMobile) {
    return (
      <div className="mobile-failure-reporting -m-3">
        {/* H&P Navy Header */}
        <div className="bg-gradient-to-r from-[#143269] to-[#2B5597] px-6 py-6">
          <button
            onClick={() =>
              onNavigateBack ? onNavigateBack() : window.history.back()
            }
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Schadensmeldung
                </h1>
                <p className="text-sm text-white/60">
                  Schaden schnell mit Foto dokumentieren
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 bg-[#24C26B] hover:bg-[#1da55a] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#24C26B]/20"
            >
              <Plus className="h-4 w-4" />
              Neuen Schaden melden
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
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
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(availableRigs.length, 4)}, minmax(0, 1fr))`,
                      }}
                    >
                      {getAvailablePlants().map((plant) => (
                        <Button
                          key={plant}
                          type="button"
                          variant={
                            currentReport.plant === plant
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "w-full",
                            currentReport.plant === plant &&
                              "bg-primary text-primary-foreground",
                          )}
                          onClick={() =>
                            setCurrentReport({
                              ...currentReport,
                              plant: plant,
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
                          currentReport.severity === "LOW"
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          currentReport.severity === "LOW" &&
                            "bg-green-500 hover:bg-green-600 text-white",
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
                            "bg-yellow-500 hover:bg-yellow-600 text-white",
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
                            "bg-orange-500 hover:bg-orange-600 text-white",
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
                            "bg-red-500 hover:bg-red-600 text-white",
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
                            "environment",
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
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
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
      </div>
    );
  }

  // Desktop View: Full table
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* H&P Navy Header */}
      <div className="bg-gradient-to-r from-[#143269] to-[#2B5597] px-6 py-6">
        <button
          onClick={() =>
            onNavigateBack ? onNavigateBack() : window.history.back()
          }
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Störungsmeldung
              </h1>
              <p className="text-sm text-white/60">
                Mobile Schadensmeldung mit Foto-Dokumentation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-[#24C26B] hover:bg-[#1da55a] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#24C26B]/20"
          >
            <Plus className="h-4 w-4" />
            Neuer Report
          </button>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            {/* Plant Selector - Custom Dropdown */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-full sm:w-80" ref={plantDropdownRef}>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={plantSelectorOpen}
                  onClick={() => setPlantSelectorOpen(!plantSelectorOpen)}
                  className="w-full h-12 justify-between bg-muted/30 hover:bg-muted/50 border-border/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-primary" />
                    {activeTab ? (
                      <>
                        <span className="font-semibold truncate">
                          {activeTab}
                        </span>
                        {(() => {
                          const stats = getPlantStats(activeTab);
                          if (stats.open > 0)
                            return (
                              <Badge
                                variant="destructive"
                                className="px-1.5 py-0 text-xs font-bold h-5 shrink-0"
                              >
                                {stats.open} Offen
                              </Badge>
                            );
                          if (stats.total > 0)
                            return (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-xs bg-green-500/10 text-green-600 border-green-500/20 h-5 shrink-0"
                              >
                                ✓ Alle bearbeitet
                              </Badge>
                            );
                          return (
                            <span className="text-xs text-muted-foreground shrink-0">
                              Keine Reports
                            </span>
                          );
                        })()}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Anlage auswählen...
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {plantSelectorOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full sm:w-96 z-50 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="flex flex-col">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Anlage suchen..."
                          value={plantSearchTerm}
                          onChange={(e) => setPlantSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-80 overflow-y-auto p-1">
                        {(() => {
                          const plants = getAvailablePlants().filter((p) =>
                            p
                              .toLowerCase()
                              .includes(plantSearchTerm.toLowerCase()),
                          );
                          const withOpen = plants.filter(
                            (p) => getPlantStats(p).open > 0,
                          );
                          const withDone = plants.filter((p) => {
                            const s = getPlantStats(p);
                            return s.open === 0 && s.total > 0;
                          });
                          const empty = plants.filter(
                            (p) => getPlantStats(p).total === 0,
                          );

                          if (plants.length === 0) {
                            return (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Keine Anlage gefunden.
                              </div>
                            );
                          }

                          return (
                            <>
                              {withOpen.length > 0 && (
                                <div>
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Offene Reports
                                  </div>
                                  {withOpen.map((plant) => {
                                    const stats = getPlantStats(plant);
                                    return (
                                      <div
                                        key={plant}
                                        onClick={() => {
                                          setActiveTab(plant);
                                          setPlantSelectorOpen(false);
                                          setPlantSearchTerm("");
                                        }}
                                        className={cn(
                                          "flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-sm text-sm hover:bg-accent hover:text-accent-foreground",
                                          activeTab === plant && "bg-accent",
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                                            activeTab === plant
                                              ? "bg-primary border-primary text-primary-foreground"
                                              : "border-muted-foreground/30",
                                          )}
                                        >
                                          {activeTab === plant && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </div>
                                        <div className="flex flex-1 items-center justify-between min-w-0">
                                          <span className="font-semibold">
                                            {plant}
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Activity className="h-3 w-3 text-red-500" />
                                            <span className="text-xs font-medium text-red-500">
                                              {stats.open}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                              {stats.total} gesamt
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {withDone.length > 0 && (
                                <div>
                                  {withOpen.length > 0 && (
                                    <div className="-mx-1 my-1 h-px bg-border" />
                                  )}
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Alle bearbeitet
                                  </div>
                                  {withDone.map((plant) => {
                                    const stats = getPlantStats(plant);
                                    return (
                                      <div
                                        key={plant}
                                        onClick={() => {
                                          setActiveTab(plant);
                                          setPlantSelectorOpen(false);
                                          setPlantSearchTerm("");
                                        }}
                                        className={cn(
                                          "flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm text-sm hover:bg-accent hover:text-accent-foreground",
                                          activeTab === plant && "bg-accent",
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                                            activeTab === plant
                                              ? "bg-primary border-primary text-primary-foreground"
                                              : "border-muted-foreground/30",
                                          )}
                                        >
                                          {activeTab === plant && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </div>
                                        <div className="flex flex-1 items-center justify-between min-w-0">
                                          <span className="font-medium text-muted-foreground">
                                            {plant}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                            <span className="text-xs text-green-600">
                                              {stats.total} erledigt
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {empty.length > 0 && (
                                <div>
                                  {(withOpen.length > 0 ||
                                    withDone.length > 0) && (
                                    <div className="-mx-1 my-1 h-px bg-border" />
                                  )}
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Ohne Reports
                                  </div>
                                  {empty.map((plant) => (
                                    <div
                                      key={plant}
                                      onClick={() => {
                                        setActiveTab(plant);
                                        setPlantSelectorOpen(false);
                                        setPlantSearchTerm("");
                                      }}
                                      className={cn(
                                        "flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm text-sm opacity-60 hover:opacity-100 hover:bg-accent hover:text-accent-foreground",
                                        activeTab === plant &&
                                          "bg-accent opacity-100",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                                          activeTab === plant
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/20",
                                        )}
                                      >
                                        {activeTab === plant && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {plant}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {getAvailablePlants().length} Anlagen
              </span>
            </div>

            {/* Reports Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px] py-3 text-base">
                      Ticket-Nr.
                    </TableHead>
                    <TableHead className="py-3 text-base">Status</TableHead>
                    <TableHead className="py-3 text-base">Titel</TableHead>
                    <TableHead className="py-3 text-base">Schwere</TableHead>
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
                        Keine Failure Reports für {activeTab}
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
                                  setSelectedPhoto(report.photoPath);
                                  setPhotoViewDialogOpen(true);
                                  return;
                                }

                                // Otherwise, try to load via API (old local files)
                                try {
                                  // Use API client with blob response type
                                  const blob = await apiClient.request<Blob>(
                                    `/failure-reports/photo/${report.photoFilename}`,
                                    { responseType: "blob" },
                                  );

                                  // Create blob URL for image display
                                  const photoUrl = URL.createObjectURL(blob);

                                  setSelectedPhoto(photoUrl);
                                  setPhotoViewDialogOpen(true);

                                  // Clean up blob URL after use
                                  setTimeout(
                                    () => URL.revokeObjectURL(photoUrl),
                                    10000,
                                  );
                                } catch (error) {
                                  console.error(
                                    "❌ Error loading photo via API:",
                                    error,
                                  );
                                  // Fallback to direct URL
                                  const getApiUrl = () => {
                                    if (import.meta.env.VITE_API_BASE_URL) {
                                      return import.meta.env.VITE_API_BASE_URL.replace(
                                        "/api",
                                        "",
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
                                    }`,
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
                              "de-DE",
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
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(availableRigs.length, 4)}, minmax(0, 1fr))`,
                    }}
                  >
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
                            "bg-primary text-primary-foreground",
                        )}
                        onClick={() =>
                          setCurrentReport({
                            ...currentReport,
                            plant: plant,
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
                          "bg-green-500 hover:bg-green-600 text-white",
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
                          "bg-yellow-500 hover:bg-yellow-600 text-white",
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
                          "bg-orange-500 hover:bg-orange-600 text-white",
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
                          "bg-red-500 hover:bg-red-600 text-white",
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
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
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
                  onValueChange={(
                    value: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                  ) => setConvertData({ ...convertData, priority: value })}
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
        <Dialog
          open={photoViewDialogOpen}
          onOpenChange={setPhotoViewDialogOpen}
        >
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
                    console.error(
                      "Fehler beim Laden des Fotos:",
                      selectedPhoto,
                    );
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
    </div>
  );
};

export default FailureReportingPage;
