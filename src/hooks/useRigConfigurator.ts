import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useUserList } from "@/hooks/useQueryHooks";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { tenderService, type TenderConfiguration } from "@/services/tender.service";
import { rigService, type Rig } from "@/services/rig.service";
import { apiClient } from "@/services/api";
import { rigQuoteExportService } from "@/services/rig-quote-export.service";
import {
  DEFAULT_EQUIPMENT_CATALOG,
  EMPTY_EQUIPMENT_SELECTION,
  type EquipmentCatalog,
} from "@/data/equipment-catalog";
import type { ProjectRequirements, EquipmentItem } from "@/components/rig-configurator/types";

// ── Constants ─────────────────────────────────────────────
const STORAGE_KEY = "rigConfigurator_equipment";

const EMPTY_REQUIREMENTS: ProjectRequirements = {
  projectName: "",
  clientName: "",
  location: "",
  projectDuration: "",
  depth: "",
  hookLoad: "",
  footprint: "",
  rotaryTorque: "",
  pumpPressure: "",
  mudWeight: "",
  casingSize: "",
  holeSize: "",
  formationPressure: "",
  additionalNotes: "",
};

// ── Matched Rig (with score) ──────────────────────────────
export interface MatchedRig extends Rig {
  score: number;
  warnings: string[];
  isSuitable: boolean;
}

// ── Hook ──────────────────────────────────────────────────
export function useRigConfigurator() {
  const { toast } = useToast();
  const { isAdmin: checkIsAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAdmin] = useState(checkIsAdmin());

  // ── Core state ──
  const [activeTab, setActiveTab] = useState("requirements");
  const [requirements, setRequirements] = useState<ProjectRequirements>(EMPTY_REQUIREMENTS);
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, EquipmentItem[]>>(
    EMPTY_EQUIPMENT_SELECTION,
  );

  // ── Equipment catalog ──
  const [equipmentCategories, setEquipmentCategories] = useState<EquipmentCatalog>(
    DEFAULT_EQUIPMENT_CATALOG,
  );

  // ── Tender view ──
  const [tenderViewMode, setTenderViewMode] = useState<"table" | "gantt" | "board">("board");

  // ── Dialog state ──
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [editingRig, setEditingRig] = useState<Rig | null>(null);
  const [editingEquipmentCategory, setEditingEquipmentCategory] = useState<string | null>(null);
  const [editingEquipmentItem, setEditingEquipmentItem] = useState<EquipmentItem | null>(null);
  const [tempPrice, setTempPrice] = useState("");

  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentFormMode, setEquipmentFormMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [equipmentForm, setEquipmentForm] = useState<Record<string, string>>({
    id: "",
    name: "",
    price: "",
  });

  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [quickActionEquipment, setQuickActionEquipment] = useState<{
    categoryName: string;
    equipmentName: string;
  } | null>(null);
  const [quickActionForm, setQuickActionForm] = useState({ assignedTo: "", description: "" });

  const [rigEditDialogOpen, setRigEditDialogOpen] = useState(false);
  const [editingRigData, setEditingRigData] = useState<Rig | null>(null);
  const [savingRig, setSavingRig] = useState(false);

  const [equipmentManagementDialogOpen, setEquipmentManagementDialogOpen] = useState(false);
  const [editingTenderConfig, setEditingTenderConfig] = useState<TenderConfiguration | null>(null);
  const [tempEquipmentSelection, setTempEquipmentSelection] = useState<Record<string, EquipmentItem[]>>({});

  const [contractDateDialogOpen, setContractDateDialogOpen] = useState(false);
  const [pendingContractConfig, setPendingContractConfig] = useState<TenderConfiguration | null>(null);
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>(undefined);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // ── Data queries ──
  const { data: rigsResult } = useQuery({
    queryKey: queryKeys.rigs.list(),
    queryFn: () => rigService.getAllRigs(),
    staleTime: 5 * 60 * 1000,
  });
  const rigs = rigsResult?.success ? rigsResult.data : [];

  const { data: tendersData, isLoading: loadingTenders } = useQuery({
    queryKey: queryKeys.tenders.list(),
    queryFn: () => tenderService.getAllTenders(),
  });
  const savedConfigurations = tendersData ?? [];

  const { data: userListData } = useUserList();
  const users = (userListData ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
  }));

  const refreshTenders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });
  }, [queryClient]);

  // ── Persist equipment catalog ──
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEquipmentCategories(JSON.parse(saved));
      } catch {
        // ignore corrupt data
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(equipmentCategories).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(equipmentCategories));
    }
  }, [equipmentCategories]);

  // ── Rig matching ──
  const matchedRigs: MatchedRig[] = useMemo(() => {
    const depth = parseFloat(requirements.depth) || 0;
    const hookLoad = parseFloat(requirements.hookLoad) || 0;
    const torque = parseFloat(requirements.rotaryTorque) || 0;
    const pressure = parseFloat(requirements.pumpPressure) || 0;

    if (depth === 0 && hookLoad === 0 && torque === 0 && pressure === 0) {
      return rigs.map((rig) => ({ ...rig, score: 0, warnings: [], isSuitable: false }));
    }

    const scored = rigs.map((rig) => {
      let score = 0;
      const warnings: string[] = [];

      const scoreParam = (actual: number, required: number, label: string) => {
        if (required <= 0) return;
        if (actual >= required) {
          score += 25;
          const proximityBonus = Math.max(0, 10 - ((actual - required) / required) * 10);
          score += proximityBonus;
        } else {
          warnings.push(label);
        }
      };

      scoreParam(rig.maxDepth, depth, `Tiefe überschreitet Maximum (${rig.maxDepth}m)`);
      scoreParam(rig.maxHookLoad, hookLoad, `Hakenlast zu hoch (Max: ${rig.maxHookLoad}t)`);
      scoreParam(rig.rotaryTorque, torque, "Drehmoment unzureichend");
      scoreParam(rig.pumpPressure, pressure, "Pumpendruck zu niedrig");

      if (requirements.footprint && rig.footprint === requirements.footprint) score += 5;
      else if (requirements.footprint && rig.footprint !== requirements.footprint) score -= 10;

      return { ...rig, score, warnings, isSuitable: warnings.length === 0 && score > 0 };
    });

    return scored.sort((a, b) => b.score !== a.score ? b.score - a.score : a.warnings.length - b.warnings.length);
  }, [requirements, rigs]);

  // ── Equipment toggle ──
  const toggleEquipment = useCallback((category: string, item: EquipmentItem) => {
    setSelectedEquipment((prev) => {
      const current = prev[category] || [];
      const exists = current.find((i) => i.id === item.id);
      return {
        ...prev,
        [category]: exists ? current.filter((i) => i.id !== item.id) : [...current, item],
      };
    });
  }, []);

  // ── Calculate total ──
  const calculateTotal = useCallback(() => {
    let total = selectedRig ? parseFloat(selectedRig.dayRate) : 0;
    Object.values(selectedEquipment).forEach((items) => {
      items.forEach((item) => { total += parseFloat(item.price); });
    });
    return total;
  }, [selectedRig, selectedEquipment]);

  // ── Project duration as number ──
  const projectDurationDays = useMemo(() => {
    const match = requirements.projectDuration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }, [requirements.projectDuration]);

  // ── Can save as tender ──
  const canSaveTender = !!(selectedRig && requirements.projectName);

  // ── Reset requirements ──
  const resetRequirements = useCallback(() => {
    setRequirements(EMPTY_REQUIREMENTS);
    setSelectedRig(null);
  }, []);

  // ── Navigate to next tab ──
  const goToTab = useCallback((tab: string) => setActiveTab(tab), []);

  // ═══════════════════════════════════════════════════════
  //  Actions
  // ═══════════════════════════════════════════════════════

  const saveCurrentConfiguration = useCallback(async () => {
    if (!selectedRig || !requirements.projectName) {
      toast({
        title: "Unvollständige Konfiguration",
        description: "Bitte wählen Sie eine Rig aus und geben Sie einen Projektnamen ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      await tenderService.createTender({
        projectName: requirements.projectName,
        clientName: requirements.clientName,
        location: requirements.location,
        projectDuration: requirements.projectDuration,
        selectedRig,
        selectedEquipment,
        totalPrice: calculateTotal(),
        isUnderContract: false,
        notes: "",
      });
      refreshTenders();
      toast({ variant: "success" as const, title: "Konfiguration gespeichert", description: `Tender für "${requirements.projectName}" wurde als Entwurf angelegt.` });
      setActiveTab("tender");
    } catch {
      toast({ title: "Fehler beim Speichern", description: "Die Tender-Konfiguration konnte nicht gespeichert werden.", variant: "destructive" });
    }
  }, [selectedRig, requirements, selectedEquipment, calculateTotal, refreshTenders, toast]);

  const toggleContractStatus = useCallback(async (configId: string) => {
    const config = savedConfigurations.find((c) => c.id === configId);
    if (!config) return;

    if (!config.isUnderContract) {
      setPendingContractConfig(config);
      setContractStartDate(new Date());
      setContractDateDialogOpen(true);
    } else {
      try {
        await tenderService.updateTender(configId, { isUnderContract: false, contractStartDate: "" });
        refreshTenders();
        toast({ variant: "success" as const, title: "Status geändert", description: "Anlage ist nicht mehr unter Vertrag." });
      } catch {
        toast({ title: "Fehler", description: "Der Vertragsstatus konnte nicht geändert werden.", variant: "destructive" });
      }
    }
  }, [savedConfigurations, refreshTenders, toast]);

  const confirmContractStartDate = useCallback(async () => {
    if (!pendingContractConfig || !contractStartDate || isSubmittingContract) return;
    setIsSubmittingContract(true);
    try {
      await tenderService.updateTender(pendingContractConfig.id, {
        isUnderContract: true,
        contractStartDate: contractStartDate.toISOString(),
      });
      refreshTenders();
      toast({ title: "Vertrag gestartet", description: `Anlage ist ab ${contractStartDate.toLocaleDateString("de-DE")} unter Vertrag.` });
      setContractDateDialogOpen(false);
      setPendingContractConfig(null);
      setContractStartDate(undefined);
    } catch {
      toast({ title: "Fehler", description: "Der Vertragsstatus konnte nicht gesetzt werden.", variant: "destructive" });
    } finally {
      setIsSubmittingContract(false);
    }
  }, [pendingContractConfig, contractStartDate, isSubmittingContract, refreshTenders, toast]);

  const deleteTenderConfiguration = useCallback(async (configId: string) => {
    try {
      await tenderService.deleteTender(configId);
      refreshTenders();
      toast({ variant: "success" as const, title: "Konfiguration gelöscht" });
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
  }, [refreshTenders, toast]);

  // ── Equipment catalog management ──
  const openAddEquipmentDialog = useCallback((category: string) => {
    setSelectedCategory(category);
    setEquipmentFormMode("add");
    setEquipmentForm({ id: `${category}_${Date.now()}`, name: "", price: "" });
    setEquipmentDialogOpen(true);
  }, []);

  const openEditEquipmentDialog = useCallback((category: string, item: EquipmentItem) => {
    setSelectedCategory(category);
    setEquipmentFormMode("edit");
    setEquipmentForm({ ...item } as Record<string, string>);
    setEquipmentDialogOpen(true);
  }, []);

  const saveEquipmentItem = useCallback(() => {
    if (!selectedCategory || !equipmentForm.name || !equipmentForm.price) {
      toast({ title: "Fehler", description: "Bitte füllen Sie alle Pflichtfelder aus.", variant: "destructive" });
      return;
    }
    setEquipmentCategories((prev) => {
      const cat = prev[selectedCategory];
      if (!cat) return prev;
      return {
        ...prev,
        [selectedCategory]: {
          ...cat,
          items: equipmentFormMode === "add"
            ? [...cat.items, equipmentForm as EquipmentItem]
            : cat.items.map((i) => (i.id === equipmentForm.id ? (equipmentForm as EquipmentItem) : i)),
        },
      };
    });
    toast({ variant: "success" as const, title: equipmentFormMode === "add" ? "Equipment hinzugefügt" : "Equipment aktualisiert" });
    setEquipmentDialogOpen(false);
    setSelectedCategory("");
    setEquipmentForm({ id: "", name: "", price: "" });
  }, [selectedCategory, equipmentForm, equipmentFormMode, toast]);

  const deleteEquipmentItem = useCallback((category: string, itemId: string) => {
    if (!confirm("Möchten Sie dieses Equipment wirklich löschen?")) return;
    setEquipmentCategories((prev) => {
      const cat = prev[category];
      if (!cat) return prev;
      return { ...prev, [category]: { ...cat, items: cat.items.filter((i) => i.id !== itemId) } };
    });
    toast({ variant: "success" as const, title: "Equipment gelöscht" });
  }, [toast]);

  // ── Price editing ──
  const openRigPriceEdit = useCallback((rig: Rig) => {
    setEditingRig(rig);
    setTempPrice(rig.dayRate);
    setEditPriceDialogOpen(true);
  }, []);

  const savePrice = useCallback(() => {
    if (editingRig) {
      queryClient.setQueryData(
        queryKeys.rigs.list(),
        (prev: { success: boolean; data: Rig[] } | undefined) => {
          if (!prev) return prev;
          return { ...prev, data: prev.data.map((r) => r.id === editingRig.id ? { ...r, dayRate: tempPrice } : r) };
        },
      );
      if (selectedRig?.id === editingRig.id) setSelectedRig({ ...editingRig, dayRate: tempPrice });
      toast({ title: "Preis aktualisiert", description: `Tagesrate für ${editingRig.name} auf €${parseFloat(tempPrice).toLocaleString("de-DE")} gesetzt.` });
    } else if (editingEquipmentCategory && editingEquipmentItem) {
      setEquipmentCategories((prev) => ({
        ...prev,
        [editingEquipmentCategory]: {
          ...prev[editingEquipmentCategory],
          items: prev[editingEquipmentCategory].items.map((i) =>
            i.id === editingEquipmentItem.id ? { ...i, price: tempPrice } : i,
          ),
        },
      }));
      toast({ variant: "success" as const, title: "Preis aktualisiert" });
    }
    setEditPriceDialogOpen(false);
    setEditingRig(null);
    setEditingEquipmentCategory(null);
    setEditingEquipmentItem(null);
    setTempPrice("");
  }, [editingRig, editingEquipmentCategory, editingEquipmentItem, tempPrice, selectedRig, queryClient, toast]);

  // ── Rig editing (admin) ──
  const openRigEdit = useCallback((rig: Rig) => {
    setEditingRigData({ ...rig });
    setRigEditDialogOpen(true);
  }, []);

  const saveRigChanges = useCallback(async () => {
    if (!editingRigData || !isAdmin) return;
    setSavingRig(true);
    try {
      const result = await rigService.updateRig(editingRigData.id, {
        maxDepth: editingRigData.maxDepth,
        maxHookLoad: editingRigData.maxHookLoad,
        rotaryTorque: editingRigData.rotaryTorque,
        pumpPressure: editingRigData.pumpPressure,
        drawworks: editingRigData.drawworks,
        mudPumps: editingRigData.mudPumps,
        topDrive: editingRigData.topDrive,
        derrickCapacity: editingRigData.derrickCapacity,
        crewSize: editingRigData.crewSize,
        mobilizationTime: editingRigData.mobilizationTime,
        dayRate: editingRigData.dayRate,
      });
      if (result.success) {
        queryClient.setQueryData(
          queryKeys.rigs.list(),
          (prev: { success: boolean; data: Rig[] } | undefined) => {
            if (!prev) return prev;
            return { ...prev, data: prev.data.map((r) => r.id === editingRigData.id ? result.data : r) };
          },
        );
        if (selectedRig?.id === editingRigData.id) setSelectedRig(result.data);
        toast({ variant: "success" as const, title: "Erfolgreich gespeichert", description: `Änderungen an ${editingRigData.name} wurden im Backend gespeichert.` });
        setRigEditDialogOpen(false);
        setEditingRigData(null);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Backend-Fehler.";
      toast({ title: "Speichern fehlgeschlagen", description: msg, variant: "destructive" });
    } finally {
      setSavingRig(false);
    }
  }, [editingRigData, isAdmin, selectedRig, queryClient, toast]);

  // ── Quick action ──
  const openQuickActionDialog = useCallback((categoryKey: string, item: EquipmentItem) => {
    const catName = equipmentCategories[categoryKey]?.name || categoryKey;
    setQuickActionEquipment({ categoryName: catName, equipmentName: item.name });
    setQuickActionForm({ assignedTo: "", description: `Tender-Arbeit für ${item.name}` });
    setQuickActionDialogOpen(true);
  }, [equipmentCategories]);

  const createQuickAction = useCallback(async () => {
    if (!quickActionForm.assignedTo || !quickActionEquipment) {
      toast({ title: "Fehler", description: "Bitte wählen Sie einen Benutzer aus.", variant: "destructive" });
      return;
    }
    try {
      await apiClient.request("/actions", {
        method: "POST",
        body: JSON.stringify({
          plant: requirements.location || "T208",
          category: "ALLGEMEIN",
          title: `Tender: ${quickActionEquipment.equipmentName}`,
          description: quickActionForm.description,
          status: "OPEN",
          priority: "MEDIUM",
          assignedTo: quickActionForm.assignedTo,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });
      toast({ variant: "success" as const, title: "Action erstellt", description: `Aufgabe für ${quickActionEquipment.equipmentName} wurde erstellt.` });
      setQuickActionDialogOpen(false);
      setQuickActionForm({ assignedTo: "", description: "" });
      setQuickActionEquipment(null);
    } catch {
      toast({ title: "Fehler", description: "Action konnte nicht erstellt werden.", variant: "destructive" });
    }
  }, [quickActionForm, quickActionEquipment, requirements.location, toast]);

  // ── Equipment management for tenders ──
  const openEquipmentManagement = useCallback((config: TenderConfiguration) => {
    setEditingTenderConfig(config);
    setTempEquipmentSelection(config.selectedEquipment || {});
    setEquipmentManagementDialogOpen(true);
  }, []);

  const saveEquipmentChanges = useCallback(async () => {
    if (!editingTenderConfig) return;
    try {
      await tenderService.updateTender(editingTenderConfig.id, { ...editingTenderConfig, selectedEquipment: tempEquipmentSelection });
      refreshTenders();
      toast({ title: "Equipment aktualisiert" });
      setEquipmentManagementDialogOpen(false);
      setEditingTenderConfig(null);
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  }, [editingTenderConfig, tempEquipmentSelection, refreshTenders, toast]);

  // ── PDF export ──
  const exportConfiguration = useCallback(() => {
    if (!selectedRig) {
      toast({ title: "Keine Anlage ausgewählt", variant: "destructive" });
      return;
    }
    try {
      const filename = `Angebot-${requirements.clientName || "Kunde"}-${new Date().toISOString().split("T")[0]}.pdf`;
      rigQuoteExportService.generateQuote(
        {
          projectName: requirements.projectName,
          clientName: requirements.clientName,
          location: requirements.location,
          projectDuration: requirements.projectDuration,
          selectedRig,
          selectedEquipment: selectedEquipment as { [category: string]: Array<{ name: string; price: string; [key: string]: string }> },
          additionalNotes: requirements.additionalNotes,
        },
        filename,
      );
      toast({ title: "Angebot erstellt", description: `PDF generiert: ${filename}` });
    } catch {
      toast({ title: "Export fehlgeschlagen", variant: "destructive" });
    }
  }, [selectedRig, requirements, selectedEquipment, toast]);

  // ── Tender duration helpers ──
  const calculateTenderDuration = useCallback((config: TenderConfiguration) => {
    const match = config.projectDuration?.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  }, []);

  const calculateDaysElapsed = useCallback((config: TenderConfiguration) => {
    if (!config.createdAt) return 0;
    return Math.ceil(Math.abs(new Date().getTime() - new Date(config.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // ═══════════════════════════════════════════════════════
  //  Return
  // ═══════════════════════════════════════════════════════
  return {
    // Navigation
    activeTab,
    setActiveTab,
    goToTab,

    // Core state
    requirements,
    setRequirements,
    resetRequirements,
    selectedRig,
    setSelectedRig,
    selectedEquipment,
    toggleEquipment,
    equipmentCategories,
    setEquipmentCategories,

    // Derived
    matchedRigs,
    calculateTotal,
    projectDurationDays,
    canSaveTender,
    isAdmin,

    // Tender view
    tenderViewMode,
    setTenderViewMode,

    // Data
    savedConfigurations,
    loadingTenders,
    refreshTenders,
    users,
    rigs,

    // Actions
    saveCurrentConfiguration,
    toggleContractStatus,
    confirmContractStartDate,
    deleteTenderConfiguration,
    exportConfiguration,
    calculateTenderDuration,
    calculateDaysElapsed,

    // Equipment catalog management
    openAddEquipmentDialog,
    openEditEquipmentDialog,
    saveEquipmentItem,
    deleteEquipmentItem,
    equipmentDialogOpen,
    setEquipmentDialogOpen,
    equipmentFormMode,
    selectedCategory,
    equipmentForm,
    setEquipmentForm,

    // Price edit dialog
    editPriceDialogOpen,
    setEditPriceDialogOpen,
    editingRig,
    editingEquipmentItem,
    tempPrice,
    setTempPrice,
    openRigPriceEdit,
    savePrice,

    // Rig edit dialog (admin)
    rigEditDialogOpen,
    setRigEditDialogOpen,
    editingRigData,
    setEditingRigData,
    savingRig,
    openRigEdit,
    saveRigChanges,

    // Quick action dialog
    quickActionDialogOpen,
    setQuickActionDialogOpen,
    quickActionEquipment,
    setQuickActionEquipment,
    quickActionForm,
    setQuickActionForm,
    openQuickActionDialog,
    createQuickAction,

    // Equipment management dialog (tender)
    equipmentManagementDialogOpen,
    setEquipmentManagementDialogOpen,
    editingTenderConfig,
    setEditingTenderConfig,
    tempEquipmentSelection,
    setTempEquipmentSelection,
    openEquipmentManagement,
    saveEquipmentChanges,

    // Contract date dialog
    contractDateDialogOpen,
    setContractDateDialogOpen,
    pendingContractConfig,
    setPendingContractConfig,
    contractStartDate,
    setContractStartDate,
    isSubmittingContract,
  };
}

export type RigConfiguratorState = ReturnType<typeof useRigConfigurator>;
