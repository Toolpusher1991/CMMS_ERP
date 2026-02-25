import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  Shield,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
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
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Download,
  Upload,
  CheckSquare,
  Square,
  X,
  Filter,
  ArrowUpDown,
  Wrench,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import * as assetIntegrityApi from "@/services/assetIntegrityApi";
import * as XLSX from "xlsx";
import type {
  Inspection,
  Issue,
  Improvement,
  GeneralInfo,
  AssetRig as Rig,
} from "@/components/asset-integrity/types";
import {
  getDaysUntil,
  getRigPriorityStatus,
  getContractStatusColor,
  getInspectionStatusColor,
} from "@/components/asset-integrity/utils";

// Equipment Master Database – Komplette Flotte
const initialRigs: Rig[] = [
  {
    id: "t51",
    name: "T-51",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "EMSCO C-3 III",
    hpRating: "3000 HP",
    year: 1980,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t91",
    name: "T-91",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Stationary",
    hpRating: "2000 HP",
    year: 2014,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t92",
    name: "T-92",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Stationary",
    hpRating: "2000 HP",
    year: 2014,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t93",
    name: "T-93",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Stationary",
    hpRating: "2000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t94",
    name: "T-94",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Stationary",
    hpRating: "2000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t95",
    name: "T-95",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Stationary",
    hpRating: "2000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t144",
    name: "T-144",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1250 HP Mobile",
    hpRating: "1250 HP",
    year: 2023,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t145",
    name: "T-145",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1250 HP Mobile",
    hpRating: "1250 HP",
    year: 2023,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t146",
    name: "T-146",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1250 HP Mobile",
    hpRating: "1250 HP",
    year: 2024,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t147",
    name: "T-147",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1250 HP Mobile",
    hpRating: "1250 HP",
    year: 2024,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t801",
    name: "T-801",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "800 HP Highly Mobile",
    hpRating: "800 HP",
    year: 1992,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t826",
    name: "T-826",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "800 HP CARDWELL",
    hpRating: "800 HP",
    year: 1988,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t849",
    name: "T-849",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1500 HP Mobile",
    hpRating: "1500 HP",
    year: 2010,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t853",
    name: "T-853",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "800 HP Highly Mobile",
    hpRating: "800 HP",
    year: 1995,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t858",
    name: "T-858",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1500 HP Mobile",
    hpRating: "1500 HP",
    year: 2010,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t859",
    name: "T-859",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1500 HP Mobile",
    hpRating: "1500 HP",
    year: 2010,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t867",
    name: "T-867",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Land Rig",
    hpRating: "2000 HP",
    year: 2014,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t872",
    name: "T-872",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "800 HP Highly Mobile",
    hpRating: "800 HP",
    year: 1992,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t889",
    name: "T-889",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "2000 HP Land Rig",
    hpRating: "2000 HP",
    year: 2006,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t895",
    name: "T-895",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1000 HP Mobile",
    hpRating: "1000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t896",
    name: "T-896",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1000 HP Mobile",
    hpRating: "1000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t897",
    name: "T-897",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1000 HP Mobile",
    hpRating: "1000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t898",
    name: "T-898",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1000 HP Mobile",
    hpRating: "1000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
  {
    id: "t899",
    name: "T-899",
    region: "Oman",
    contractStatus: "stacked",
    location: "",
    rigType: "1000 HP Mobile",
    hpRating: "1000 HP",
    year: 2015,
    certifications: [],
    inspections: [],
    issues: [],
    improvements: [],
  },
];

export default function AssetIntegrityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query: asset integrity rigs
  const { data: rigsData } = useQuery({
    queryKey: queryKeys.assetRigs.list(),
    queryFn: async () => {
      // Clear stale localStorage backup that might contain old rigs (T700, T46, etc.)
      const backup = localStorage.getItem("asset-integrity-backup");
      if (backup) {
        try {
          const parsed = JSON.parse(backup);
          if (
            Array.isArray(parsed) &&
            parsed.some((r: { name?: string }) =>
              ["T700", "T46", "T203", "T208", "T207", "T92", "T350"].includes(
                r.name || "",
              ),
            )
          ) {
            localStorage.removeItem("asset-integrity-backup");
          }
        } catch {
          /* ignore parse errors */
        }
      }

      try {
        const apiRigs = await assetIntegrityApi.getAllRigs();
        if (Array.isArray(apiRigs) && apiRigs.length > 0) {
          const normalizedRigs = apiRigs.map(
            (
              rig: Partial<Rig> & {
                id: string;
                name: string;
                technicalSpecs?: string;
              },
            ) => {
              // Extract rigType/hpRating/year from technicalSpecs if available
              let techSpecs: {
                rigType?: string;
                hpRating?: string;
                year?: number;
              } = {};
              if (
                typeof rig.technicalSpecs === "string" &&
                rig.technicalSpecs.startsWith("{")
              ) {
                try {
                  techSpecs = JSON.parse(rig.technicalSpecs);
                } catch {
                  /* ignore */
                }
              }

              return {
                id: rig.id,
                name: rig.name,
                region: (rig.region as Rig["region"]) || "Oman",
                contractStatus:
                  (rig.contractStatus as Rig["contractStatus"]) || "stacked",
                contractEndDate: rig.contractEndDate,
                operator: rig.operator,
                location: rig.location || "",
                rigType: rig.rigType || techSpecs.rigType,
                hpRating: rig.hpRating || techSpecs.hpRating,
                year: rig.year || techSpecs.year,
                certifications: Array.isArray(rig.certifications)
                  ? rig.certifications
                  : [],
                generalInfo: Array.isArray(rig.generalInfo)
                  ? rig.generalInfo
                  : [],
                documents: Array.isArray((rig as Rig).documents)
                  ? (rig as Rig).documents
                  : [],
                inspections: Array.isArray(rig.inspections)
                  ? rig.inspections
                  : [],
                issues: Array.isArray(rig.issues) ? rig.issues : [],
                improvements: Array.isArray(rig.improvements)
                  ? rig.improvements
                  : [],
              };
            },
          ) as Rig[];
          localStorage.setItem(
            "asset-integrity-backup",
            JSON.stringify(normalizedRigs),
          );
          return normalizedRigs;
        }
      } catch (err) {
        console.warn("API nicht erreichbar, nutze localStorage-Fallback:", err);
      }
      // Fallback: localStorage, then initialRigs
      const cachedBackup = localStorage.getItem("asset-integrity-backup");
      if (cachedBackup) {
        return JSON.parse(cachedBackup) as Rig[];
      }
      return initialRigs;
    },
    staleTime: 5 * 60 * 1000,
  });
  const [rigs, setRigs] = useState<Rig[]>(initialRigs);

  // Sync React Query data into local state (rigs mutated locally before save)
  useEffect(() => {
    if (rigsData) setRigs(rigsData);
  }, [rigsData]);

  const [selectedRegion, setSelectedRegion] = useState<
    "Oman" | "Pakistan" | "all"
  >("all");
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);

  // UX States
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [rigSearchQuery, setRigSearchQuery] = useState("");

  // Bulk Selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedRigIds, setSelectedRigIds] = useState<Set<string>>(new Set());

  // Extended Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  // Delete Rig
  const [rigToDelete, setRigToDelete] = useState<Rig | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Excel Import
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    newRigs: Partial<Rig>[];
    duplicates: string[];
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspection Excel Import
  const [isInspectionImportOpen, setIsInspectionImportOpen] = useState(false);
  const [inspectionImportPreview, setInspectionImportPreview] = useState<{
    inspections: Omit<Inspection, "id">[];
    errors: string[];
  } | null>(null);
  const [isInspectionImporting, setIsInspectionImporting] = useState(false);
  const inspectionFileInputRef = useRef<HTMLInputElement>(null);

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
    contractStatus: "stacked" as "stacked" | "operational" | "overhaul",
    operator: "",
    location: "",
    contractEndDate: "",
    rigType: "",
    hpRating: "",
    year: 0,
  });

  // Auto-Save Logic
  const saveData = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save each rig to the backend API
      const updatePromises = rigs.map((rig) =>
        assetIntegrityApi
          .updateRig(rig.id, {
            region: rig.region,
            contractStatus: rig.contractStatus,
            location: rig.location,
            operator: rig.operator,
            contractEndDate: rig.contractEndDate,
            certifications: rig.certifications,
            generalInfo: rig.generalInfo,
            inspections: rig.inspections,
            issues: rig.issues,
            improvements: rig.improvements,
          })
          .catch((err) => {
            console.warn(`API-Update für ${rig.name} fehlgeschlagen:`, err);
            return null; // Don't block other saves
          }),
      );
      await Promise.all(updatePromises);

      // Also save to localStorage as backup
      localStorage.setItem("asset-integrity-backup", JSON.stringify(rigs));

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Sync React Query cache
      queryClient.setQueryData(queryKeys.assetRigs.list(), rigs);

      toast({
        variant: "success" as const,
        title: "Gespeichert",
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
  }, [rigs, toast, queryClient]);

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

  // Data loading is now handled by React Query (useQuery above)

  // Filter rigs by region
  const regionFilteredRigs =
    selectedRegion === "all"
      ? rigs
      : rigs.filter((rig) => rig.region === selectedRegion);

  // Filter by status
  const statusFilteredRigs =
    statusFilter === "all"
      ? regionFilteredRigs
      : regionFilteredRigs.filter((rig) => rig.contractStatus === statusFilter);

  // Filter by type
  const typeFilteredRigs =
    typeFilter === "all"
      ? statusFilteredRigs
      : statusFilteredRigs.filter((rig) => rig.rigType === typeFilter);

  // Filter by search query
  const searchFilteredRigs = rigSearchQuery
    ? typeFilteredRigs.filter(
        (rig) =>
          rig.name.toLowerCase().includes(rigSearchQuery.toLowerCase()) ||
          rig.location.toLowerCase().includes(rigSearchQuery.toLowerCase()) ||
          (rig.operator?.toLowerCase().includes(rigSearchQuery.toLowerCase()) ??
            false) ||
          (rig.rigType?.toLowerCase().includes(rigSearchQuery.toLowerCase()) ??
            false),
      )
    : typeFilteredRigs;

  // Sort
  const filteredRigs = [...searchFilteredRigs].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "year-desc":
        return (b.year || 0) - (a.year || 0);
      case "year-asc":
        return (a.year || 0) - (b.year || 0);
      case "status":
        return a.contractStatus.localeCompare(b.contractStatus);
      default:
        return 0;
    }
  });

  // Get unique rig types for filter dropdown
  const rigTypes = [...new Set(rigs.map((r) => r.rigType).filter(Boolean))];

  // Calculate statistics
  const operationalRigs = filteredRigs.filter(
    (rig) => rig.contractStatus === "operational",
  ).length;
  const stackedRigs = filteredRigs.filter(
    (rig) => rig.contractStatus === "stacked",
  ).length;
  const overhaulRigs = filteredRigs.filter(
    (rig) => rig.contractStatus === "overhaul",
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

  const handleAddRig = async () => {
    if (!newRig.name || !newRig.location) return;

    try {
      // Create rig via API first
      const apiRig = await assetIntegrityApi.createRig({
        name: newRig.name,
        region: newRig.region,
        contractStatus: newRig.contractStatus,
        operator: newRig.operator || undefined,
        location: newRig.location,
        contractEndDate: newRig.contractEndDate || undefined,
        rigType: newRig.rigType || undefined,
        hpRating: newRig.hpRating || undefined,
        year: newRig.year > 0 ? newRig.year : undefined,
        certifications: [],
        inspections: [],
        issues: [],
        improvements: [],
      });

      const rig: Rig = {
        id: apiRig.id || Date.now().toString(),
        name: newRig.name,
        region: newRig.region,
        contractStatus: newRig.contractStatus,
        operator: newRig.operator || undefined,
        location: newRig.location,
        contractEndDate: newRig.contractEndDate || undefined,
        rigType: newRig.rigType || undefined,
        hpRating: newRig.hpRating || undefined,
        year: newRig.year > 0 ? newRig.year : undefined,
        certifications: [],
        generalInfo: [],
        inspections: [],
        issues: [],
        improvements: [],
      };

      setRigs([...rigs, rig]);
      setHasUnsavedChanges(true);
    } catch (err) {
      console.warn("API-Erstellung fehlgeschlagen, nutze lokale ID:", err);
      // Fallback: create locally
      const rig: Rig = {
        id: Date.now().toString(),
        name: newRig.name,
        region: newRig.region,
        contractStatus: newRig.contractStatus,
        operator: newRig.operator || undefined,
        location: newRig.location,
        contractEndDate: newRig.contractEndDate || undefined,
        rigType: newRig.rigType || undefined,
        hpRating: newRig.hpRating || undefined,
        year: newRig.year > 0 ? newRig.year : undefined,
        certifications: [],
        generalInfo: [],
        inspections: [],
        issues: [],
        improvements: [],
      };

      setRigs([...rigs, rig]);
      setHasUnsavedChanges(true);
    }

    setNewRig({
      name: "",
      region: "Oman",
      contractStatus: "stacked",
      operator: "",
      location: "",
      contractEndDate: "",
      rigType: "",
      hpRating: "",
      year: 0,
    });
    setIsAddRigOpen(false);
    toast({
      variant: "success" as const,
      title: "Anlage erstellt",
      description: `${newRig.name} wurde erfolgreich hinzugefügt`,
      duration: 3000,
    });
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

  // Delete a single rig
  const handleDeleteRig = async (rig: Rig) => {
    try {
      await assetIntegrityApi.deleteRig(rig.id);
    } catch (err) {
      console.warn("API-Löschung fehlgeschlagen:", err);
    }
    const updated = rigs.filter((r) => r.id !== rig.id);
    setRigs(updated);
    setRigToDelete(null);
    setHasUnsavedChanges(true);
    if (selectedRig?.id === rig.id) setSelectedRig(null);
    toast({
      variant: "success" as const,
      title: "Anlage gelöscht",
      description: `${rig.name} wurde entfernt`,
      duration: 3000,
    });
  };

  // Bulk delete selected rigs
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedRigIds);
    const names = rigs
      .filter((r) => idsToDelete.includes(r.id))
      .map((r) => r.name);

    for (const id of idsToDelete) {
      try {
        await assetIntegrityApi.deleteRig(id);
      } catch (err) {
        console.warn(`API-Löschung für ${id} fehlgeschlagen:`, err);
      }
    }

    const updated = rigs.filter((r) => !idsToDelete.includes(r.id));
    setRigs(updated);
    setSelectedRigIds(new Set());
    setBulkMode(false);
    setBulkDeleteOpen(false);
    setHasUnsavedChanges(true);
    if (selectedRig && idsToDelete.includes(selectedRig.id))
      setSelectedRig(null);
    toast({
      variant: "success" as const,
      title: `${names.length} Anlagen gelöscht`,
      description: names.join(", "),
      duration: 4000,
    });
  };

  // Toggle rig selection for bulk operations
  const toggleRigSelection = (rigId: string) => {
    setSelectedRigIds((prev) => {
      const next = new Set(prev);
      if (next.has(rigId)) next.delete(rigId);
      else next.add(rigId);
      return next;
    });
  };

  // Excel Import handler
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const newRigsData: Partial<Rig>[] = [];
        const duplicates: string[] = [];
        const errors: string[] = [];

        rows.forEach((row, idx) => {
          const name = String(
            row["Name"] || row["name"] || row["Rig"] || row["rig"] || "",
          ).trim();
          if (!name) {
            errors.push(`Zeile ${idx + 2}: Kein Name`);
            return;
          }
          if (rigs.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
            duplicates.push(name);
            return;
          }

          const region = String(row["Region"] || row["region"] || "Oman");
          const status = String(
            row["Status"] || row["contractStatus"] || "stacked",
          ).toLowerCase();
          const location = String(
            row["Standort"] || row["Location"] || row["location"] || "",
          );
          const operator = String(row["Operator"] || row["operator"] || "");
          const rigTypeVal = String(
            row["Typ"] || row["Type"] || row["rigType"] || "",
          );
          const hpRatingVal = String(
            row["HP"] || row["hpRating"] || row["HP Rating"] || "",
          );
          const yearVal = Number(
            row["Jahr"] || row["Year"] || row["year"] || 0,
          );

          newRigsData.push({
            name,
            region: region.includes("Pakistan") ? "Pakistan" : "Oman",
            contractStatus: ([
              "stacked",
              "operational",
              "overhaul",
            ].includes(status)
              ? status
              : "stacked") as Rig["contractStatus"],
            location,
            operator: operator || undefined,
            rigType: rigTypeVal || undefined,
            hpRating: hpRatingVal || undefined,
            year: yearVal > 0 ? yearVal : undefined,
          });
        });

        setImportPreview({ newRigs: newRigsData, duplicates, errors });
        setIsImportOpen(true);
      } catch {
        toast({
          title: "Import-Fehler",
          description: "Die Datei konnte nicht gelesen werden",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Confirm Excel import
  const confirmImport = async () => {
    if (!importPreview) return;
    setIsImporting(true);

    const createdRigs: Rig[] = [];
    for (const partial of importPreview.newRigs) {
      const rig: Rig = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: partial.name || "Unbenannt",
        region: partial.region || "Oman",
        contractStatus: partial.contractStatus || "stacked",
        location: partial.location || "",
        operator: partial.operator,
        contractEndDate: partial.contractEndDate,
        rigType: partial.rigType,
        hpRating: partial.hpRating,
        year: partial.year,
        certifications: [],
        generalInfo: [],
        inspections: [],
        issues: [],
        improvements: [],
      };

      try {
        const apiRig = await assetIntegrityApi.createRig(rig);
        rig.id = apiRig.id || rig.id;
      } catch {
        // use local id
      }

      createdRigs.push(rig);
    }

    setRigs((prev) => [...prev, ...createdRigs]);
    setHasUnsavedChanges(true);
    setIsImporting(false);
    setIsImportOpen(false);
    setImportPreview(null);
    toast({
      variant: "success" as const,
      title: "Import erfolgreich",
      description: `${createdRigs.length} Anlagen importiert`,
      duration: 4000,
    });
  };

  // Inspection Excel Import handler
  const handleInspectionExcelImport = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRig) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const parsedInspections: Omit<Inspection, "id">[] = [];
        const errors: string[] = [];

        rows.forEach((row, idx) => {
          const description = String(
            row["Beschreibung"] ||
              row["Description"] ||
              row["description"] ||
              row["Inspektion"] ||
              row["Item"] ||
              row["item"] ||
              "",
          ).trim();
          if (!description) {
            errors.push(`Zeile ${idx + 2}: Keine Beschreibung`);
            return;
          }

          // Type mapping
          const rawType = String(
            row["Typ"] ||
              row["Type"] ||
              row["type"] ||
              row["Category"] ||
              row["category"] ||
              "internal",
          )
            .toLowerCase()
            .trim();
          let type: Inspection["type"] = "internal";
          if (
            rawType.includes("statutory") ||
            rawType.includes("gesetzlich") ||
            rawType.includes("behördlich")
          )
            type = "statutory";
          else if (
            rawType.includes("client") ||
            rawType.includes("kunde") ||
            rawType.includes("kundeninsp")
          )
            type = "client";
          else if (rawType.includes("cert") || rawType.includes("zertifiz"))
            type = "certification";
          else if (rawType.includes("intern")) type = "internal";

          // Due date parsing
          let dueDate = "";
          const rawDate =
            row["Fällig"] ||
            row["Due Date"] ||
            row["Due"] ||
            row["Datum"] ||
            row["Date"] ||
            row["due_date"] ||
            row["dueDate"] ||
            row["Fälligkeitsdatum"] ||
            "";
          if (rawDate) {
            if (typeof rawDate === "number") {
              // Excel serial date number
              const excelDate = new Date((rawDate - 25569) * 86400 * 1000);
              dueDate = excelDate.toISOString().split("T")[0];
            } else {
              const dateStr = String(rawDate).trim();
              // Try ISO format
              const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (isoMatch) {
                dueDate = dateStr.slice(0, 10);
              } else {
                // Try DD.MM.YYYY or DD/MM/YYYY
                const euMatch = dateStr.match(
                  /^(\d{1,2})[./](\d{1,2})[./](\d{4})/,
                );
                if (euMatch) {
                  dueDate = `${euMatch[3]}-${euMatch[2].padStart(2, "0")}-${euMatch[1].padStart(2, "0")}`;
                }
              }
            }
          }
          if (!dueDate) {
            // Default: 30 days from now
            const d = new Date();
            d.setDate(d.getDate() + 30);
            dueDate = d.toISOString().split("T")[0];
          }

          // Status mapping
          const rawStatus = String(row["Status"] || row["status"] || "")
            .toLowerCase()
            .trim();
          let status: Inspection["status"] = "upcoming";
          if (rawStatus.includes("overdue") || rawStatus.includes("überfällig"))
            status = "overdue";
          else if (
            rawStatus.includes("completed") ||
            rawStatus.includes("erledigt") ||
            rawStatus.includes("done") ||
            rawStatus.includes("abgeschlossen")
          )
            status = "completed";
          else if (rawStatus.includes("due") || rawStatus.includes("fällig"))
            status = "due";

          // Auto-detect overdue based on date if no status given
          if (!rawStatus && new Date(dueDate) < new Date()) {
            status = "overdue";
          }

          const responsible = String(
            row["Verantwortlich"] ||
              row["Responsible"] ||
              row["responsible"] ||
              row["Zuständig"] ||
              row["Assigned"] ||
              row["assigned"] ||
              "",
          ).trim();

          const completedDate =
            row["Abgeschlossen"] ||
            row["Completed Date"] ||
            row["completedDate"] ||
            "";
          let completedDateStr: string | undefined;
          if (completedDate) {
            if (typeof completedDate === "number") {
              completedDateStr = new Date(
                (completedDate - 25569) * 86400 * 1000,
              )
                .toISOString()
                .split("T")[0];
            } else {
              completedDateStr = String(completedDate).trim();
            }
          }

          parsedInspections.push({
            type,
            description,
            dueDate,
            status,
            responsible,
            ...(completedDateStr ? { completedDate: completedDateStr } : {}),
          });
        });

        if (parsedInspections.length === 0 && errors.length === 0) {
          errors.push("Keine gültigen Inspektionen in der Datei gefunden");
        }

        setInspectionImportPreview({ inspections: parsedInspections, errors });
        setIsInspectionImportOpen(true);
      } catch {
        toast({
          title: "Import-Fehler",
          description: "Die Excel-Datei konnte nicht gelesen werden",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if (inspectionFileInputRef.current)
      inspectionFileInputRef.current.value = "";
  };

  // Confirm inspection Excel import
  const confirmInspectionImport = () => {
    if (!inspectionImportPreview || !selectedRig) return;
    setIsInspectionImporting(true);

    const newInspections: Inspection[] =
      inspectionImportPreview.inspections.map((insp) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        ...insp,
      }));

    const updatedRigs = rigs.map((rig) =>
      rig.id === selectedRig.id
        ? { ...rig, inspections: [...rig.inspections, ...newInspections] }
        : rig,
    );

    setRigs(updatedRigs);
    setSelectedRig(updatedRigs.find((r) => r.id === selectedRig.id) || null);
    setHasUnsavedChanges(true);
    setIsInspectionImporting(false);
    setIsInspectionImportOpen(false);
    setInspectionImportPreview(null);
    toast({
      variant: "success" as const,
      title: "Import erfolgreich",
      description: `${newInspections.length} Inspektionen für ${selectedRig.name} importiert`,
      duration: 4000,
    });
  };

  // Download inspection template
  const downloadInspectionTemplate = () => {
    const templateData = [
      {
        Beschreibung: "BOP Stack 5-Year Inspection",
        Typ: "statutory",
        Fällig: "2026-06-15",
        Status: "upcoming",
        Verantwortlich: "Rig Mechanic",
      },
      {
        Beschreibung: "Crown Block Inspection",
        Typ: "internal",
        Fällig: "2026-04-01",
        Status: "",
        Verantwortlich: "Derrickman",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inspektionen");
    XLSX.writeFile(wb, "Inspektionen_Vorlage.xlsx");
  };

  // Export handler
  const handleExport = (format: "xlsx" | "csv") => {
    const exportData = filteredRigs.map((rig) => ({
      Name: rig.name,
      Region: rig.region,
      Status: rig.contractStatus,
      Standort: rig.location || "",
      Operator: rig.operator || "",
      Typ: rig.rigType || "",

      HP: rig.hpRating || "",
      Jahr: rig.year || "",
      Vertragsende: rig.contractEndDate || "",
      Inspektionen: rig.inspections.length,
      "Offene Issues": rig.issues.filter((i) => i.status !== "closed").length,
      Upgrades: rig.improvements.length,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anlagen");

    if (format === "xlsx") {
      XLSX.writeFile(
        wb,
        `Asset_Integrity_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } else {
      XLSX.writeFile(
        wb,
        `Asset_Integrity_Export_${new Date().toISOString().slice(0, 10)}.csv`,
        { bookType: "csv" },
      );
    }

    toast({
      variant: "success" as const,
      title: "Export erfolgreich",
      description: `${exportData.length} Anlagen als ${format.toUpperCase()} exportiert`,
      duration: 3000,
    });
  };

  // Get color for left card border based on status
  const getCardBorderColor = (rig: Rig) => {
    const priorityStatus = getRigPriorityStatus(rig);
    if (
      priorityStatus === "overdue" ||
      rig.issues.some((i) => i.severity === "critical" && i.status !== "closed")
    )
      return "border-l-red-500";
    if (rig.contractStatus === "overhaul") return "border-l-orange-500";
    if (rig.contractStatus === "operational") return "border-l-cyan-500";
    return "border-l-gray-500";
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
                Operational
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {operationalRigs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Im Einsatz
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stacked
              </CardTitle>
              <Building2 className="h-4 w-4 text-gray-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stackedRigs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Verfügbar
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overhaul
              </CardTitle>
              <Wrench className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {overhaulRigs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In Wartung
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

        {/* Filter & View Controls */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            {/* Row 1: Region + Search + View + Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Region Filter */}
              <div className="flex-1">
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
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Anlage suchen..."
                  value={rigSearchQuery}
                  onChange={(e) => setRigSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* View Toggle */}
              <div className="flex gap-1 border rounded-md p-1 self-start">
                <Button
                  size="sm"
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  className="h-8 w-8 p-0 touch-manipulation"
                  onClick={() => setViewMode("cards")}
                  title="Kartenansicht"
                  aria-label="Kartenansicht"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  className="h-8 w-8 p-0 touch-manipulation"
                  onClick={() => setViewMode("table")}
                  title="Tabellenansicht"
                  aria-label="Tabellenansicht"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Row 2: Extended Filters + Bulk + Import/Export */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="stacked">⏸️ Stacked</SelectItem>
                  <SelectItem value="operational">🟢 Operational</SelectItem>
                  <SelectItem value="overhaul">🔧 Overhaul</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              {rigTypes.length > 0 && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Wrench className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    {rigTypes.map((t) => (
                      <SelectItem key={t} value={t!}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-44">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sortierung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A → Z</SelectItem>
                  <SelectItem value="name-desc">Name Z → A</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {/* Bulk Select Toggle */}
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                className="touch-manipulation"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (bulkMode) setSelectedRigIds(new Set());
                }}
              >
                {bulkMode ? (
                  <CheckSquare className="h-4 w-4 mr-1.5" />
                ) : (
                  <Square className="h-4 w-4 mr-1.5" />
                )}
                Auswahl
              </Button>

              {/* Import */}
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelImport}
              />

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="touch-manipulation"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                    📊 Als Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    📄 Als CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bulk Action Bar */}
            {bulkMode && selectedRigIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-sm font-medium text-foreground">
                  {selectedRigIds.size} ausgewählt
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="touch-manipulation"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Ausgewählte löschen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRigIds(new Set())}
                >
                  <X className="h-4 w-4 mr-1" />
                  Auswahl aufheben
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table View */}
        {viewMode === "table" && (
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">
                    Anlage
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Region
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Standort
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Operator
                  </TableHead>
                  <TableHead className="text-muted-foreground text-center">
                    Inspektionen
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Priorität
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRigs.map((rig) => {
                  const priorityStatus = getRigPriorityStatus(rig);
                  return (
                    <TableRow
                      key={rig.id}
                      className="cursor-pointer hover:bg-muted/50 border-border"
                      onClick={() => setSelectedRig(rig)}
                    >
                      <TableCell className="font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-md">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          {rig.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {rig.region}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-medium ${getContractStatusColor(rig.contractStatus)}`}
                        >
                          {rig.contractStatus === "operational"
                            ? "Operational"
                            : rig.contractStatus === "stacked"
                              ? "Stacked"
                              : "Overhaul"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {rig.location || "Nicht zugewiesen"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rig.operator || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-blue-400" />
                          <span className="font-bold text-foreground">
                            {rig.inspections.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {priorityStatus === "overdue" && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
                        {priorityStatus === "due-soon" && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Fällig
                          </Badge>
                        )}
                        {priorityStatus === "upcoming" && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Anstehend
                          </Badge>
                        )}
                        {priorityStatus === "ok" && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRigs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Keine Anlagen gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Rigs Card Grid with Color-Coded Left Border */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRigs.map((rig) => {
              const priorityStatus = getRigPriorityStatus(rig);
              return (
                <Card
                  key={rig.id}
                  className={`group relative border-l-4 bg-card/80 hover:bg-card transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.02] backdrop-blur-sm ${getCardBorderColor(rig)}`}
                  onClick={() => !bulkMode && setSelectedRig(rig)}
                >
                  {/* Bulk select checkbox */}
                  {bulkMode && (
                    <div
                      className="absolute top-3 left-3 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedRigIds.has(rig.id)}
                        onCheckedChange={() => toggleRigSelection(rig.id)}
                        className="h-5 w-5"
                      />
                    </div>
                  )}

                  {/* Top Right: Status Badge + 3-dot menu */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <Badge
                      className={`text-xs font-medium ${getContractStatusColor(rig.contractStatus)}`}
                    >
                      {rig.contractStatus === "operational"
                        ? "Operational"
                        : rig.contractStatus === "stacked"
                          ? "Stacked"
                          : "Overhaul"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity touch-manipulation"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRig(rig);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details ansehen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRig(rig);
                            setIsAddInspectionOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Inspektion planen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRig(rig);
                            setIsAddIssueOpen(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Issue melden
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRig(rig);
                            setShowMeetingOverview(true);
                            setOverviewForAll(false);
                          }}
                        >
                          <Presentation className="h-4 w-4 mr-2" />
                          Meeting-Übersicht
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRigToDelete(rig);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardHeader className="pb-2">
                    <div
                      className={`flex items-start gap-3 ${bulkMode ? "pl-8" : ""} pr-24`}
                    >
                      <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-foreground truncate">
                          {rig.name}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs border-border text-muted-foreground"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {rig.region}
                          </Badge>
                          {rig.rigType && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500/30 text-blue-400"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              {rig.rigType}
                            </Badge>
                          )}
                          {rig.year && (
                            <span className="text-xs text-muted-foreground">
                              ({rig.year})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Location & Operator - compact */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Standort
                        </p>
                        <p className="font-medium text-foreground truncate">
                          {rig.location || "Nicht zugewiesen"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Operator
                        </p>
                        <p className="font-medium text-foreground truncate">
                          {rig.operator || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats: Inspections only */}
                    {rig.inspections.length > 0 ? (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Inspektionen
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3 text-blue-400" />
                            <span className="text-base font-bold text-foreground">
                              {rig.inspections.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-center gap-1.5 py-1 text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            Keine Aktionen erforderlich
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Priority Alert - compact */}
                    {priorityStatus === "overdue" && (
                      <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-xs text-red-400 font-medium">
                          OVERDUE — Sofortige Maßnahmen!
                        </span>
                      </div>
                    )}
                    {priorityStatus === "due-soon" && (
                      <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/50 rounded-lg px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                        <span className="text-xs text-orange-400 font-medium">
                          Fällig innerhalb 7 Tagen
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
          <DialogContent className="w-[95vw] max-w-[1400px] max-h-[90vh] flex flex-col overflow-hidden bg-card border-border">
            <DialogHeader className="flex-shrink-0">
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
              className="w-full flex flex-col overflow-hidden flex-1 min-h-0"
            >
              <TabsList className="grid w-full grid-cols-2 gap-1 flex-shrink-0">
                <TabsTrigger value="info" className="text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Allgemein
                </TabsTrigger>
                <TabsTrigger value="inspections" className="text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Inspektionen
                </TabsTrigger>
              </TabsList>

              {/* Tab: Allgemeine Infos */}
              <TabsContent
                value="info"
                className="mt-4 overflow-y-auto flex-1 min-h-0"
              >
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
                          {/* Row 1, Col 1: Status Dropdown */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Status *
                            </Label>
                            <Select
                              value={selectedRig.contractStatus}
                              onValueChange={async (value: string) => {
                                const newStatus = value as "stacked" | "operational" | "overhaul";
                                // Optimistic update
                                const updatedRigs = rigs.map((r) =>
                                  r.id === selectedRig.id
                                    ? { ...r, contractStatus: newStatus }
                                    : r,
                                );
                                setRigs(updatedRigs);
                                setSelectedRig({
                                  ...selectedRig,
                                  contractStatus: newStatus,
                                });
                                // API call
                                try {
                                  await assetIntegrityApi.updateRigStatus(
                                    selectedRig.id,
                                    newStatus,
                                  );
                                  toast({
                                    variant: "success" as const,
                                    title: "Status aktualisiert",
                                    description: `Status auf "${newStatus}" geändert`,
                                  });
                                } catch {
                                  toast({
                                    variant: "destructive" as const,
                                    title: "Fehler",
                                    description:
                                      "Status konnte nicht aktualisiert werden",
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="bg-background border-border text-foreground h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="stacked">⏸️ Stacked</SelectItem>
                                <SelectItem value="operational">🟢 Operational</SelectItem>
                                <SelectItem value="overhaul">🔧 Overhaul</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Row 1, Col 2: Operator */}
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

                          {/* Row 2: Standort (full width) */}
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
              <TabsContent
                value="inspections"
                className="space-y-3 mt-4 overflow-y-auto flex-1 min-h-0"
              >
                <div className="flex justify-end gap-2 mb-3">
                  <input
                    ref={inspectionFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleInspectionExcelImport}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Excel Import
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border-border">
                      <DropdownMenuItem
                        onClick={() => inspectionFileInputRef.current?.click()}
                      >
                        📥 Excel-Datei importieren
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={downloadInspectionTemplate}>
                        📄 Vorlage herunterladen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Inspection Excel Import Preview Dialog */}
      <Dialog
        open={isInspectionImportOpen}
        onOpenChange={setIsInspectionImportOpen}
      >
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Inspektionen importieren — {selectedRig?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vorschau der zu importierenden Inspektionen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inspectionImportPreview?.errors &&
              inspectionImportPreview.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
                  <p className="text-red-400 font-medium text-sm mb-1">
                    ⚠️ {inspectionImportPreview.errors.length} Fehler
                  </p>
                  <ul className="text-xs text-red-300 space-y-0.5">
                    {inspectionImportPreview.errors
                      .slice(0, 10)
                      .map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    {inspectionImportPreview.errors.length > 10 && (
                      <li>
                        ... und {inspectionImportPreview.errors.length - 10}{" "}
                        weitere
                      </li>
                    )}
                  </ul>
                </div>
              )}

            {inspectionImportPreview?.inspections &&
              inspectionImportPreview.inspections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    ✅ {inspectionImportPreview.inspections.length} Inspektionen
                    erkannt:
                  </p>
                  <div className="border border-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground text-xs">
                            Beschreibung
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs">
                            Typ
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs">
                            Fällig
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs">
                            Status
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs">
                            Verantwortlich
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inspectionImportPreview.inspections
                          .slice(0, 20)
                          .map((insp, i) => (
                            <TableRow key={i} className="border-border">
                              <TableCell className="text-foreground text-xs max-w-[200px] truncate">
                                {insp.description}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {insp.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {new Date(insp.dueDate).toLocaleDateString(
                                  "de-DE",
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-xs ${getInspectionStatusColor(insp.status)}`}
                                >
                                  {insp.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {insp.responsible || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {inspectionImportPreview.inspections.length > 20 && (
                      <p className="text-xs text-muted-foreground p-2 text-center">
                        ... und{" "}
                        {inspectionImportPreview.inspections.length - 20}{" "}
                        weitere
                      </p>
                    )}
                  </div>
                </div>
              )}

            {inspectionImportPreview?.inspections.length === 0 &&
              inspectionImportPreview?.errors.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Keine Inspektionen in der Datei gefunden
                </p>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInspectionImportOpen(false);
                setInspectionImportPreview(null);
              }}
              className="border-border"
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmInspectionImport}
              disabled={
                !inspectionImportPreview?.inspections.length ||
                isInspectionImporting
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isInspectionImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {inspectionImportPreview?.inspections.length || 0}{" "}
                  Inspektionen importieren
                </>
              )}
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
                  Status *
                </Label>
                <Select
                  value={newRig.contractStatus}
                  onValueChange={(
                    value: "stacked" | "operational" | "overhaul",
                  ) => setNewRig({ ...newRig, contractStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stacked">⏸️ Stacked</SelectItem>
                    <SelectItem value="operational">🟢 Operational</SelectItem>
                    <SelectItem value="overhaul">🔧 Overhaul</SelectItem>
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

            {/* Rig Type, HP, Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Rig Typ
                </Label>
                <Input
                  value={newRig.rigType}
                  onChange={(e) =>
                    setNewRig({ ...newRig, rigType: e.target.value })
                  }
                  placeholder="z.B. 2000 HP Land Rig"
                />
              </div>
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  HP Rating
                </Label>
                <Input
                  value={newRig.hpRating}
                  onChange={(e) =>
                    setNewRig({ ...newRig, hpRating: e.target.value })
                  }
                  placeholder="z.B. 2000 HP"
                />
              </div>
              <div>
                <Label className="text-foreground font-medium flex items-center gap-1.5 mb-2">
                  Baujahr
                </Label>
                <Input
                  type="number"
                  value={newRig.year || ""}
                  onChange={(e) =>
                    setNewRig({ ...newRig, year: Number(e.target.value) })
                  }
                  placeholder="z.B. 2014"
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

      {/* Delete Confirmation Dialog (for sub-items) */}
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

      {/* Delete Rig Confirmation */}
      <AlertDialog
        open={!!rigToDelete}
        onOpenChange={(open) => !open && setRigToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Anlage löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie <strong>{rigToDelete?.name}</strong> wirklich
              unwiderruflich löschen?
              <br />
              Alle zugehörigen Inspektionen, Issues und Verbesserungen werden
              ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRigToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => rigToDelete && handleDeleteRig(rigToDelete)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              {selectedRigIds.size} Anlagen löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Folgende Anlagen werden unwiderruflich gelöscht:
              <span className="block mt-2 font-medium text-foreground">
                {rigs
                  .filter((r) => selectedRigIds.has(r.id))
                  .map((r) => r.name)
                  .join(", ")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteOpen(false)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Alle löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Import Preview Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-green-500" />
              Excel Import — Vorschau
            </DialogTitle>
            <DialogDescription>
              Überprüfen Sie die importierten Daten vor dem Hinzufügen.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4 py-2">
              {/* New rigs */}
              {importPreview.newRigs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">
                    ✅ {importPreview.newRigs.length} neue Anlagen
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importPreview.newRigs.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm bg-green-500/10 border border-green-500/20 rounded px-3 py-1.5"
                      >
                        <span className="font-medium text-foreground">
                          {r.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {r.region} · {r.contractStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {importPreview.duplicates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-orange-400 mb-2">
                    ⚠️ {importPreview.duplicates.length} Duplikate (werden
                    übersprungen)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {importPreview.duplicates.join(", ")}
                  </p>
                </div>
              )}

              {/* Errors */}
              {importPreview.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">
                    ❌ {importPreview.errors.length} Fehler
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {importPreview.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportOpen(false);
                setImportPreview(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmImport}
              disabled={isImporting || !importPreview?.newRigs.length}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {importPreview?.newRigs.length || 0} Anlagen importieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
