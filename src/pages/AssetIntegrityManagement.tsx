import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  User,
  Flag,
  Award,
  Plus,
  Trash2,
  Edit,
  Presentation,
  Save,
  Loader2,
  Eye,
  ArrowUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import * as assetIntegrityApi from "@/services/assetIntegrityApi";

// Enhanced Interfaces
interface Inspection {
  id: string;
  type: "statutory" | "internal" | "client" | "certification";
  description: string;
  dueDate: string;
  completedDate?: string;
  status: "upcoming" | "due" | "overdue" | "completed";
  responsible: string;
}

interface Issue {
  id: string;
  category: "safety" | "technical" | "compliance" | "commercial";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  dueDate?: string;
  status: "open" | "in-progress" | "closed";
  createdDate: string;
}

interface Improvement {
  id: string;
  description: string;
  category: "equipment" | "certification" | "compliance" | "efficiency";
  priority: "low" | "medium" | "high";
  estimatedCost: number;
  potentialRevenue: string;
  status: "planned" | "in-progress" | "completed";
}

interface GeneralInfo {
  id: string;
  description: string;
  deadline?: string;
  createdDate: string;
}

interface Document {
  id: string;
  name: string;
  type: "contract" | "certificate" | "photo" | "report" | "drawing";
  size: number;
  uploadDate: string;
  uploadedBy: string;
  version: number;
  url?: string;
}

interface Rig {
  id: string;
  name: string;
  region: "Oman" | "Pakistan";
  // Contract Info
  contractStatus: "active" | "idle" | "standby" | "maintenance";
  contractEndDate?: string;
  operator?: string;
  location: string;
  dayRate?: number;
  // Certifications
  certifications: string[];
  // General Information
  generalInfo?: GeneralInfo[];
  // Documents
  documents?: Document[];
  // Data
  inspections: Inspection[];
  issues: Issue[];
  improvements: Improvement[];
}

// Mock Data mit realistischen Beispielen
const initialRigs: Rig[] = [
  {
    id: "1",
    name: "T700",
    region: "Oman",
    contractStatus: "active",
    contractEndDate: "2026-08-15",
    operator: "PDO (Petroleum Development Oman)",
    location: "Fahud Field",
    dayRate: 28000,
    certifications: ["API Spec 7K", "ISO 9001:2015", "Well Control"],
    generalInfo: [
      {
        id: "g1",
        description: "Anlage steht noch bis Ende Q3 auf Vertrag",
        deadline: "2026-08-15",
        createdDate: "2026-02-10",
      },
      {
        id: "g2",
        description: "Rig Move nach Lekhwair geplant",
        deadline: "2026-08-20",
        createdDate: "2026-02-11",
      },
      {
        id: "g3",
        description: "Supervisor Mohammed Al-Balushi vor Ort",
        createdDate: "2026-02-14",
      },
      {
        id: "g4",
        description: "API Spec 7K Re-Audit steht an",
        deadline: "2026-03-15",
        createdDate: "2026-02-01",
      },
    ],
    inspections: [
      {
        id: "i1",
        type: "statutory",
        description: "Annual BOP Stack Inspection",
        dueDate: "2026-03-01",
        status: "upcoming",
        responsible: "Third Party Inspector",
      },
      {
        id: "i2",
        type: "internal",
        description: "Drawworks Preventive Maintenance",
        dueDate: "2026-02-20",
        status: "due",
        responsible: "Rig Mechanic",
      },
    ],
    issues: [
      {
        id: "is1",
        category: "technical",
        severity: "medium",
        description: "Mud pump #2 showing vibration - requires monitoring",
        status: "in-progress",
        createdDate: "2026-02-10",
      },
    ],
    improvements: [
      {
        id: "im1",
        description: "Install advanced drilling automation system",
        category: "equipment",
        priority: "high",
        estimatedCost: 450000,
        potentialRevenue: "Enables premium contracts (+$5k day rate)",
        status: "planned",
      },
    ],
  },
  {
    id: "2",
    name: "T46",
    region: "Oman",
    contractStatus: "idle",
    location: "Muscat Yard",
    certifications: ["API Spec 4F", "ISO 9001:2015"],
    inspections: [
      {
        id: "i3",
        type: "certification",
        description: "Well Control Equipment Certification Renewal",
        dueDate: "2026-01-30", // OVERDUE!
        status: "overdue",
        responsible: "Certification Body",
      },
      {
        id: "i4",
        type: "statutory",
        description: "5-Year Crown Block Inspection",
        dueDate: "2026-02-25",
        status: "due",
        responsible: "Structural Engineer",
      },
    ],
    issues: [
      {
        id: "is2",
        category: "compliance",
        severity: "critical",
        description: "Well Control Certificate expired - rig cannot operate",
        dueDate: "2026-02-18",
        status: "open",
        createdDate: "2026-01-31",
      },
      {
        id: "is3",
        category: "commercial",
        severity: "high",
        description:
          "Marketing materials outdated - need updated capability matrix",
        status: "open",
        createdDate: "2026-02-01",
      },
    ],
    improvements: [
      {
        id: "im2",
        description: "Upgrade to 7500 PSI BOP stack (currently 5000 PSI)",
        category: "equipment",
        priority: "high",
        estimatedCost: 850000,
        potentialRevenue: "Access to HPHT wells market",
        status: "planned",
      },
      {
        id: "im3",
        description: "Obtain ISO 14001 Environmental Certification",
        category: "certification",
        priority: "medium",
        estimatedCost: 35000,
        potentialRevenue: "Required for major IOC tenders",
        status: "planned",
      },
    ],
  },
  {
    id: "3",
    name: "T350",
    region: "Pakistan",
    contractStatus: "standby",
    contractEndDate: "2026-03-30",
    operator: "OGDCL",
    location: "Dhodak Field",
    dayRate: 18000,
    certifications: ["API Spec 8C", "IADC"],
    inspections: [
      {
        id: "i5",
        type: "client",
        description: "Client Pre-Spud Inspection",
        dueDate: "2026-02-22",
        status: "upcoming",
        responsible: "Client QHSE Team",
      },
    ],
    issues: [],
    improvements: [
      {
        id: "im4",
        description: "Install Real-Time Data Monitoring System",
        category: "efficiency",
        priority: "medium",
        estimatedCost: 180000,
        potentialRevenue:
          "Competitive advantage for performance-based contracts",
        status: "in-progress",
      },
    ],
  },
];

export default function AssetIntegrityManagement() {
  const { toast } = useToast();

  const [rigs, setRigs] = useState<Rig[]>(initialRigs);
  const [selectedRegion, setSelectedRegion] = useState<
    "Oman" | "Pakistan" | "all"
  >("all");
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);

  // UX States
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hoveredRigId, setHoveredRigId] = useState<string | null>(null);

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback(() => {
    saveData();
  }, 3000);

  // Add Dialog States
  const [isAddInspectionOpen, setIsAddInspectionOpen] = useState(false);
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [isAddImprovementOpen, setIsAddImprovementOpen] = useState(false);
  const [isAddRigOpen, setIsAddRigOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string;
    id: string;
    label: string;
  } | null>(null);

  // Edit Mode State
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [editedRig, setEditedRig] = useState<Partial<Rig>>({});

  // Form States for New Items
  const [newInspection, setNewInspection] = useState({
    type: "internal" as "statutory" | "internal" | "client" | "certification",
    description: "",
    dueDate: "",
    responsible: "",
  });

  const [newIssue, setNewIssue] = useState({
    category: "technical" as
      | "safety"
      | "technical"
      | "compliance"
      | "commercial",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    description: "",
    dueDate: "",
  });

  const [newImprovement, setNewImprovement] = useState({
    description: "",
    category: "equipment" as
      | "equipment"
      | "certification"
      | "compliance"
      | "efficiency",
    priority: "medium" as "low" | "medium" | "high",
    estimatedCost: 0,
    potentialRevenue: "",
  });

  const [newGeneralInfo, setNewGeneralInfo] = useState({
    description: "",
    deadline: "",
  });

  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [editedInfo, setEditedInfo] = useState<Partial<GeneralInfo>>({});
  const [showMeetingOverview, setShowMeetingOverview] = useState(false);
  const [overviewForAll, setOverviewForAll] = useState(false);

  const [newRig, setNewRig] = useState({
    name: "",
    region: "Oman" as "Oman" | "Pakistan",
    contractStatus: "idle" as "active" | "idle" | "standby" | "maintenance",
    operator: "",
    location: "",
    dayRate: 0,
    contractEndDate: "",
  });

  // Helper: Calculate days until date
  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: Calculate rig priority status based on overdue items
  const getRigPriorityStatus = (
    rig: Rig,
  ): "ok" | "upcoming" | "due-soon" | "overdue" => {
    let minDays = Infinity;
    let hasOverdue = false;

    // Check inspections
    rig.inspections.forEach((inspection) => {
      if (inspection.status === "overdue") {
        hasOverdue = true;
      } else if (inspection.status !== "completed") {
        const days = getDaysUntil(inspection.dueDate);
        if (days < minDays) minDays = days;
      }
    });

    // Check issues with due dates
    rig.issues.forEach((issue) => {
      if (issue.dueDate && issue.status !== "closed") {
        const days = getDaysUntil(issue.dueDate);
        if (days < 0) hasOverdue = true;
        else if (days < minDays) minDays = days;
      }
    });

    if (hasOverdue) return "overdue";
    if (minDays <= 7) return "due-soon";
    if (minDays <= 30) return "upcoming";
    return "ok";
  };

  // Helper: Get color for priority status
  const getPriorityColor = (
    status: "ok" | "upcoming" | "due-soon" | "overdue",
  ) => {
    switch (status) {
      case "ok":
        return "border-green-500/50 bg-green-500/10";
      case "upcoming":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "due-soon":
        return "border-orange-500/50 bg-orange-500/10";
      case "overdue":
        return "border-red-500/50 bg-red-500/20";
      default:
        return "border-border";
    }
  };

  // Auto-Save Logic
  const saveData = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production: await assetIntegrityApi.updateRigs(rigs);
      localStorage.setItem("asset-integrity-backup", JSON.stringify(rigs));

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      toast({
        variant: "success" as const,
        title: "Gespeichert ✓",
        description: `Änderungen um ${new Date().toLocaleTimeString("de-DE")} gespeichert`,
        duration: 2000,
      });
    } catch {
      toast({
        title: "Fehler beim Speichern",
        description: "Änderungen konnten nicht gespeichert werden",
        variant: "destructive",
        action: (
          <Button size="sm" onClick={() => saveData()}>
            Erneut versuchen
          </Button>
        ),
      });
    } finally {
      setIsSaving(false);
    }
  }, [rigs, toast]);

  // Auto-Save on changes (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    debouncedSave();
  }, [hasUnsavedChanges, debouncedSave]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + S = Manual Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveData();
      }

      // Escape = Close Dialog
      if (e.key === "Escape") {
        setSelectedRig(null);
        setIsAddRigOpen(false);
        setShowMeetingOverview(false);
      }

      // A = Add Asset (when no dialog open)
      if (e.key === "a" || e.key === "A") {
        if (!selectedRig && !isAddRigOpen) {
          e.preventDefault();
          setIsAddRigOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveData, selectedRig, isAddRigOpen]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load backup from localStorage on mount
  useEffect(() => {
    const backup = localStorage.getItem("asset-integrity-backup");
    if (backup) {
      try {
        const parsedRigs = JSON.parse(backup);
        setRigs(parsedRigs);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to load backup:", error);
      }
    } else {
      // Initialize localStorage with default rigs so other pages can access them
      localStorage.setItem(
        "asset-integrity-backup",
        JSON.stringify(initialRigs),
      );
    }
  }, []);

  // Filter rigs by region
  const filteredRigs =
    selectedRegion === "all"
      ? rigs
      : rigs.filter((rig) => rig.region === selectedRegion);

  // Calculate statistics
  const totalRigs = filteredRigs.length;
  const activeRigs = filteredRigs.filter(
    (rig) => rig.contractStatus === "active",
  ).length;
  const overdueInspections = filteredRigs.reduce(
    (sum, rig) =>
      sum + rig.inspections.filter((i) => i.status === "overdue").length,
    0,
  );
  const criticalIssues = filteredRigs.reduce(
    (sum, rig) =>
      sum +
      rig.issues.filter(
        (i) => i.severity === "critical" && i.status !== "closed",
      ).length,
    0,
  );

  // Get contract status badge color
  const getContractStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "idle":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      case "standby":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "maintenance":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getInspectionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "due":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "overdue":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getImprovementPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // CRUD Operations
  const handleAddInspection = () => {
    if (!selectedRig || !newInspection.description || !newInspection.dueDate)
      return;

    const inspection: Inspection = {
      id: Date.now().toString(),
      ...newInspection,
      status: "upcoming",
    };

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? { ...rig, inspections: [...rig.inspections, inspection] }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
    setNewInspection({
      type: "internal",
      description: "",
      dueDate: "",
      responsible: "",
    });
    setIsAddInspectionOpen(false);
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (!selectedRig) return;

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? {
            ...rig,
            inspections: rig.inspections.filter((i) => i.id !== inspectionId),
          }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
  };

  const handleAddIssue = () => {
    if (!selectedRig || !newIssue.description) return;

    const issue: Issue = {
      id: Date.now().toString(),
      ...newIssue,
      status: "open",
      createdDate: new Date().toISOString().split("T")[0],
    };

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? { ...rig, issues: [...rig.issues, issue] }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setNewIssue({
      category: "technical",
      severity: "medium",
      description: "",
      dueDate: "",
    });
    setIsAddIssueOpen(false);
  };

  const handleDeleteIssue = (issueId: string) => {
    if (!selectedRig) return;

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? { ...rig, issues: rig.issues.filter((i) => i.id !== issueId) }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
  };

  const handleSaveGeneralInfo = () => {
    if (!selectedRig || !editedRig) return;

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id ? { ...rig, ...editedRig } : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setIsEditingGeneral(false);
    setEditedRig({});
  };

  const handleAddGeneralInfo = () => {
    if (!selectedRig || !newGeneralInfo.description) return;

    const generalInfo: GeneralInfo = {
      id: Date.now().toString(),
      description: newGeneralInfo.description,
      deadline: newGeneralInfo.deadline || undefined,
      createdDate: new Date().toISOString().split("T")[0],
    };

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? {
            ...rig,
            generalInfo: [...(rig.generalInfo || []), generalInfo],
          }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
    setNewGeneralInfo({ description: "", deadline: "" });
  };

  const handleDeleteGeneralInfo = (infoId: string) => {
    if (!selectedRig) return;

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? {
            ...rig,
            generalInfo: (rig.generalInfo || []).filter((i) => i.id !== infoId),
          }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
  };

  const handleEditGeneralInfo = (info: GeneralInfo) => {
    setEditingInfoId(info.id);
    setEditedInfo({
      description: info.description,
      deadline: info.deadline,
    });
  };

  const handleSaveEditedInfo = async () => {
    if (!selectedRig || !editingInfoId) return;

    try {
      setIsSaving(true);

      // Update local state first for immediate UI feedback
      const updatedRigs = rigs.map((rig) =>
        rig.id === selectedRig.id
          ? {
              ...rig,
              generalInfo: (rig.generalInfo || []).map((info) =>
                info.id === editingInfoId
                  ? {
                      ...info,
                      description: editedInfo.description || info.description,
                      deadline:
                        editedInfo.deadline !== undefined
                          ? editedInfo.deadline || undefined
                          : info.deadline,
                    }
                  : info,
              ),
            }
          : rig,
      );

      const updatedRig = updatedRigs.find((r) => r.id === selectedRig.id);
      if (!updatedRig) return;

      // Persist to backend
      await assetIntegrityApi.updateRig(selectedRig.id, {
        generalInfo: updatedRig.generalInfo,
      });

      // Update state after successful save
      setRigs(updatedRigs);
      setSelectedRig(updatedRig);
      setEditingInfoId(null);
      setEditedInfo({});
      setLastSaved(new Date());

      toast({
        variant: "success" as const,
        title: "Erfolgreich gespeichert",
        description: "Die Notiz wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error("Error saving info:", error);
      toast({
        title: "Fehler beim Speichern",
        description:
          "Die Notiz konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Meeting Overview Text
  const generateMeetingOverview = (rigsToInclude: Rig[]) => {
    let overview = "=== MEETING-ÜBERSICHT ===\n";
    overview += `Datum: ${new Date().toLocaleDateString("de-DE")}\n\n`;

    rigsToInclude.forEach((rig) => {
      overview += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      overview += `🏗️  ${rig.name} - ${rig.location}\n`;
      overview += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Contract Status
      overview += `📋 VERTRAGSSTATUS\n`;
      overview += `   Status: ${rig.contractStatus}\n`;
      if (rig.operator) overview += `   Operator: ${rig.operator}\n`;
      if (rig.contractEndDate) {
        const daysToEnd = Math.ceil(
          (new Date(rig.contractEndDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        overview += `   Vertragsende: ${new Date(rig.contractEndDate).toLocaleDateString("de-DE")} (noch ${daysToEnd} Tage)\n`;
      }
      if (rig.dayRate)
        overview += `   Day Rate: $${rig.dayRate.toLocaleString()}/Tag\n`;
      overview += `\n`;

      // Important Notes with Deadlines
      const notesWithDeadline = (rig.generalInfo || []).filter(
        (info) => info.deadline,
      );
      const notesWithoutDeadline = (rig.generalInfo || []).filter(
        (info) => !info.deadline,
      );

      if (notesWithDeadline.length > 0 || notesWithoutDeadline.length > 0) {
        overview += `📌 WICHTIGE INFORMATIONEN\n`;

        // Notes with deadline first
        notesWithDeadline
          .sort(
            (a, b) =>
              new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
          )
          .forEach((info) => {
            const daysUntil = Math.ceil(
              (new Date(info.deadline!).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            const urgency =
              daysUntil < 0
                ? "❗ ÜBERFÄLLIG"
                : daysUntil <= 7
                  ? "⚠️  DRINGEND"
                  : "📅";
            overview += `   ${urgency} ${info.description}\n`;
            overview += `      → Deadline: ${new Date(info.deadline!).toLocaleDateString("de-DE")}`;
            overview +=
              daysUntil < 0
                ? ` (${Math.abs(daysUntil)} Tage überfällig!)\n`
                : ` (noch ${daysUntil} Tage)\n`;
          });

        // Notes without deadline
        notesWithoutDeadline.forEach((info) => {
          overview += `   ℹ️  ${info.description}\n`;
        });
        overview += `\n`;
      }

      // Upcoming Inspections
      const upcomingInspections = rig.inspections.filter(
        (i) => i.status !== "completed",
      );
      if (upcomingInspections.length > 0) {
        overview += `🔍 ANSTEHENDE INSPEKTIONEN (${upcomingInspections.length})\n`;
        upcomingInspections
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          )
          .forEach((inspection) => {
            const daysUntil = Math.ceil(
              (new Date(inspection.dueDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            const status =
              inspection.status === "overdue"
                ? "❗ ÜBERFÄLLIG"
                : daysUntil <= 7
                  ? "⚠️  "
                  : "   ";
            overview += `   ${status} ${inspection.description}\n`;
            overview += `      → ${new Date(inspection.dueDate).toLocaleDateString("de-DE")}`;
            overview +=
              inspection.status === "overdue"
                ? ` (${Math.abs(daysUntil)} Tage überfällig!)\n`
                : ` (noch ${daysUntil} Tage)\n`;
          });
        overview += `\n`;
      }

      // Open Issues
      const openIssues = rig.issues.filter((i) => i.status !== "closed");
      if (openIssues.length > 0) {
        overview += `⚠️  OFFENE RISIKEN (${openIssues.length})\n`;
        openIssues.forEach((issue) => {
          const severity =
            issue.severity === "critical"
              ? "🔴 KRITISCH"
              : issue.severity === "high"
                ? "🟠 HOCH"
                : "🟡";
          overview += `   ${severity} ${issue.description}\n`;
          if (issue.dueDate) {
            const daysUntil = Math.ceil(
              (new Date(issue.dueDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            overview += `      → Fällig: ${new Date(issue.dueDate).toLocaleDateString("de-DE")} (noch ${daysUntil} Tage)\n`;
          }
        });
        overview += `\n`;
      }

      // Certifications
      if (rig.certifications.length > 0) {
        overview += `🏆 ZERTIFIZIERUNGEN\n`;
        overview += `   ${rig.certifications.join(", ")}\n\n`;
      }
    });

    overview += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    overview += `Ende der Übersicht\n`;

    return overview;
  };

  const handleAddRig = () => {
    if (!newRig.name || !newRig.location) return;

    const rig: Rig = {
      id: Date.now().toString(),
      name: newRig.name,
      region: newRig.region,
      contractStatus: newRig.contractStatus,
      operator: newRig.operator || undefined,
      location: newRig.location,
      dayRate: newRig.dayRate > 0 ? newRig.dayRate : undefined,
      contractEndDate: newRig.contractEndDate || undefined,
      certifications: [],
      generalInfo: [],
      inspections: [],
      issues: [],
      improvements: [],
    };

    setRigs([...rigs, rig]);
    setNewRig({
      name: "",
      region: "Oman",
      contractStatus: "idle",
      operator: "",
      location: "",
      dayRate: 0,
      contractEndDate: "",
    });
    setIsAddRigOpen(false);
  };

  const handleAddImprovement = () => {
    if (!selectedRig || !newImprovement.description) return;

    const improvement: Improvement = {
      id: Date.now().toString(),
      ...newImprovement,
      status: "planned",
    };

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? { ...rig, improvements: [...rig.improvements, improvement] }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setNewImprovement({
      description: "",
      category: "equipment",
      priority: "medium",
      estimatedCost: 0,
      potentialRevenue: "",
    });
    setIsAddImprovementOpen(false);
  };

  const handleDeleteImprovement = (improvementId: string) => {
    if (!selectedRig) return;

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? {
            ...rig,
            improvements: rig.improvements.filter(
              (i) => i.id !== improvementId,
            ),
          }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Asset Integrity Management
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Vertrags-, Inspektions- & Risikomanagement für Ihre
                  Bohranlagen
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Save Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-lg border border-border">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    <span className="text-xs text-muted-foreground">
                      Speichert...
                    </span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Clock className="h-3 w-3 text-orange-400" />
                    <span className="text-xs text-orange-400">
                      Nicht gespeichert
                    </span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(lastSaved).toLocaleTimeString("de-DE")}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Manual Save Button */}
              <Button
                onClick={saveData}
                disabled={isSaving || !hasUnsavedChanges}
                variant="outline"
                size="sm"
                className="touch-manipulation"
                title="Strg+S"
              >
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Speichern</span>
              </Button>

              <Button
                onClick={() => setIsAddRigOpen(true)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 touch-manipulation"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Anlage hinzufügen</span>
                <span className="sm:hidden">Neue Anlage</span>
              </Button>
              <Button
                onClick={() => {
                  setOverviewForAll(true);
                  setShowMeetingOverview(true);
                }}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 touch-manipulation"
              >
                <Presentation className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  Meeting-Übersicht (Alle)
                </span>
                <span className="sm:hidden">Übersicht</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt Anlagen
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {totalRigs}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <ArrowUp className="h-3 w-3" />
                  <span>2</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRigs} unter Vertrag
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Im Vertrag
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {activeRigs}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aktive Contracts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Inspektionen
              </CardTitle>
              <Clock className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {overdueInspections}
                </div>
                {overdueInspections > 0 && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Kritisch</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sofortige Maßnahmen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kritische Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {criticalIssues}
              </div>
              <p className="text-xs text-muted-foreground">Hohe Priorität</p>
            </CardContent>
          </Card>
        </div>

        {/* Region Filter */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              Region auswählen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedRegion}
              onValueChange={(v) =>
                setSelectedRegion(v as "Oman" | "Pakistan" | "all")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Alle Regionen</TabsTrigger>
                <TabsTrigger value="Oman">Oman</TabsTrigger>
                <TabsTrigger value="Pakistan">Pakistan</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Rigs Grid with Priority Coloring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRigs.map((rig) => {
            const priorityStatus = getRigPriorityStatus(rig);
            const priorityColor = getPriorityColor(priorityStatus);
            const isHovered = hoveredRigId === rig.id;

            return (
              <Card
                key={rig.id}
                className={`group relative border bg-card/80 hover:bg-card transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.02] backdrop-blur-sm ${priorityColor}`}
                onClick={() => setSelectedRig(rig)}
                onMouseEnter={() => setHoveredRigId(rig.id)}
                onMouseLeave={() => setHoveredRigId(null)}
              >
                {/* Status Badge - Top Right Corner */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge
                    className={`text-xs font-medium ${getContractStatusColor(rig.contractStatus)}`}
                  >
                    {rig.contractStatus === "active"
                      ? "Im Vertrag"
                      : rig.contractStatus === "idle"
                        ? "Idle"
                        : rig.contractStatus === "standby"
                          ? "Standby"
                          : "Wartung"}
                  </Badge>
                </div>

                {/* Quick Actions - visible on hover */}
                {/* Quick Action Buttons - Immer sichtbar auf Touch-Geräten, nur Hover auf Desktop */}
                <div
                  className={`absolute -top-3 -right-3 flex gap-1.5 z-20 transition-opacity ${
                    isHovered
                      ? "opacity-100"
                      : "opacity-0 md:opacity-0 touch:opacity-100"
                  }`}
                >
                  <Button
                    size="sm"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRig(rig);
                    }}
                    title="Details ansehen"
                    aria-label="Details ansehen"
                  >
                    <Eye className="h-6 w-6" strokeWidth={2} />
                  </Button>
                  <Button
                    size="sm"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 bg-green-600 hover:bg-green-700 shadow-lg rounded-full touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRig(rig);
                      setIsAddInspectionOpen(true);
                    }}
                    title="Inspektion planen"
                    aria-label="Inspektion planen"
                  >
                    <Calendar className="h-6 w-6" strokeWidth={2} />
                  </Button>
                  <Button
                    size="sm"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 bg-orange-600 hover:bg-orange-700 shadow-lg rounded-full touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRig(rig);
                      setIsAddIssueOpen(true);
                    }}
                    title="Issue melden"
                    aria-label="Issue melden"
                  >
                    <AlertCircle className="h-6 w-6" strokeWidth={2} />
                  </Button>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3 pr-20">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-foreground truncate">
                        {rig.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="text-xs border-border text-muted-foreground mt-1.5"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {rig.region}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Day Rate - Prominent Display */}
                  {rig.dayRate && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Day Rate
                          </p>
                          <p className="text-2xl font-bold text-foreground flex items-baseline gap-1">
                            <DollarSign className="h-5 w-5 text-green-400" />
                            {rig.dayRate.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">
                              /Tag
                            </span>
                          </p>
                        </div>
                        {rig.contractEndDate && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Vertragsende
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(rig.contractEndDate).toLocaleDateString(
                                "de-DE",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location & Operator */}
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Standort
                      </p>
                      <p className="text-sm text-foreground font-medium">
                        {rig.location}
                      </p>
                    </div>
                    {rig.operator && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Operator
                        </p>
                        <p className="text-sm text-foreground font-medium">
                          {rig.operator}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Inspektionen
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        <p className="text-lg font-bold text-foreground">
                          {rig.inspections.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Issues
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                        <p className="text-lg font-bold text-foreground">
                          {
                            rig.issues.filter((i) => i.status !== "closed")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Upgrades
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                        <p className="text-lg font-bold text-foreground">
                          {rig.improvements.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Priority Alert */}
                  {priorityStatus === "overdue" && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-red-400 font-medium">
                          OVERDUE ITEMS - Sofortige Maßnahmen erforderlich!
                        </span>
                      </div>
                    </div>
                  )}
                  {priorityStatus === "due-soon" && (
                    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-orange-400 font-medium">
                          Items fällig innerhalb 7 Tagen
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legende */}
        <Card className="border-blue-500/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Flag className="h-5 w-5" />
              Prioritäts-Legende
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500/50 bg-green-500/10" />
                <span className="text-sm text-muted-foreground">
                  OK - Alles gut
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-yellow-500/10" />
                <span className="text-sm text-muted-foreground">
                  Upcoming (30 Tage)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-orange-500/50 bg-orange-500/10" />
                <span className="text-sm text-muted-foreground">
                  Fällig (7 Tage)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-red-500/50 bg-red-500/20" />
                <span className="text-sm text-muted-foreground">OVERDUE!</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      {selectedRig && (
        <Dialog open={!!selectedRig} onOpenChange={() => setSelectedRig(null)}>
          <DialogContent className="min-w-[1200px] w-[min(1400px,95vw)] max-h-[90vh] overflow-hidden bg-card border-border">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Building2 className="h-6 w-6 text-blue-400 flex-shrink-0" />
                  <DialogTitle className="text-xl text-foreground font-semibold truncate">
                    {selectedRig.name}
                  </DialogTitle>
                  <span className="text-muted-foreground flex-shrink-0">•</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {selectedRig.location}
                  </span>
                  <span className="text-muted-foreground flex-shrink-0">•</span>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {selectedRig.region}
                  </span>
                  <Badge
                    className={`${getContractStatusColor(selectedRig.contractStatus)} ml-1 flex-shrink-0`}
                  >
                    {selectedRig.contractStatus}
                  </Badge>
                </div>
                {!isEditingGeneral && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsEditingGeneral(true);
                      setEditedRig({
                        operator: selectedRig.operator,
                        dayRate: selectedRig.dayRate,
                        contractEndDate: selectedRig.contractEndDate,
                        location: selectedRig.location,
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                )}
              </div>
            </DialogHeader>

            <Tabs
              defaultValue="info"
              className="w-full flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-5 gap-1">
                <TabsTrigger value="info" className="text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Allgemein
                </TabsTrigger>
                <TabsTrigger value="inspections" className="text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Inspektionen
                </TabsTrigger>
                <TabsTrigger value="issues" className="text-sm">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Risiken
                </TabsTrigger>
                <TabsTrigger value="improvements" className="text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrades
                </TabsTrigger>
                <TabsTrigger value="meeting" className="text-sm">
                  <Presentation className="h-4 w-4 mr-2" />
                  Meeting
                </TabsTrigger>
              </TabsList>

              {/* Tab: Allgemeine Infos */}
              <TabsContent value="info" className="mt-4 overflow-hidden flex-1">
                {/* Save/Cancel Buttons für Edit-Modus */}
                {isEditingGeneral && (
                  <div className="flex gap-2 justify-end mb-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingGeneral(false);
                        setEditedRig({});
                      }}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveGeneralInfo}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                )}

                {/* 2-Spalten-Layout */}
                <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 h-full overflow-hidden">
                  {/* === LINKE SPALTE (60%) === */}
                  <div className="flex flex-col gap-4 overflow-hidden min-w-0">
                    {/* Vertragsinformationen als 2x2 Grid */}
                    <Card className="bg-background border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Vertragsinformationen
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Row 1, Col 1: Status */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Status
                            </p>
                            <Badge
                              className={getContractStatusColor(
                                selectedRig.contractStatus,
                              )}
                            >
                              {selectedRig.contractStatus}
                            </Badge>
                          </div>

                          {/* Row 1, Col 2: Vertragsende */}
                          {(selectedRig.contractEndDate ||
                            isEditingGeneral) && (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Vertragsende
                              </Label>
                              {isEditingGeneral ? (
                                <Input
                                  type="date"
                                  value={editedRig.contractEndDate || ""}
                                  onChange={(e) =>
                                    setEditedRig({
                                      ...editedRig,
                                      contractEndDate: e.target.value,
                                    })
                                  }
                                  className="bg-background border-border text-foreground h-8"
                                />
                              ) : (
                                <p className="text-sm text-foreground font-medium">
                                  {selectedRig.contractEndDate
                                    ? new Date(
                                        selectedRig.contractEndDate,
                                      ).toLocaleDateString("de-DE")
                                    : "-"}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Row 2, Col 1: Operator */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Operator
                            </Label>
                            {isEditingGeneral ? (
                              <Input
                                value={editedRig.operator || ""}
                                onChange={(e) =>
                                  setEditedRig({
                                    ...editedRig,
                                    operator: e.target.value,
                                  })
                                }
                                className="bg-background border-border text-foreground h-8"
                                placeholder="z.B. PDO"
                              />
                            ) : (
                              <p className="text-sm text-foreground font-medium truncate">
                                {selectedRig.operator || "N/A"}
                              </p>
                            )}
                          </div>

                          {/* Row 2, Col 2: Day Rate */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Day Rate
                            </Label>
                            {isEditingGeneral ? (
                              <Input
                                type="number"
                                value={editedRig.dayRate || 0}
                                onChange={(e) =>
                                  setEditedRig({
                                    ...editedRig,
                                    dayRate: Number(e.target.value),
                                  })
                                }
                                className="bg-background border-border text-foreground h-8"
                                placeholder="28000"
                              />
                            ) : (
                              selectedRig.dayRate && (
                                <p className="text-sm text-foreground font-medium flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />$
                                  {selectedRig.dayRate.toLocaleString()}/Tag
                                </p>
                              )
                            )}
                          </div>

                          {/* Row 3: Standort (full width) */}
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Standort
                            </Label>
                            {isEditingGeneral ? (
                              <Input
                                value={editedRig.location || ""}
                                onChange={(e) =>
                                  setEditedRig({
                                    ...editedRig,
                                    location: e.target.value,
                                  })
                                }
                                className="bg-background border-border text-foreground h-8"
                                placeholder="z.B. Fahud Field"
                              />
                            ) : (
                              <p className="text-sm text-foreground font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {selectedRig.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notizen-Liste (scrollable) */}
                    <Card className="bg-background border-border flex-1 overflow-hidden flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Notizen ({selectedRig.generalInfo?.length || 0})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto pr-2">
                        {selectedRig.generalInfo &&
                        selectedRig.generalInfo.length > 0 ? (
                          <div className="space-y-2">
                            {selectedRig.generalInfo
                              .sort((a, b) => {
                                if (a.deadline && !b.deadline) return -1;
                                if (!a.deadline && b.deadline) return 1;
                                if (a.deadline && b.deadline) {
                                  return (
                                    new Date(a.deadline).getTime() -
                                    new Date(b.deadline).getTime()
                                  );
                                }
                                return (
                                  new Date(b.createdDate).getTime() -
                                  new Date(a.createdDate).getTime()
                                );
                              })
                              .map((info) => {
                                const hasDeadline = !!info.deadline;
                                const daysUntil = hasDeadline
                                  ? Math.ceil(
                                      (new Date(info.deadline!).getTime() -
                                        new Date().getTime()) /
                                        (1000 * 60 * 60 * 24),
                                    )
                                  : null;

                                // Farbcodierung nach Dringlichkeit
                                let borderColor = "border-border";
                                let bgColor = "bg-muted";
                                let colorIndicator = "bg-muted-foreground"; // Default: Grau

                                if (daysUntil !== null) {
                                  if (daysUntil < 0) {
                                    // Überfällig: Rot
                                    borderColor = "border-red-500/50";
                                    bgColor = "bg-red-500/5";
                                    colorIndicator = "bg-red-500";
                                  } else if (daysUntil <= 30) {
                                    // < 30 Tage: Rot
                                    borderColor = "border-red-500/50";
                                    bgColor = "bg-red-500/5";
                                    colorIndicator = "bg-red-500";
                                  } else if (daysUntil <= 90) {
                                    // 30-90 Tage: Gelb
                                    borderColor = "border-yellow-500/50";
                                    bgColor = "bg-yellow-500/5";
                                    colorIndicator = "bg-yellow-500";
                                  } else {
                                    // > 90 Tage: Grün
                                    borderColor = "border-green-500/50";
                                    bgColor = "bg-green-500/5";
                                    colorIndicator = "bg-green-500";
                                  }
                                }

                                const isEditing = editingInfoId === info.id;

                                return (
                                  <div
                                    key={info.id}
                                    className={`relative border ${borderColor} ${bgColor} rounded-lg overflow-hidden`}
                                  >
                                    {/* Farbbalken links (4px) */}
                                    <div
                                      className={`absolute left-0 top-0 bottom-0 w-1 ${colorIndicator}`}
                                    ></div>

                                    <div className="pl-4 pr-3 py-3">
                                      {isEditing ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editedInfo.description || ""}
                                            onChange={(e) =>
                                              setEditedInfo({
                                                ...editedInfo,
                                                description: e.target.value,
                                              })
                                            }
                                            className="bg-background border-border text-foreground resize-none text-sm"
                                            rows={2}
                                          />
                                          <Input
                                            type="date"
                                            value={editedInfo.deadline || ""}
                                            onChange={(e) =>
                                              setEditedInfo({
                                                ...editedInfo,
                                                deadline: e.target.value,
                                              })
                                            }
                                            className="bg-background border-border text-foreground h-8"
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingInfoId(null);
                                                setEditedInfo({});
                                              }}
                                              disabled={isSaving}
                                              className="border-border h-8"
                                            >
                                              Abbrechen
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={handleSaveEditedInfo}
                                              disabled={isSaving}
                                              className="bg-green-600 hover:bg-green-700 h-8"
                                            >
                                              {isSaving ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Speichere...
                                                </>
                                              ) : (
                                                <>
                                                  <Save className="h-4 w-4 mr-2" />
                                                  Speichern
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-foreground text-sm leading-relaxed mb-2">
                                              {info.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                              {hasDeadline && (
                                                <span
                                                  className={`flex items-center gap-1 font-medium ${
                                                    daysUntil !== null &&
                                                    daysUntil < 0
                                                      ? "text-red-400"
                                                      : daysUntil !== null &&
                                                          daysUntil <= 30
                                                        ? "text-red-400"
                                                        : daysUntil !== null &&
                                                            daysUntil <= 90
                                                          ? "text-yellow-400"
                                                          : "text-green-400"
                                                  }`}
                                                >
                                                  <Calendar className="h-3 w-3" />
                                                  {new Date(
                                                    info.deadline!,
                                                  ).toLocaleDateString("de-DE")}
                                                  {daysUntil !== null && (
                                                    <span className="ml-1">
                                                      (
                                                      {daysUntil < 0
                                                        ? `${Math.abs(daysUntil)} Tage überfällig!`
                                                        : `noch ${daysUntil} Tage`}
                                                      )
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                              <span className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {new Date(
                                                  info.createdDate,
                                                ).toLocaleDateString("de-DE")}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                handleEditGeneralInfo(info)
                                              }
                                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8 p-0"
                                              aria-label="Notiz bearbeiten"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                handleDeleteGeneralInfo(info.id)
                                              }
                                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                              aria-label="Notiz löschen"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground text-sm py-4">
                            Keine Notizen vorhanden
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* === RECHTE SPALTE (40%) === */}
                  <div className="flex flex-col gap-4 self-start min-w-0">
                    {/* Zertifizierungen - kompakte Liste */}
                    <Card className="bg-background border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-400" />
                            Zertifizierungen
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                          >
                            + Neu
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedRig.certifications.length > 0 ? (
                          <div className="space-y-1.5">
                            {selectedRig.certifications.map((cert, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-3 py-2 bg-muted rounded border border-border/50 hover:border-blue-500/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                                  <span className="text-sm text-foreground truncate">
                                    {cert}
                                  </span>
                                </div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  Gültig
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground text-sm py-3">
                            Keine Zertifizierungen
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Neue Notiz hinzufügen - kompakt */}
                    <Card className="bg-background border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground flex items-center gap-2">
                          <Plus className="h-4 w-4 text-blue-400" />
                          Neue Notiz
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Notiz eingeben..."
                          value={newGeneralInfo.description}
                          onChange={(e) =>
                            setNewGeneralInfo({
                              ...newGeneralInfo,
                              description: e.target.value,
                            })
                          }
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={newGeneralInfo.deadline}
                            onChange={(e) =>
                              setNewGeneralInfo({
                                ...newGeneralInfo,
                                deadline: e.target.value,
                              })
                            }
                            placeholder="Deadline (optional)"
                            className="bg-background border-border text-foreground flex-1 h-9"
                          />
                          <Button
                            onClick={handleAddGeneralInfo}
                            disabled={!newGeneralInfo.description}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 h-9"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Hinzufügen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Inspektionen */}
              <TabsContent value="inspections" className="space-y-3 mt-4">
                <div className="flex justify-end mb-3">
                  <Button
                    size="sm"
                    onClick={() => setIsAddInspectionOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Inspektion hinzufügen
                  </Button>
                </div>
                {selectedRig.inspections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Inspektionen geplant
                  </p>
                ) : (
                  selectedRig.inspections.map((inspection) => {
                    const daysUntil = getDaysUntil(inspection.dueDate);
                    return (
                      <Card
                        key={inspection.id}
                        className={`bg-background border-2 ${
                          inspection.status === "overdue"
                            ? "border-red-500/50"
                            : "border-border"
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-foreground font-medium">
                                {inspection.description}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getInspectionStatusColor(
                                  inspection.status,
                                )}
                              >
                                {inspection.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "inspection",
                                    id: inspection.id,
                                    label: inspection.description,
                                  })
                                }
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Typ: {inspection.type}</p>
                            <p>
                              Fällig:{" "}
                              {new Date(inspection.dueDate).toLocaleDateString(
                                "de-DE",
                              )}
                            </p>
                            <p>Verantwortlich: {inspection.responsible}</p>
                            {daysUntil !== null &&
                              inspection.status !== "completed" && (
                                <p className="text-xs text-yellow-400 font-medium mt-1">
                                  {daysUntil < 0
                                    ? `${Math.abs(daysUntil)} Tage überfällig`
                                    : `Noch ${daysUntil} Tage`}
                                </p>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Tab: Issues */}
              <TabsContent value="issues" className="space-y-3 mt-4">
                <div className="flex justify-end mb-3">
                  <Button
                    size="sm"
                    onClick={() => setIsAddIssueOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Issue hinzufügen
                  </Button>
                </div>
                {selectedRig.issues.filter((i) => i.status !== "closed")
                  .length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine offenen Issues
                  </p>
                ) : (
                  selectedRig.issues
                    .filter((i) => i.status !== "closed")
                    .map((issue) => (
                      <Card
                        key={issue.id}
                        className={`bg-background border-2 ${
                          issue.severity === "critical"
                            ? "border-red-500/50"
                            : "border-border"
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-foreground font-medium">
                                {issue.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getSeverityColor(issue.severity)}
                              >
                                {issue.severity}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "issue",
                                    id: issue.id,
                                    label: issue.description,
                                  })
                                }
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Kategorie: {issue.category}</p>
                            <p>Severity: {issue.severity}</p>
                            <p>Status: {issue.status}</p>
                            {issue.dueDate && (
                              <p>
                                Fällig:{" "}
                                {new Date(issue.dueDate).toLocaleDateString(
                                  "de-DE",
                                )}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </TabsContent>

              {/* Tab: Verbesserungen */}
              <TabsContent value="improvements" className="space-y-3 mt-4">
                <div className="flex justify-end mb-3">
                  <Button
                    size="sm"
                    onClick={() => setIsAddImprovementOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upgrade hinzufügen
                  </Button>
                </div>
                {selectedRig.improvements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Verbesserungen geplant
                  </p>
                ) : (
                  selectedRig.improvements.map((improvement) => (
                    <Card
                      key={improvement.id}
                      className="bg-background border-border"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-foreground font-medium">
                              {improvement.description}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getImprovementPriorityColor(
                                improvement.priority,
                              )}
                            >
                              {improvement.priority}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDeleteConfirm({
                                  type: "improvement",
                                  id: improvement.id,
                                  label: improvement.description,
                                })
                              }
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground">Kategorie</p>
                            <p className="text-foreground">
                              {improvement.category}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="text-foreground">
                              {improvement.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Kosten</p>
                            <p className="text-foreground">
                              ${improvement.estimatedCost.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Revenue Impact
                            </p>
                            <p className="text-green-400 text-xs">
                              {improvement.potentialRevenue}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Tab: Meeting-Übersicht */}
              <TabsContent value="meeting" className="space-y-3 mt-4">
                <Card className="bg-background border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      <Presentation className="h-5 w-5 text-purple-400" />
                      Meeting-Übersicht für {selectedRig.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Zusammenfassung für Management-Meeting (
                      {new Date().toLocaleDateString("de-DE")})
                    </p>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono p-4 bg-muted rounded-lg border border-border/50 max-h-[600px] overflow-y-auto">
                      {generateMeetingOverview([selectedRig])}
                    </pre>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            generateMeetingOverview([selectedRig]),
                          );
                          toast({
                            variant: "success" as const,
                            title: "Kopiert",
                            description:
                              "Meeting-Übersicht wurde in die Zwischenablage kopiert",
                          });
                        }}
                        className="border-border"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        In Zwischenablage kopieren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Inspection Dialog */}
      <Dialog open={isAddInspectionOpen} onOpenChange={setIsAddInspectionOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Neue Inspektion hinzufügen
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fügen Sie eine neue Inspektion für {selectedRig?.name} hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="insp-type" className="text-foreground">
                Typ
              </Label>
              <Select
                value={newInspection.type}
                onValueChange={(v) =>
                  setNewInspection({
                    ...newInspection,
                    type: v as
                      | "statutory"
                      | "internal"
                      | "client"
                      | "certification",
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="statutory">Statutory</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insp-desc" className="text-foreground">
                Beschreibung
              </Label>
              <Textarea
                id="insp-desc"
                value={newInspection.description}
                onChange={(e) =>
                  setNewInspection({
                    ...newInspection,
                    description: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="z.B. BOP Stack 5-Year Inspection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insp-date" className="text-foreground">
                Due Date
              </Label>
              <Input
                id="insp-date"
                type="date"
                value={newInspection.dueDate}
                onChange={(e) =>
                  setNewInspection({
                    ...newInspection,
                    dueDate: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insp-resp" className="text-foreground">
                Verantwortlich
              </Label>
              <Input
                id="insp-resp"
                value={newInspection.responsible}
                onChange={(e) =>
                  setNewInspection({
                    ...newInspection,
                    responsible: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="z.B. Rig Mechanic"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddInspectionOpen(false)}
              className="border-border"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleAddInspection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Issue Dialog */}
      <Dialog open={isAddIssueOpen} onOpenChange={setIsAddIssueOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Neues Issue hinzufügen
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fügen Sie ein neues Risiko/Issue für {selectedRig?.name} hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-cat" className="text-foreground">
                  Kategorie
                </Label>
                <Select
                  value={newIssue.category}
                  onValueChange={(v) =>
                    setNewIssue({
                      ...newIssue,
                      category: v as
                        | "safety"
                        | "technical"
                        | "compliance"
                        | "commercial",
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-sev" className="text-foreground">
                  Severity
                </Label>
                <Select
                  value={newIssue.severity}
                  onValueChange={(v) =>
                    setNewIssue({
                      ...newIssue,
                      severity: v as "low" | "medium" | "high" | "critical",
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Severity auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-desc" className="text-foreground">
                Beschreibung
              </Label>
              <Textarea
                id="issue-desc"
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, description: e.target.value })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="Beschreiben Sie das Issue..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-date" className="text-foreground">
                Due Date (optional)
              </Label>
              <Input
                id="issue-date"
                type="date"
                value={newIssue.dueDate}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, dueDate: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddIssueOpen(false)}
              className="border-border"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleAddIssue}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Improvement Dialog */}
      <Dialog
        open={isAddImprovementOpen}
        onOpenChange={setIsAddImprovementOpen}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Neues Upgrade hinzufügen
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fügen Sie eine neue Verbesserung für {selectedRig?.name} hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imp-desc" className="text-foreground">
                Beschreibung
              </Label>
              <Textarea
                id="imp-desc"
                value={newImprovement.description}
                onChange={(e) =>
                  setNewImprovement({
                    ...newImprovement,
                    description: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="z.B. Install BOP Stack Upgrade"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imp-cat" className="text-foreground">
                  Kategorie
                </Label>
                <Select
                  value={newImprovement.category}
                  onValueChange={(v) =>
                    setNewImprovement({
                      ...newImprovement,
                      category: v as
                        | "equipment"
                        | "certification"
                        | "compliance"
                        | "efficiency",
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imp-prio" className="text-foreground">
                  Priorität
                </Label>
                <Select
                  value={newImprovement.priority}
                  onValueChange={(v) =>
                    setNewImprovement({
                      ...newImprovement,
                      priority: v as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Priorität auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-cost" className="text-foreground">
                Geschätzte Kosten ($)
              </Label>
              <Input
                id="imp-cost"
                type="number"
                value={newImprovement.estimatedCost}
                onChange={(e) =>
                  setNewImprovement({
                    ...newImprovement,
                    estimatedCost: Number(e.target.value),
                  })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-rev" className="text-foreground">
                Revenue Impact
              </Label>
              <Input
                id="imp-rev"
                value={newImprovement.potentialRevenue}
                onChange={(e) =>
                  setNewImprovement({
                    ...newImprovement,
                    potentialRevenue: e.target.value,
                  })
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                placeholder="z.B. +$5k day rate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddImprovementOpen(false)}
              className="border-border"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleAddImprovement}
              className="bg-green-600 hover:bg-green-700"
            >
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting-Übersicht Dialog */}
      <Dialog open={showMeetingOverview} onOpenChange={setShowMeetingOverview}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground flex items-center gap-2">
              <Presentation className="h-6 w-6 text-purple-400" />
              Meeting-Übersicht
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {overviewForAll
                ? `Übersicht aller ${filteredRigs.length} Anlagen`
                : `Übersicht für ${selectedRig?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="bg-background rounded-lg p-6 border border-border">
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {overviewForAll
                  ? generateMeetingOverview(filteredRigs)
                  : selectedRig
                    ? generateMeetingOverview([selectedRig])
                    : "Keine Anlage ausgewählt"}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                const text = overviewForAll
                  ? generateMeetingOverview(filteredRigs)
                  : selectedRig
                    ? generateMeetingOverview([selectedRig])
                    : "";
                navigator.clipboard.writeText(text);
              }}
              className="border-border"
            >
              📋 In Zwischenablage kopieren
            </Button>
            <Button
              onClick={() => setShowMeetingOverview(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anlage hinzufügen Dialog */}
      <Dialog open={isAddRigOpen} onOpenChange={setIsAddRigOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-green-400" />
              Neue Anlage hinzufügen
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fügen Sie eine neue Bohranlage zum System hinzu. Felder mit * sind
              Pflichtfelder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Name & Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Anlagenname *
                </Label>
                <Input
                  value={newRig.name}
                  onChange={(e) =>
                    setNewRig({ ...newRig, name: e.target.value })
                  }
                  placeholder="z.B. T700"
                />
              </div>

              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Region *
                </Label>
                <Select
                  value={newRig.region}
                  onValueChange={(value: "Oman" | "Pakistan") =>
                    setNewRig({ ...newRig, region: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
                    <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Standort */}
            <div>
              <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Standort *
              </Label>
              <Input
                value={newRig.location}
                onChange={(e) =>
                  setNewRig({ ...newRig, location: e.target.value })
                }
                placeholder="z.B. Fahud Field, Muscat Yard"
              />
            </div>

            {/* Vertragsstatus & Operator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Vertragsstatus
                </Label>
                <Select
                  value={newRig.contractStatus}
                  onValueChange={(
                    value: "active" | "idle" | "standby" | "maintenance",
                  ) => setNewRig({ ...newRig, contractStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">✅ Active</SelectItem>
                    <SelectItem value="idle">⏸️ Idle</SelectItem>
                    <SelectItem value="standby">⏳ Standby</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  Operator
                </Label>
                <Input
                  value={newRig.operator}
                  onChange={(e) =>
                    setNewRig({ ...newRig, operator: e.target.value })
                  }
                  placeholder="z.B. PDO, OGDCL"
                />
              </div>
            </div>

            {/* Day Rate & Vertragsende */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Day Rate ($)
                </Label>
                <Input
                  type="number"
                  value={newRig.dayRate || ""}
                  onChange={(e) =>
                    setNewRig({ ...newRig, dayRate: Number(e.target.value) })
                  }
                  placeholder="z.B. 28000"
                />
              </div>

              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Vertragsende
                </Label>
                <Input
                  type="date"
                  value={newRig.contractEndDate}
                  onChange={(e) =>
                    setNewRig({ ...newRig, contractEndDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddRigOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAddRig}
              disabled={!newRig.name || !newRig.location}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Anlage hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie{" "}
              {deleteConfirm?.type === "inspection"
                ? "diese Inspektion"
                : deleteConfirm?.type === "issue"
                  ? "dieses Problem"
                  : "diese Verbesserung"}{" "}
              wirklich löschen?
              {deleteConfirm?.label && (
                <span className="block mt-1 font-medium text-foreground">
                  „{deleteConfirm.label}"
                </span>
              )}
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "inspection")
                  handleDeleteInspection(deleteConfirm.id);
                else if (deleteConfirm.type === "issue")
                  handleDeleteIssue(deleteConfirm.id);
                else handleDeleteImprovement(deleteConfirm.id);
                setDeleteConfirm(null);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
