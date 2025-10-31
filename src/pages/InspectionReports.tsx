import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

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
  sections: InspectionSection[];
  attachments: InspectionAttachment[];
  createdAt: string;
  updatedAt: string;
}

const InspectionReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<InspectionReport[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(
    null
  );

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

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filterPlant, filterType, filterStatus, searchTerm]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: InspectionReport[];
      }>("/inspection-reports");

      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({
        title: "Fehler",
        description: "Inspektionsberichte konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
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
      filtered = filtered.filter(
        (r) =>
          r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

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
        setReports([response.data, ...reports]);
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
    updates: Partial<InspectionItem>
  ) => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: InspectionItem;
      }>(`/inspection-reports/items/${itemId}`, updates);

      if (response.success && selectedReport) {
        // Update local state
        const updatedReport = {
          ...selectedReport,
          sections: selectedReport.sections.map((section) => ({
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          })),
        };
        setSelectedReport(updatedReport);

        // Update reports list
        setReports(
          reports.map((r) => (r.id === updatedReport.id ? updatedReport : r))
        );
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
        setSelectedReport(response.data);
        setReports(
          reports.map((r) => (r.id === response.data.id ? response.data : r))
        );

        toast({
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
      setReports(reports.filter((r) => r.id !== reportId));

      toast({
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
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
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

    const variants: Record<string, { variant: any; text: string }> = {
      PASSED: { variant: "default", text: "Bestanden" },
      FAILED: { variant: "destructive", text: "Nicht bestanden" },
      CONDITIONAL: { variant: "secondary", text: "Bedingt" },
    };

    const config = variants[result];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.text}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspektionsberichte</h1>
          <p className="text-muted-foreground">
            CAT III Crown Block und weitere Inspektionen
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Bericht
        </Button>
      </div>

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
                  <SelectItem value="T208">T208</SelectItem>
                  <SelectItem value="T207">T207</SelectItem>
                  <SelectItem value="T700">T700</SelectItem>
                  <SelectItem value="T46">T46</SelectItem>
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
            <div className="text-center py-8 text-muted-foreground">
              Lade Berichte...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Berichte gefunden
            </div>
          ) : (
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
                        "de-DE"
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
                    <SelectItem value="T208">T208</SelectItem>
                    <SelectItem value="T207">T207</SelectItem>
                    <SelectItem value="T700">T700</SelectItem>
                    <SelectItem value="T46">T46</SelectItem>
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
                          selectedReport.inspectionDate
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
                {selectedReport.sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>
                        {section.sectionNumber}. {section.title}
                      </CardTitle>
                      {section.description && (
                        <CardDescription>{section.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Nr.</TableHead>
                            <TableHead>Beschreibung</TableHead>
                            <TableHead className="w-32">Typ</TableHead>
                            <TableHead className="w-48">Wert/Prüfung</TableHead>
                            <TableHead className="w-32">Ergebnis</TableHead>
                            <TableHead>Notizen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono">
                                {item.itemNumber}
                              </TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.itemType === "CHECKBOX" && "Checkbox"}
                                  {item.itemType === "MEASUREMENT" && "Messung"}
                                  {item.itemType === "TEXT" && "Text"}
                                  {item.itemType === "RATING" && "Bewertung"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.itemType === "CHECKBOX" && (
                                  <Checkbox
                                    checked={item.isChecked || false}
                                    onCheckedChange={(checked) =>
                                      handleUpdateItem(item.id, {
                                        isChecked: checked as boolean,
                                        result: checked ? "OK" : "NOT_OK",
                                      })
                                    }
                                    disabled={
                                      selectedReport.status === "APPROVED"
                                    }
                                  />
                                )}
                                {item.itemType === "MEASUREMENT" && (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={item.measurementValue || ""}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          measurementValue: e.target.value,
                                        })
                                      }
                                      className="w-24"
                                      disabled={
                                        selectedReport.status === "APPROVED"
                                      }
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {item.measurementUnit}
                                    </span>
                                    {item.referenceValue && (
                                      <span className="text-xs text-muted-foreground">
                                        (Ref: {item.referenceValue})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {item.itemType === "TEXT" && (
                                  <Input
                                    value={item.textValue || ""}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, {
                                        textValue: e.target.value,
                                      })
                                    }
                                    disabled={
                                      selectedReport.status === "APPROVED"
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.result || ""}
                                  onValueChange={(value) =>
                                    handleUpdateItem(item.id, {
                                      result: value as "OK" | "NOT_OK" | "N/A",
                                    })
                                  }
                                  disabled={
                                    selectedReport.status === "APPROVED"
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="OK">OK</SelectItem>
                                    <SelectItem value="NOT_OK">
                                      Nicht OK
                                    </SelectItem>
                                    <SelectItem value="N/A">N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.notes || ""}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      notes: e.target.value,
                                    })
                                  }
                                  placeholder="Notizen..."
                                  disabled={
                                    selectedReport.status === "APPROVED"
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
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
                    {selectedReport.attachments.length === 0 ? (
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
                                    attachment.uploadedAt
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
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                PDF Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InspectionReports;
