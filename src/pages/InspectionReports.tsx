import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRigs } from "@/hooks/useRigs";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  X,
  Camera,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

interface InspectionItem {
  id: string;
  itemNumber: string;
  description: string;
  itemType: "CHECKBOX" | "MEASUREMENT" | "TEXT" | "RATING";
  isChecked?: boolean;
  measurementValue?: string;
  measurementUnit?: string;
  textValue?: string;
  rating?: number;
  result?: "OK" | "NOT_OK" | "N/A";
  notes?: string;
  minValue?: string;
  maxValue?: string;
  referenceValue?: string;
}

interface InspectionSection {
  id: string;
  sectionNumber: number;
  title: string;
  description?: string;
  items: InspectionItem[];
}

interface InspectionAttachment {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string;
  uploadedAt: string;
}

interface InspectionReport {
  id: string;
  reportNumber: string;
  title: string;
  type: string;
  plant: string;
  equipment: string;
  inspectionDate: string;
  inspector: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  overallResult?: "PASSED" | "FAILED" | "CONDITIONAL";
  generalNotes?: string;
  recommendations?: string;
  sections?: InspectionSection[];
  attachments?: InspectionAttachment[];
  createdAt: string;
  updatedAt: string;
}

const InspectionReports = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query: inspection reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: queryKeys.inspections.list(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: InspectionReport[];
      }>("/inspection-reports");
      return response.success ? response.data : [];
    },
  });
  const reports = reportsData ?? [];

  const refreshReports = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inspections.all });
  };

  const { rigs: availableRigs } = useRigs();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPDFUploadDialogOpen, setIsPDFUploadDialogOpen] = useState(false);
  const [isActionConfirmOpen, setIsActionConfirmOpen] = useState(false);
  const [pendingNotOkUpdate, setPendingNotOkUpdate] = useState<{
    itemId: string;
    updates: Partial<InspectionItem>;
    itemDescription: string;
    sectionTitle: string;
  } | null>(null);
  const [notOkPhotos, setNotOkPhotos] = useState<File[]>([]);
  const [actionDiscipline, setActionDiscipline] = useState<
    "MECHANIK" | "ELEKTRIK" | "ANLAGE"
  >("MECHANIK");
  const [actionPriority, setActionPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("HIGH");
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(
    null,
  );
  const [pdfFile, setPDFFile] = useState<File | null>(null);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);

  // Filters
  const [filterPlant, setFilterPlant] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // New Report Form
  const [newReport, setNewReport] = useState({
    title: "",
    type: "",
    plant: "",
    equipment: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    inspector: "",
  });

  const user = useAuthStore((s) => s.user);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (filterPlant !== "all") {
      filtered = filtered.filter((r) => r.plant === filterPlant);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.reportNumber.toLowerCase().includes(term) ||
          r.title.toLowerCase().includes(term) ||
          r.equipment.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [reports, filterPlant, filterType, filterStatus, searchTerm]);

  const handleCreateReport = async () => {
    if (
      !newReport.title ||
      !newReport.type ||
      !newReport.plant ||
      !newReport.equipment
    ) {
      toast({
        title: "Fehler",
        description: "Bitte alle Pflichtfelder ausfüllen.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get template based on type
      const template = getTemplateForType(newReport.type);

      const response = await apiClient.post<{
        success: boolean;
        data: InspectionReport;
      }>("/inspection-reports", {
        ...newReport,
        sections: template.sections,
      });

      if (response.success && response.data) {
        refreshReports();
        setIsCreateDialogOpen(false);
        setNewReport({
          title: "",
          type: "",
          plant: "",
          equipment: "",
          inspectionDate: new Date().toISOString().split("T")[0],
          inspector: "",
        });

        toast({
          variant: "success" as const,
          title: "Erfolgreich",
          description: "Inspektionsbericht wurde erstellt.",
        });

        // Open the new report for editing
        setSelectedReport(response.data);
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        title: "Fehler",
        description: "Inspektionsbericht konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<InspectionItem>,
  ) => {
    try {
      // Check if result changed to NOT_OK - show confirmation dialog
      if (updates.result === "NOT_OK" && selectedReport) {
        // Find the item to prepare action data
        let itemDescription = "";
        let sectionTitle = "";

        for (const section of selectedReport.sections || []) {
          const item = section.items.find((i) => i.id === itemId);
          if (item) {
            itemDescription = item.description;
            sectionTitle = section.title;
            break;
          }
        }

        // Store pending update and open confirmation dialog
        setPendingNotOkUpdate({
          itemId,
          updates,
          itemDescription,
          sectionTitle,
        });
        setIsActionConfirmOpen(true);
        return; // Don't update yet, wait for user confirmation
      }

      // Normal update without action creation
      await performItemUpdate(itemId, updates, false);
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Fehler",
        description: "Element konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const performItemUpdate = async (
    itemId: string,
    updates: Partial<InspectionItem>,
    createAction: boolean,
  ) => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: InspectionItem;
      }>(`/inspection-reports/items/${itemId}`, updates);

      if (response.success && selectedReport) {
        // Create action if requested
        if (createAction) {
          const pendingData = pendingNotOkUpdate;
          if (pendingData) {
            try {
              const actionResponse = await apiClient.post<{
                id: string;
                title: string;
                description: string;
              }>("/actions", {
                title: `Inspektionsfehler: ${pendingData.itemDescription}`,
                description: `Bei der Inspektion "${selectedReport.title}" wurde ein Problem festgestellt:\n\nSektion: ${pendingData.sectionTitle}\nItem: ${pendingData.itemDescription}\n\nBericht: ${selectedReport.reportNumber}`,
                priority: actionPriority,
                discipline: actionDiscipline,
                status: "OPEN",
                plant: selectedReport.plant,
                equipment: selectedReport.equipment,
                dueDate: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              });

              // Upload photos to the created action
              if (notOkPhotos.length > 0 && actionResponse.id) {
                try {
                  const formData = new FormData();
                  notOkPhotos.forEach((photo) => {
                    formData.append("files", photo);
                  });

                  // Don't set Content-Type header - browser will set it with boundary
                  await apiClient.post(
                    `/actions/${actionResponse.id}/files`,
                    formData,
                  );

                  toast({
                    variant: "success" as const,
                    title: "Action mit Fotos erstellt",
                    description: `Aufgabe erstellt und ${notOkPhotos.length} Foto(s) angehängt.`,
                  });
                } catch (photoError) {
                  console.error(
                    "Error uploading photos to action:",
                    photoError,
                  );
                  toast({
                    title: "Warnung",
                    description:
                      "Action erstellt, aber Fotos konnten nicht hochgeladen werden.",
                    variant: "destructive",
                  });
                }
              } else {
                toast({
                  variant: "success" as const,
                  title: "Action erstellt",
                  description: "Eine neue Aufgabe wurde automatisch erstellt.",
                });
              }

              // Add note to item that action was created
              await apiClient.put(`/inspection-reports/items/${itemId}`, {
                notes: `Action erstellt (${new Date().toLocaleDateString(
                  "de-DE",
                )})`,
              });
            } catch (actionError) {
              console.error("Error creating action:", actionError);
              toast({
                title: "Warnung",
                description:
                  "Item wurde aktualisiert, aber Action konnte nicht erstellt werden.",
                variant: "destructive",
              });
            }
          }
        } else {
          // If not creating action but have photos, upload to inspection report
          if (notOkPhotos.length > 0) {
            try {
              const formData = new FormData();
              notOkPhotos.forEach((photo) => {
                formData.append("files", photo);
              });

              // Don't set Content-Type header - browser will set it with boundary
              await apiClient.post(
                `/inspection-reports/${selectedReport.id}/attachments`,
                formData,
              );

              toast({
                variant: "success" as const,
                title: "Fotos hochgeladen",
                description: `${notOkPhotos.length} Foto(s) zum Bericht hinzugefügt.`,
              });
            } catch (photoError) {
              console.error("Error uploading photos:", photoError);
              toast({
                title: "Warnung",
                description: "Fotos konnten nicht hochgeladen werden.",
                variant: "destructive",
              });
            }
          }
        }

        // Reset photos state
        setNotOkPhotos([]);

        // Update local state
        const updatedReport = {
          ...selectedReport,
          sections: (selectedReport.sections || []).map((section) => ({
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item,
            ),
          })),
        };
        setSelectedReport(updatedReport);

        // Update reports list
        refreshReports();
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Fehler",
        description: "Element konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateReport = async (updates: Partial<InspectionReport>) => {
    if (!selectedReport) return;

    try {
      const response = await apiClient.put<{
        success: boolean;
        data: InspectionReport;
      }>(`/inspection-reports/${selectedReport.id}`, updates);

      if (response.success && response.data) {
        // Preserve existing sections and attachments if not returned
        const updatedReport = {
          ...response.data,
          sections: response.data.sections || selectedReport.sections || [],
          attachments:
            response.data.attachments || selectedReport.attachments || [],
        };

        setSelectedReport(updatedReport);
        refreshReports();

        toast({
          variant: "success" as const,
          title: "Erfolgreich",
          description: "Inspektionsbericht wurde aktualisiert.",
        });
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Fehler",
        description: "Inspektionsbericht konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Möchten Sie diesen Inspektionsbericht wirklich löschen?"))
      return;

    try {
      await apiClient.delete(`/inspection-reports/${reportId}`);
      refreshReports();

      toast({
        variant: "success" as const,
        title: "Erfolgreich",
        description: "Inspektionsbericht wurde gelöscht.",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Fehler",
        description: "Inspektionsbericht konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "secondary" | "default" | "destructive";
        icon: React.ReactNode;
      }
    > = {
      DRAFT: { variant: "secondary", icon: <Edit className="w-3 h-3 mr-1" /> },
      SUBMITTED: {
        variant: "default",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      APPROVED: {
        variant: "default",
        icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
      },
      REJECTED: {
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const config = variants[status] || variants.DRAFT;

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status === "DRAFT" && "Entwurf"}
        {status === "SUBMITTED" && "Eingereicht"}
        {status === "APPROVED" && "Genehmigt"}
        {status === "REJECTED" && "Abgelehnt"}
      </Badge>
    );
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;

    const variants: Record<
      string,
      { variant: "secondary" | "default" | "destructive"; text: string }
    > = {
      PASSED: { variant: "default", text: "Bestanden" },
      FAILED: { variant: "destructive", text: "Nicht bestanden" },
      CONDITIONAL: { variant: "secondary", text: "Bedingt" },
    };

    const config = variants[result];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  // PDF Export Function
  const generateReportPDF = (report: InspectionReport) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Inspektionsbericht", 105, 20, { align: "center" });

    // Report Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 35;

    doc.text(`Berichtnummer: ${report.reportNumber}`, 20, yPos);
    yPos += 7;
    doc.text(`Titel: ${report.title}`, 20, yPos);
    yPos += 7;
    doc.text(`Typ: ${report.type}`, 20, yPos);
    yPos += 7;
    doc.text(`Anlage: ${report.plant}`, 20, yPos);
    yPos += 7;
    doc.text(`Equipment: ${report.equipment}`, 20, yPos);
    yPos += 7;
    doc.text(
      `Inspektionsdatum: ${new Date(report.inspectionDate).toLocaleDateString(
        "de-DE",
      )}`,
      20,
      yPos,
    );
    yPos += 7;
    doc.text(`Inspektor: ${report.inspector}`, 20, yPos);
    yPos += 7;
    doc.text(`Status: ${report.status}`, 20, yPos);
    yPos += 10;

    // Sections and Items
    if (report.sections && report.sections.length > 0) {
      report.sections.forEach((section) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Section Header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${section.sectionNumber}. ${section.title}`, 20, yPos);
        yPos += 7;

        if (section.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(section.description, 20, yPos);
          yPos += 5;
        }

        // Items Table
        const tableData = section.items.map((item) => {
          const resultText =
            item.result === "OK"
              ? "OK"
              : item.result === "NOT_OK"
                ? "NOT_OK"
                : "-";

          // Add action comment if result is NOT_OK
          const description =
            item.result === "NOT_OK" && item.notes?.includes("Action erstellt")
              ? `${item.description} [Action erstellt]`
              : item.description;

          return [item.itemNumber, description, resultText];
        });

        autoTable(doc, {
          startY: yPos,
          head: [["Nr.", "Beschreibung", "Ergebnis"]],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 66, 66] },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 140 },
            2: { cellWidth: 25 },
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            yPos = data.cursor?.y || yPos;
          },
        });

        yPos += 10;
      });
    }

    // General Notes
    if (report.generalNotes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Allgemeine Notizen", 20, yPos);
      yPos += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(report.generalNotes, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5 + 10;
    }

    // Recommendations
    if (report.recommendations) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Empfehlungen", 20, yPos);
      yPos += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const splitRecs = doc.splitTextToSize(report.recommendations, 170);
      doc.text(splitRecs, 20, yPos);
    }

    // Save PDF
    doc.save(`${report.reportNumber}.pdf`);

    toast({
      variant: "success" as const,
      title: "Erfolgreich",
      description: "PDF wurde heruntergeladen.",
    });
  };

  // File Upload Function
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!selectedReport || !event.target.files) return;

    const files = Array.from(event.target.files);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: InspectionAttachment[];
      }>(`/inspection-reports/${selectedReport.id}/attachments`, formData);

      if (response.success && response.data) {
        const updatedReport = {
          ...selectedReport,
          attachments: [
            ...(selectedReport.attachments || []),
            ...response.data,
          ],
        };
        setSelectedReport(updatedReport);
        refreshReports();

        toast({
          variant: "success" as const,
          title: "Erfolgreich",
          description: `${files.length} Datei(en) hochgeladen.`,
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht hochgeladen werden.",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = "";
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedReport) return;

    try {
      await apiClient.delete(
        `/inspection-reports/${selectedReport.id}/attachments/${attachmentId}`,
      );

      const updatedReport = {
        ...selectedReport,
        attachments: (selectedReport.attachments || []).filter(
          (a) => a.id !== attachmentId,
        ),
      };
      setSelectedReport(updatedReport);
      refreshReports();

      toast({
        variant: "success" as const,
        title: "Erfolgreich",
        description: "Anhang wurde gelöscht.",
      });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Fehler",
        description: "Anhang konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Handle PDF upload and parsing
  const handlePDFUpload = async () => {
    if (!pdfFile) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine PDF-Datei aus.",
        variant: "destructive",
      });
      return;
    }

    if (!newReport.plant || !newReport.equipment) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie Anlage und Equipment aus.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPDF(true);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("plant", newReport.plant);
      formData.append("equipment", newReport.equipment);
      formData.append(
        "inspector",
        newReport.inspector || user?.firstName + " " + user?.lastName || "",
      );
      formData.append("inspectionDate", newReport.inspectionDate);

      const response = await apiClient.post<{
        success: boolean;
        data: InspectionReport;
      }>("/inspection-reports/parse-pdf", formData);

      if (response.success && response.data) {
        refreshReports();
        setIsPDFUploadDialogOpen(false);
        setPDFFile(null);
        setNewReport({
          title: "",
          type: "",
          plant: "",
          equipment: "",
          inspectionDate: new Date().toISOString().split("T")[0],
          inspector: "",
        });

        toast({
          title: "Erfolgreich",
          description: "PDF wurde analysiert und Bericht erstellt.",
        });

        // Open the new report for editing
        setSelectedReport(response.data);
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const getTemplateForType = (type: string) => {
    // CAT III Crown Block Template
    if (type === "CAT_III_CROWN_BLOCK") {
      return {
        sections: [
          {
            sectionNumber: 1,
            title: "Visuelle Inspektion",
            description: "Sichtprüfung aller Komponenten",
            items: [
              {
                itemNumber: "1.1",
                description: "Zustand der Seile",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "1.2",
                description: "Zustand der Rollen",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "1.3",
                description: "Verschleiß am Rahmen",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "1.4",
                description: "Beschädigung am Gehäuse",
                itemType: "CHECKBOX",
              },
            ],
          },
          {
            sectionNumber: 2,
            title: "Messungen",
            description: "Technische Messungen und Toleranzen",
            items: [
              {
                itemNumber: "2.1",
                description: "Seildurchmesser",
                itemType: "MEASUREMENT",
                measurementUnit: "mm",
                referenceValue: "28",
                minValue: "27",
                maxValue: "29",
              },
              {
                itemNumber: "2.2",
                description: "Achsabstand",
                itemType: "MEASUREMENT",
                measurementUnit: "mm",
              },
              {
                itemNumber: "2.3",
                description: "Lagertoleranz",
                itemType: "MEASUREMENT",
                measurementUnit: "mm",
              },
            ],
          },
          {
            sectionNumber: 3,
            title: "Funktionsprüfung",
            description: "Prüfung der Funktionalität",
            items: [
              {
                itemNumber: "3.1",
                description: "Drehung der Rollen",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "3.2",
                description: "Schmierung vorhanden",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "3.3",
                description: "Keine abnormalen Geräusche",
                itemType: "CHECKBOX",
              },
            ],
          },
          {
            sectionNumber: 4,
            title: "Sicherheit",
            description: "Sicherheitsrelevante Prüfungen",
            items: [
              {
                itemNumber: "4.1",
                description: "Befestigung sicher",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "4.2",
                description: "Sicherungselemente vorhanden",
                itemType: "CHECKBOX",
              },
              {
                itemNumber: "4.3",
                description: "Kennzeichnung lesbar",
                itemType: "CHECKBOX",
              },
            ],
          },
        ],
      };
    }

    // Default empty template
    return { sections: [] };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Inspektionsberichte"
        subtitle="CAT III Crown Block und weitere Inspektionen"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setIsPDFUploadDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Aus PDF erstellen
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Bericht
            </Button>
          </>
        }
        className="mb-0"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Suche</Label>
              <Input
                placeholder="Berichtnummer, Titel, Equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Anlage</Label>
              <Select value={filterPlant} onValueChange={setFilterPlant}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {availableRigs.map((rig) => (
                    <SelectItem key={rig.id} value={rig.name}>
                      {rig.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Typ</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="CAT_III_CROWN_BLOCK">
                    CAT III Crown Block
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="DRAFT">Entwurf</SelectItem>
                  <SelectItem value="SUBMITTED">Eingereicht</SelectItem>
                  <SelectItem value="APPROVED">Genehmigt</SelectItem>
                  <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Berichte ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Berichte gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Berichtnummer</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Anlage</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ergebnis</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono">
                        {report.reportNumber}
                      </TableCell>
                      <TableCell>{report.title}</TableCell>
                      <TableCell>
                        {report.type === "CAT_III_CROWN_BLOCK" &&
                          "CAT III Crown Block"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.plant}</Badge>
                      </TableCell>
                      <TableCell>{report.equipment}</TableCell>
                      <TableCell>
                        {new Date(report.inspectionDate).toLocaleDateString(
                          "de-DE",
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {getResultBadge(report.overallResult)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neuer Inspektionsbericht</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Inspektionsbericht
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={newReport.title}
                onChange={(e) =>
                  setNewReport({ ...newReport, title: e.target.value })
                }
                placeholder="z.B. Crown Block Inspektion Q4 2025"
              />
            </div>

            <div>
              <Label>Typ *</Label>
              <Select
                value={newReport.type}
                onValueChange={(value) =>
                  setNewReport({ ...newReport, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Inspektionstyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAT_III_CROWN_BLOCK">
                    CAT III Crown Block
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anlage *</Label>
                <Select
                  value={newReport.plant}
                  onValueChange={(value) =>
                    setNewReport({ ...newReport, plant: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRigs.map((rig) => (
                      <SelectItem key={rig.id} value={rig.name}>
                        {rig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Equipment *</Label>
                <Input
                  value={newReport.equipment}
                  onChange={(e) =>
                    setNewReport({ ...newReport, equipment: e.target.value })
                  }
                  placeholder="z.B. Crown Block #1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inspektionsdatum</Label>
                <Input
                  type="date"
                  value={newReport.inspectionDate}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      inspectionDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Inspektor</Label>
                <Input
                  value={newReport.inspector}
                  onChange={(e) =>
                    setNewReport({ ...newReport, inspector: e.target.value })
                  }
                  placeholder={user ? `${user.firstName} ${user.lastName}` : ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreateReport}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Upload Dialog */}
      <Dialog
        open={isPDFUploadDialogOpen}
        onOpenChange={setIsPDFUploadDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspektionsbericht aus PDF erstellen</DialogTitle>
            <DialogDescription>
              Laden Sie eine PDF-Checkliste hoch. Die App extrahiert automatisch
              die Checkboxen und erstellt einen interaktiven Bericht.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* PDF File Upload */}
            <div>
              <Label>PDF-Datei *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="pdf-file-input"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPDFFile(file);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="pdf-file-input">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() =>
                      document.getElementById("pdf-file-input")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {pdfFile ? pdfFile.name : "PDF-Datei auswählen"}
                  </Button>
                </label>
              </div>
              {pdfFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Größe: {(pdfFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            {/* Required Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anlage *</Label>
                <Select
                  value={newReport.plant}
                  onValueChange={(value) =>
                    setNewReport({ ...newReport, plant: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Anlage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRigs.map((rig) => (
                      <SelectItem key={rig.id} value={rig.name}>
                        {rig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Equipment *</Label>
                <Input
                  value={newReport.equipment}
                  onChange={(e) =>
                    setNewReport({ ...newReport, equipment: e.target.value })
                  }
                  placeholder="z.B. Crown Block #1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inspektionsdatum</Label>
                <Input
                  type="date"
                  value={newReport.inspectionDate}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      inspectionDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Inspektor</Label>
                <Input
                  value={newReport.inspector}
                  onChange={(e) =>
                    setNewReport({ ...newReport, inspector: e.target.value })
                  }
                  placeholder={user ? `${user.firstName} ${user.lastName}` : ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPDFUploadDialogOpen(false);
                setPDFFile(null);
              }}
              disabled={isUploadingPDF}
            >
              Abbrechen
            </Button>
            <Button onClick={handlePDFUpload} disabled={isUploadingPDF}>
              {isUploadingPDF ? "Wird verarbeitet..." : "PDF analysieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Report Dialog */}
      {selectedReport && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedReport.title}</DialogTitle>
                  <DialogDescription className="font-mono">
                    {selectedReport.reportNumber}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedReport.status)}
                  {getResultBadge(selectedReport.overallResult)}
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="inspection" className="w-full">
              <TabsList>
                <TabsTrigger value="inspection">Inspektion</TabsTrigger>
                <TabsTrigger value="notes">Notizen & Bewertung</TabsTrigger>
                <TabsTrigger value="attachments">Anhänge</TabsTrigger>
              </TabsList>

              <TabsContent value="inspection" className="space-y-6 mt-4">
                {/* Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inspektionsinformationen</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Anlage</Label>
                      <p>{selectedReport.plant}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Equipment</Label>
                      <p>{selectedReport.equipment}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Datum</Label>
                      <p>
                        {new Date(
                          selectedReport.inspectionDate,
                        ).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Inspektor</Label>
                      <p>{selectedReport.inspector}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Inspection Sections */}
                {selectedReport.sections &&
                selectedReport.sections.length > 0 ? (
                  selectedReport.sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle>
                          {section.sectionNumber}. {section.title}
                        </CardTitle>
                        {section.description && (
                          <CardDescription>
                            {section.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Nr.</TableHead>
                              <TableHead>Beschreibung</TableHead>
                              <TableHead className="w-48">Ergebnis</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.items &&
                              section.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-mono">
                                    {item.itemNumber}
                                  </TableCell>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={
                                          item.result === "OK"
                                            ? "default"
                                            : "outline"
                                        }
                                        className={
                                          item.result === "OK"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : ""
                                        }
                                        onClick={() =>
                                          handleUpdateItem(item.id, {
                                            result: "OK",
                                          })
                                        }
                                        disabled={
                                          selectedReport.status === "APPROVED"
                                        }
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        OK
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={
                                          item.result === "NOT_OK"
                                            ? "destructive"
                                            : "outline"
                                        }
                                        onClick={() =>
                                          handleUpdateItem(item.id, {
                                            result: "NOT_OK",
                                          })
                                        }
                                        disabled={
                                          selectedReport.status === "APPROVED"
                                        }
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Nicht OK
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Keine Inspektionspunkte vorhanden
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div>
                  <Label>Gesamtergebnis</Label>
                  <Select
                    value={selectedReport.overallResult || ""}
                    onValueChange={(value) =>
                      handleUpdateReport({
                        overallResult: value as
                          | "PASSED"
                          | "FAILED"
                          | "CONDITIONAL",
                      })
                    }
                    disabled={selectedReport.status === "APPROVED"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ergebnis wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSED">Bestanden</SelectItem>
                      <SelectItem value="FAILED">Nicht bestanden</SelectItem>
                      <SelectItem value="CONDITIONAL">Bedingt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Allgemeine Notizen</Label>
                  <Textarea
                    value={selectedReport.generalNotes || ""}
                    onChange={(e) =>
                      handleUpdateReport({ generalNotes: e.target.value })
                    }
                    rows={5}
                    placeholder="Allgemeine Bemerkungen zur Inspektion..."
                    disabled={selectedReport.status === "APPROVED"}
                  />
                </div>

                <div>
                  <Label>Empfehlungen</Label>
                  <Textarea
                    value={selectedReport.recommendations || ""}
                    onChange={(e) =>
                      handleUpdateReport({ recommendations: e.target.value })
                    }
                    rows={5}
                    placeholder="Empfohlene Maßnahmen..."
                    disabled={selectedReport.status === "APPROVED"}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedReport.status}
                    onValueChange={(value) =>
                      handleUpdateReport({
                        status: value as
                          | "DRAFT"
                          | "SUBMITTED"
                          | "APPROVED"
                          | "REJECTED",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Entwurf</SelectItem>
                      <SelectItem value="SUBMITTED">Eingereicht</SelectItem>
                      {user?.role === "ADMIN" && (
                        <>
                          <SelectItem value="APPROVED">Genehmigt</SelectItem>
                          <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Anhänge</CardTitle>
                    <CardDescription>
                      Fügen Sie Fotos oder Dokumente hinzu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Upload Button */}
                    <div className="mb-4">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Dateien hochladen
                        </Button>
                      </label>
                    </div>

                    {!selectedReport.attachments ||
                    selectedReport.attachments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Keine Anhänge vorhanden
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedReport.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {attachment.originalName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {(attachment.fileSize / 1024).toFixed(1)} KB •{" "}
                                  {new Date(
                                    attachment.uploadedAt,
                                  ).toLocaleDateString("de-DE")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(attachment.filePath, "_blank")
                                }
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Schließen
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectedReport && generateReportPDF(selectedReport)
                }
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={isActionConfirmOpen}
        onOpenChange={setIsActionConfirmOpen}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Item als "Nicht OK" markiert</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Dieses Item wurde als "Nicht OK" markiert.
                {pendingNotOkUpdate && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">Item:</p>
                      <p className="text-muted-foreground">
                        {pendingNotOkUpdate.itemDescription}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Sektion:</p>
                      <p className="text-muted-foreground">
                        {pendingNotOkUpdate.sectionTitle}
                      </p>
                    </div>

                    {/* Photo Upload Section */}
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="notok-photos" className="text-foreground">
                        Fotos anhängen (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="notok-photos"
                          type="file"
                          accept="image/*"
                          multiple
                          capture="environment"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setNotOkPhotos((prev) => [...prev, ...files]);
                          }}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const input = document.getElementById(
                              "notok-photos",
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      {notOkPhotos.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {notOkPhotos.length} Foto(s) ausgewählt:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {notOkPhotos.map((photo, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs"
                              >
                                <span>{photo.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0"
                                  onClick={() => {
                                    setNotOkPhotos((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    );
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discipline and Priority Selection */}
                    <div className="mt-4 pt-3 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label
                            htmlFor="action-discipline"
                            className="text-foreground"
                          >
                            Zuständigkeit
                          </Label>
                          <Select
                            value={actionDiscipline}
                            onValueChange={(value) =>
                              setActionDiscipline(
                                value as "MECHANIK" | "ELEKTRIK" | "ANLAGE",
                              )
                            }
                          >
                            <SelectTrigger id="action-discipline">
                              <SelectValue placeholder="Wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MECHANIK">Mechanik</SelectItem>
                              <SelectItem value="ELEKTRIK">
                                Elektriker
                              </SelectItem>
                              <SelectItem value="ANLAGE">Anlage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="action-priority"
                            className="text-foreground"
                          >
                            Dringlichkeit
                          </Label>
                          <Select
                            value={actionPriority}
                            onValueChange={(value) =>
                              setActionPriority(
                                value as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                              )
                            }
                          >
                            <SelectTrigger id="action-priority">
                              <SelectValue placeholder="Wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Niedrig</SelectItem>
                              <SelectItem value="MEDIUM">Mittel</SelectItem>
                              <SelectItem value="HIGH">Hoch</SelectItem>
                              <SelectItem value="URGENT">Dringend</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <p className="font-semibold text-foreground">
                        Möchten Sie automatisch eine hochpriorisierte Aufgabe
                        (Action) erstellen?
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Update without creating action
                if (pendingNotOkUpdate) {
                  performItemUpdate(
                    pendingNotOkUpdate.itemId,
                    pendingNotOkUpdate.updates,
                    false,
                  );
                }
                setPendingNotOkUpdate(null);
                setNotOkPhotos([]);
                setActionDiscipline("MECHANIK");
                setActionPriority("HIGH");
              }}
            >
              Nein, nur Status ändern
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Update and create action
                if (pendingNotOkUpdate) {
                  performItemUpdate(
                    pendingNotOkUpdate.itemId,
                    pendingNotOkUpdate.updates,
                    true,
                  );
                }
                setPendingNotOkUpdate(null);
                setNotOkPhotos([]);
                setActionDiscipline("MECHANIK");
                setActionPriority("HIGH");
              }}
            >
              Ja, Action erstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InspectionReports;
