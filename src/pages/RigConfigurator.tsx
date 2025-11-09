import { useState, useMemo, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  Building2,
  Settings,
  FileText,
  Search,
  AlertCircle,
  Package,
  Zap,
  Droplets,
  Wrench,
  Truck,
  Shield,
  Users,
  BarChart3,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  ClipboardList,
  FileDown,
  Calculator,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  tenderService,
  type TenderConfiguration,
} from "../services/tender.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { rigService } from "@/services/rig.service";
import { authService } from "@/services/auth.service";
import { apiClient } from "@/services/api";
import { rigQuoteExportService } from "@/services/rig-quote-export.service";

// Types
interface ProjectRequirements {
  projectName: string;
  clientName: string;
  location: string;
  projectDuration: string;
  depth: string;
  hookLoad: string;
  footprint: "Klein" | "Mittel" | "Groß" | "";
  rotaryTorque: string;
  pumpPressure: string;
  mudWeight: string;
  casingSize: string;
  holeSize: string;
  formationPressure: string;
  additionalNotes: string;
}

interface Rig {
  id: string;
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  footprint: string;
  rotaryTorque: number;
  pumpPressure: number;
  drawworks: string;
  mudPumps: string;
  topDrive: string;
  derrickCapacity: string;
  crewSize: string;
  mobilizationTime: string;
  dayRate: string;
  description: string;
  applications: string[];
  technicalSpecs: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  price: string;
  [key: string]: string | undefined;
}

const RigConfigurator = () => {
  const { toast } = useToast();
  const [isAdmin] = useState(authService.isAdmin());
  const [, setLoadingRigs] = useState(false);

  const [requirements, setRequirements] = useState<ProjectRequirements>({
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
  });

  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    [key: string]: EquipmentItem[];
  }>({
    drillPipe: [],
    tanks: [],
    power: [],
    camps: [],
    safety: [],
    mud: [],
    bop: [],
    cranes: [],
    misc: [],
  });

  // Preisverwaltung
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [editingRig, setEditingRig] = useState<Rig | null>(null);
  const [editingEquipmentCategory, setEditingEquipmentCategory] = useState<
    string | null
  >(null);
  const [editingEquipmentItem, setEditingEquipmentItem] =
    useState<EquipmentItem | null>(null);
  const [tempPrice, setTempPrice] = useState("");

  // Equipment Management
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentFormMode, setEquipmentFormMode] = useState<"add" | "edit">(
    "add"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [equipmentForm, setEquipmentForm] = useState<Record<string, string>>({
    id: "",
    name: "",
    price: "",
  });

  // Quick Action Dialog
  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [quickActionEquipment, setQuickActionEquipment] = useState<{
    categoryName: string;
    equipmentName: string;
  } | null>(null);
  const [quickActionForm, setQuickActionForm] = useState({
    assignedTo: "",
    description: "",
  });
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; firstName: string; lastName: string }>
  >([]);

  // Rig Management (Admin only)
  const [rigEditDialogOpen, setRigEditDialogOpen] = useState(false);
  const [editingRigData, setEditingRigData] = useState<Rig | null>(null);
  const [savingRig, setSavingRig] = useState(false);

  // Tender Management
  const [savedConfigurations, setSavedConfigurations] = useState<
    TenderConfiguration[]
  >([]);
  const [, setTenderDetailDialogOpen] = useState(false);
  const [, setSelectedTenderConfig] = useState<TenderConfiguration | null>(
    null
  );
  const [, setLoadingTenders] = useState(false);

  // Equipment Management for Tenders
  const [equipmentManagementDialogOpen, setEquipmentManagementDialogOpen] =
    useState(false);
  const [editingTenderConfig, setEditingTenderConfig] =
    useState<TenderConfiguration | null>(null);
  const [tempEquipmentSelection, setTempEquipmentSelection] = useState<{
    [key: string]: EquipmentItem[];
  }>({});

  // Gantt Chart View
  const [showGanttView, setShowGanttView] = useState(false);

  // Contract Start Date Dialog
  const [contractDateDialogOpen, setContractDateDialogOpen] = useState(false);
  const [pendingContractConfig, setPendingContractConfig] =
    useState<TenderConfiguration | null>(null);
  const [contractStartDate, setContractStartDate] = useState<Date | undefined>(
    undefined
  );
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // Load saved tenders from API
  useEffect(() => {
    const loadTenders = async () => {
      try {
        setLoadingTenders(true);
        const tenders = await tenderService.getAllTenders();
        setSavedConfigurations(tenders);
      } catch (error) {
        console.error("Error loading tenders:", error);
        toast({
          title: "❌ Fehler beim Laden",
          description:
            "Gespeicherte Tender-Konfigurationen konnten nicht geladen werden.",
          variant: "destructive",
        });
      } finally {
        setLoadingTenders(false);
      }
    };

    loadTenders();
  }, []);

  // Bohranlagen Datenbank (wird vom Backend geladen)
  const [rigs, setRigs] = useState<Rig[]>([]);

  // Icon mapping for equipment categories (not in state, to prevent serialization issues)
  const equipmentCategoryIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    drillPipe: Wrench,
    tanks: Droplets,
    power: Zap,
    camps: Users,
    safety: Shield,
    mud: Settings,
    bop: AlertCircle,
    cranes: Truck,
    misc: Package,
  };

  // Equipment Katalog mit Kategorien (jetzt mit State)
  const [equipmentCategories, setEquipmentCategories] = useState({
    drillPipe: {
      name: "Bohrgestänge & Drill String",
      items: [
        {
          id: "dp1",
          name: '5" Bohrgestänge (Drill Pipe)',
          spec: "API 5DP S-135, 19.5 lb/ft",
          connection: "NC50",
          quantity: "300 Stangen",
          price: "450",
        },
        {
          id: "dp2",
          name: '5½" Bohrgestänge',
          spec: "API 5DP G-105, 21.9 lb/ft",
          connection: "NC56",
          quantity: "250 Stangen",
          price: "520",
        },
        {
          id: "hwdp1",
          name: '5" Schwerstangen (HWDP)',
          spec: "API 7-1 S-135, 49.3 lb/ft",
          connection: "NC50",
          quantity: "30 Stangen",
          price: "850",
        },
        {
          id: "dc1",
          name: '8" Drill Collars',
          spec: '2 13/16" ID',
          weight: "234 lb/ft",
          quantity: "20 Stück",
          price: "1200",
        },
      ],
    },
    tanks: {
      name: "Tanks & Silos",

      items: [
        {
          id: "tank1",
          name: "Spülungstank 500 bbl",
          capacity: "79.5 m³",
          type: "Aktiv-Tank",
          agitator: "2x 50 HP",
          price: "1800",
        },
        {
          id: "tank2",
          name: "Frischwassertank 300 bbl",
          capacity: "47.7 m³",
          material: "Edelstahl",
          price: "1200",
        },
        {
          id: "silo1",
          name: "Barite Silo",
          capacity: "150 m³",
          system: "Pneumatisch",
          price: "2500",
        },
        {
          id: "silo2",
          name: "Bentonit Silo",
          capacity: "100 m³",
          system: "Druckluft",
          price: "2200",
        },
      ],
    },
    power: {
      name: "Stromversorgung",

      items: [
        {
          id: "pow1",
          name: "Netzcontainer 1000 kVA",
          voltage: "690V/400V",
          protection: "IP54",
          price: "4500",
        },
        {
          id: "gen1",
          name: "Generator 500 kW",
          fuel: "1000L Tank",
          runtime: "24h",
          price: "5500",
        },
        {
          id: "gen2",
          name: "Generator 800 kW",
          fuel: "1500L Tank",
          runtime: "20h",
          price: "7800",
        },
      ],
    },
    camps: {
      name: "Unterkünfte & Büros",

      items: [
        {
          id: "camp1",
          name: "Wohncontainer 20ft",
          capacity: "4 Personen",
          features: "4 Einzelzimmer",
          price: "850",
        },
        {
          id: "camp2",
          name: "Wohncontainer 40ft Komfort",
          capacity: "8 Personen",
          features: "Klima, TV",
          price: "1600",
        },
        {
          id: "camp3",
          name: "Bürocontainer 20ft",
          capacity: "6 Arbeitsplätze",
          price: "750",
        },
        {
          id: "camp4",
          name: "Sanitärcontainer",
          capacity: "4 Duschen, 4 WCs",
          water: "200L Boiler",
          price: "1200",
        },
        {
          id: "camp5",
          name: "Küchen-Container 40ft",
          capacity: "30 Personen",
          features: "Vollküche",
          price: "2200",
        },
      ],
    },
    safety: {
      name: "Sicherheit & Gas-Detektion",

      items: [
        {
          id: "gas1",
          name: "Festgas-Warnsystem",
          sensors: "12 Sensoren (H2S, CO, CH4, O2)",
          certification: "ATEX Zone 1",
          price: "8500",
        },
        {
          id: "gas2",
          name: "Tragbare Gaswarngeräte",
          quantity: "10 Stück",
          type: "4-Gas Detektor",
          price: "450",
        },
        {
          id: "misc7",
          name: "Feuerlöscher Set",
          quantity: "20x 12kg",
          type: "ABC Pulver",
          price: "1200",
        },
        {
          id: "misc8",
          name: "Erste-Hilfe Container",
          capacity: "50 Personen",
          features: "AED",
          price: "4500",
        },
      ],
    },
    mud: {
      name: "Spülungssysteme",

      items: [
        {
          id: "mud1",
          name: "Mud Mixing System",
          capacity: "100 bbl/h",
          pumps: "2x 150 HP",
          price: "18500",
        },
        {
          id: "mud2",
          name: "Shale Shaker Doppeldeck",
          capacity: "1200 GPM",
          screens: "4 Siebe",
          price: "15000",
        },
        {
          id: "mud3",
          name: "Desander",
          capacity: "800 GPM",
          cones: '12x 10"',
          price: "8500",
        },
        {
          id: "mud5",
          name: "Mud Cleaner",
          capacity: "1000 GPM",
          efficiency: "15-75 Mikron",
          price: "22000",
        },
        {
          id: "mud6",
          name: "Zentrifuge",
          capacity: "400 GPM",
          gForce: "3000G",
          price: "35000",
        },
      ],
    },
    bop: {
      name: "BOP & Well Control",

      items: [
        {
          id: "bop1",
          name: "BOP Stack 10.000 psi",
          size: '13 5/8"',
          config: "Doppel-Ram + Annular",
          price: "125000",
        },
        {
          id: "bop2",
          name: "BOP Stack 5.000 psi",
          size: '13 5/8"',
          config: "Single-Ram + Annular",
          price: "75000",
        },
        {
          id: "bop3",
          name: "BOP Kontrollsystem",
          pressure: "3.000 psi",
          features: "Redundante Pumpen",
          price: "28000",
        },
        {
          id: "bop4",
          name: "Choke Manifold 10K",
          valves: "6x Needle Ventile",
          price: "22000",
        },
      ],
    },
    cranes: {
      name: "Krane & Hebetechnik",

      items: [
        {
          id: "crane1",
          name: "Mobilkran 50t",
          boom: "36m + 12m Wippspitze",
          operator: "Inkl. Bediener",
          price: "2800",
        },
        {
          id: "crane2",
          name: "Raupenkran 100t",
          boom: "48m + 24m Wippspitze",
          operator: "Inkl. Bediener",
          price: "4500",
        },
        {
          id: "crane3",
          name: "Truck Crane 25t",
          boom: "28m Teleskop",
          operator: "Inkl. Bediener",
          price: "1800",
        },
        {
          id: "crane4",
          name: "Gabelstapler 5t",
          lift: "4.5m",
          type: "Diesel Allrad",
          price: "450",
        },
      ],
    },
    misc: {
      name: "Sonstiges",

      items: [
        {
          id: "misc1",
          name: "Beleuchtungsturm 4x1000W",
          height: "9m",
          power: "5 kVA Generator",
          price: "320",
        },
        {
          id: "misc2",
          name: "Werkstatt-Container 40ft",
          equipment: "Drehbank, Schweißgerät",
          price: "3500",
        },
        {
          id: "misc3",
          name: "Lager-Container 20ft",
          features: "Regalsystem",
          price: "450",
        },
        {
          id: "misc5",
          name: "Kompressor 10 bar",
          flow: "20 m³/min",
          drive: "Diesel",
          price: "1800",
        },
      ],
    },
  });

  // LocalStorage: Lade gespeicherte Equipment-Daten beim Start
  useEffect(() => {
    const savedEquipment = localStorage.getItem("rigConfigurator_equipment");
    if (savedEquipment) {
      try {
        const parsed = JSON.parse(savedEquipment);
        setEquipmentCategories(parsed);
        toast({
          title: "Daten geladen",
          description: "Gespeicherte Equipment-Daten wurden wiederhergestellt.",
        });
      } catch (error) {
        console.error("Fehler beim Laden der Equipment-Daten:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend: Lade Rigs vom Backend
  useEffect(() => {
    const loadRigsFromBackend = async () => {
      setLoadingRigs(true);
      try {
        const result = await rigService.getAllRigs();
        if (result.success && result.data.length > 0) {
          setRigs(result.data);
          toast({
            title: "Rigs geladen",
            description: `${result.data.length} Bohranlagen vom Backend geladen.`,
          });
        }
      } catch (error) {
        console.error("Fehler beim Laden der Rigs:", error);
        toast({
          title: "Backend-Fehler",
          description:
            "Konnte Rigs nicht vom Backend laden. Fallback auf lokale Daten.",
          variant: "destructive",
        });
        // Fallback: Wenn Backend nicht erreichbar, nutze die ursprünglichen hardcoded Daten
        setRigs([
          {
            id: "t700",
            name: "T700",
            category: "Schwerlast",
            maxDepth: 7000,
            maxHookLoad: 700,
            footprint: "Groß",
            rotaryTorque: 85000,
            pumpPressure: 7500,
            drawworks: "2000 HP",
            mudPumps: "2x 2200 HP Triplex",
            topDrive: "1000 HP",
            derrickCapacity: "1000 t",
            crewSize: "45-50",
            mobilizationTime: "30-45 Tage",
            dayRate: "85000",
            description:
              "Hochleistungs-Bohranlage für Tiefbohrungen und extreme Lasten",
            applications: [
              "Tiefbohrungen",
              "Offshore",
              "Hochdruck-Formationen",
            ],
            technicalSpecs:
              "API 4F Zertifizierung, DNV-GL Standard, vollautomatisches Pipe Handling",
          },
          {
            id: "t46",
            name: "T46",
            category: "Schwerlast",
            maxDepth: 6000,
            maxHookLoad: 460,
            footprint: "Groß",
            rotaryTorque: 65000,
            pumpPressure: 7000,
            drawworks: "1500 HP",
            mudPumps: "2x 1600 HP Triplex",
            topDrive: "750 HP",
            derrickCapacity: "650 t",
            crewSize: "40-45",
            mobilizationTime: "25-35 Tage",
            dayRate: "65000",
            description:
              "Vielseitige Schwerlast-Bohranlage für mittlere bis tiefe Bohrungen",
            applications: [
              "Mittlere Tiefbohrungen",
              "Onshore",
              "Standardformationen",
            ],
            technicalSpecs:
              "API 8C Zertifizierung, automatisches Roughneck System",
          },
          {
            id: "t203",
            name: "T203",
            category: "Mittlere Leistung",
            maxDepth: 4500,
            maxHookLoad: 350,
            footprint: "Mittel",
            rotaryTorque: 45000,
            pumpPressure: 5500,
            drawworks: "1200 HP",
            mudPumps: "2x 1200 HP Triplex",
            topDrive: "500 HP",
            derrickCapacity: "450 t",
            crewSize: "30-35",
            mobilizationTime: "20-25 Tage",
            dayRate: "48000",
            description: "Ausgewogene Lösung für mittlere Bohrtiefen",
            applications: [
              "Mittlere Bohrungen",
              "Onshore",
              "Vielseitig einsetzbar",
            ],
            technicalSpecs: "Kompaktes Design, modularer Aufbau",
          },
          {
            id: "t208",
            name: "T208",
            category: "Kompakt",
            maxDepth: 3000,
            maxHookLoad: 208,
            footprint: "Klein",
            rotaryTorque: 28000,
            pumpPressure: 4500,
            drawworks: "750 HP",
            mudPumps: "1x 1000 HP Triplex",
            topDrive: "350 HP",
            derrickCapacity: "250 t",
            crewSize: "20-25",
            mobilizationTime: "10-15 Tage",
            dayRate: "32000",
            description: "Kompakte Bohranlage für begrenzte Platzverhältnisse",
            applications: [
              "Flache Bohrungen",
              "Platzbeschränkte Standorte",
              "Workover",
            ],
            technicalSpecs: "Schnelle Mobilisierung, minimaler Footprint",
          },
          {
            id: "t207",
            name: "T207",
            category: "Kompakt",
            maxDepth: 2800,
            maxHookLoad: 207,
            footprint: "Klein",
            rotaryTorque: 25000,
            pumpPressure: 4200,
            drawworks: "700 HP",
            mudPumps: "1x 900 HP Triplex",
            topDrive: "300 HP",
            derrickCapacity: "230 t",
            crewSize: "18-22",
            mobilizationTime: "8-12 Tage",
            dayRate: "28000",
            description:
              "Platzsparende Lösung für flache bis mittlere Bohrungen",
            applications: [
              "Flache Bohrungen",
              "Enge Standorte",
              "Wartungsarbeiten",
            ],
            technicalSpecs: "Containerbasiert, schneller Auf-/Abbau",
          },
        ]);
      } finally {
        setLoadingRigs(false);
      }
    };

    loadRigsFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load users for quick action assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiClient.request<
          Array<{
            id: string;
            email: string;
            firstName: string;
            lastName: string;
          }>
        >("/users/list");
        setUsers(response);
      } catch (error) {
        console.error("Fehler beim Laden der User:", error);
      }
    };
    loadUsers();
  }, []);

  // LocalStorage: Speichere Equipment-Daten bei Änderungen
  useEffect(() => {
    if (Object.keys(equipmentCategories).length > 0) {
      localStorage.setItem(
        "rigConfigurator_equipment",
        JSON.stringify(equipmentCategories)
      );
    }
  }, [equipmentCategories]);

  // Equipment-Management Funktionen
  const openAddEquipmentDialog = (category: string) => {
    setSelectedCategory(category);
    setEquipmentFormMode("add");
    setEquipmentForm({
      id: `${category}_${Date.now()}`,
      name: "",
      price: "",
    });
    setEquipmentDialogOpen(true);
  };

  const openEditEquipmentDialog = (category: string, item: EquipmentItem) => {
    setSelectedCategory(category);
    setEquipmentFormMode("edit");
    setEquipmentForm({ ...item } as Record<string, string>);
    setEquipmentDialogOpen(true);
  };

  const saveEquipmentItem = () => {
    if (!selectedCategory || !equipmentForm.name || !equipmentForm.price) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setEquipmentCategories((prev) => {
      const category = prev[selectedCategory as keyof typeof prev];
      if (!category) return prev;

      const updatedCategory = {
        ...category,
        items:
          equipmentFormMode === "add"
            ? [
                ...(category as { items: EquipmentItem[] }).items,
                equipmentForm as EquipmentItem,
              ]
            : (category as { items: EquipmentItem[] }).items.map((item) =>
                item.id === equipmentForm.id
                  ? (equipmentForm as EquipmentItem)
                  : item
              ),
      };

      return {
        ...prev,
        [selectedCategory]: updatedCategory,
      };
    });

    toast({
      title:
        equipmentFormMode === "add"
          ? "Equipment hinzugefügt"
          : "Equipment aktualisiert",
      description: `${equipmentForm.name} wurde erfolgreich ${
        equipmentFormMode === "add" ? "hinzugefügt" : "aktualisiert"
      }.`,
    });

    closeEquipmentDialog();
  };

  const deleteEquipmentItem = (category: string, itemId: string) => {
    if (!confirm("Möchten Sie dieses Equipment wirklich löschen?")) return;

    setEquipmentCategories((prev) => {
      const cat = prev[category as keyof typeof prev];
      if (!cat) return prev;

      return {
        ...prev,
        [category]: {
          ...cat,
          items: (cat as { items: EquipmentItem[] }).items.filter(
            (item) => item.id !== itemId
          ),
        },
      };
    });

    toast({
      title: "Equipment gelöscht",
      description: "Das Equipment wurde erfolgreich entfernt.",
    });
  };

  const closeEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setSelectedCategory("");
    setEquipmentForm({ id: "", name: "", price: "" });
  };

  // Quick Action Functions
  const openQuickActionDialog = (
    categoryKey: string,
    equipmentItem: EquipmentItem
  ) => {
    const categoryName =
      equipmentCategories[categoryKey as keyof typeof equipmentCategories]
        ?.name || categoryKey;
    setQuickActionEquipment({
      categoryName,
      equipmentName: equipmentItem.name,
    });
    setQuickActionForm({
      assignedTo: "",
      description: `Tender-Arbeit für ${equipmentItem.name}`,
    });
    setQuickActionDialogOpen(true);
  };

  const createQuickAction = async () => {
    if (!quickActionForm.assignedTo || !quickActionEquipment) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Benutzer aus.",
        variant: "destructive",
      });
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
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 7 Tage
        }),
      });

      toast({
        title: "Action erstellt",
        description: `Tender-Aufgabe für ${quickActionEquipment.equipmentName} wurde erstellt.`,
      });

      setQuickActionDialogOpen(false);
      setQuickActionForm({ assignedTo: "", description: "" });
      setQuickActionEquipment(null);
    } catch {
      toast({
        title: "Fehler",
        description: "Action konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  // Preisbearbeitungs-Funktionen
  const openRigPriceEdit = (rig: Rig) => {
    setEditingRig(rig);
    setTempPrice(rig.dayRate);
    setEditPriceDialogOpen(true);
  };

  const savePrice = () => {
    if (editingRig) {
      // Rig-Preis aktualisieren
      setRigs((prevRigs) =>
        prevRigs.map((r) =>
          r.id === editingRig.id ? { ...r, dayRate: tempPrice } : r
        )
      );

      // Wenn das bearbeitete Rig ausgewählt ist, auch selectedRig aktualisieren
      if (selectedRig?.id === editingRig.id) {
        setSelectedRig({ ...editingRig, dayRate: tempPrice });
      }

      toast({
        title: "Preis aktualisiert",
        description: `Tagesrate für ${editingRig.name} wurde auf €${parseFloat(
          tempPrice
        ).toLocaleString("de-DE")} gesetzt.`,
      });
    } else if (editingEquipmentCategory && editingEquipmentItem) {
      // Equipment-Preis aktualisieren
      setEquipmentCategories((prev) => ({
        ...prev,
        [editingEquipmentCategory]: {
          ...prev[editingEquipmentCategory as keyof typeof prev],
          items: (
            prev[editingEquipmentCategory as keyof typeof prev] as {
              items: EquipmentItem[];
            }
          ).items.map((item) =>
            item.id === editingEquipmentItem.id
              ? { ...item, price: tempPrice }
              : item
          ),
        },
      }));

      toast({
        title: "Preis aktualisiert",
        description: `Preis für ${
          editingEquipmentItem.name
        } wurde auf €${parseFloat(tempPrice).toLocaleString("de-DE")} gesetzt.`,
      });
    }

    closeEditDialog();
  };

  const closeEditDialog = () => {
    setEditPriceDialogOpen(false);
    setEditingRig(null);
    setEditingEquipmentCategory(null);
    setEditingEquipmentItem(null);
    setTempPrice("");
  };

  // Rig Edit Functions (Admin only)
  const openRigEdit = (rig: Rig) => {
    setEditingRigData({ ...rig });
    setRigEditDialogOpen(true);
  };

  const saveRigChanges = async () => {
    if (!editingRigData || !isAdmin) {
      toast({
        title: "Fehler",
        description: "Nur Administratoren können Rigs bearbeiten.",
        variant: "destructive",
      });
      return;
    }

    setSavingRig(true);
    try {
      const result = await rigService.updateRig(editingRigData.id, {
        // Technical Main Specifications
        maxDepth: editingRigData.maxDepth,
        maxHookLoad: editingRigData.maxHookLoad,
        rotaryTorque: editingRigData.rotaryTorque,
        pumpPressure: editingRigData.pumpPressure,
        // Equipment Details
        drawworks: editingRigData.drawworks,
        mudPumps: editingRigData.mudPumps,
        topDrive: editingRigData.topDrive,
        derrickCapacity: editingRigData.derrickCapacity,
        crewSize: editingRigData.crewSize,
        mobilizationTime: editingRigData.mobilizationTime,
        dayRate: editingRigData.dayRate,
      });

      if (result.success) {
        // Update local state
        setRigs((prevRigs) =>
          prevRigs.map((r) => (r.id === editingRigData.id ? result.data : r))
        );

        // Update selected rig if necessary
        if (selectedRig?.id === editingRigData.id) {
          setSelectedRig(result.data);
        }

        toast({
          title: "Erfolgreich gespeichert",
          description: `Änderungen an ${editingRigData.name} wurden im Backend gespeichert.`,
        });

        setRigEditDialogOpen(false);
        setEditingRigData(null);
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Backend-Fehler. Änderungen wurden nicht gespeichert.";
      toast({
        title: "Speichern fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingRig(false);
    }
  };

  const closeRigEditDialog = () => {
    setRigEditDialogOpen(false);
    setEditingRigData(null);
  };

  // Rig Matching Logic - Zeige immer alle Rigs
  const matchedRigs = useMemo(() => {
    const depth = parseFloat(requirements.depth) || 0;
    const hookLoad = parseFloat(requirements.hookLoad) || 0;
    const torque = parseFloat(requirements.rotaryTorque) || 0;
    const pressure = parseFloat(requirements.pumpPressure) || 0;

    // Wenn keine Anforderungen eingegeben wurden, zeige alle Rigs ohne Bewertung
    if (depth === 0 && hookLoad === 0 && torque === 0 && pressure === 0) {
      return rigs.map((rig) => ({
        ...rig,
        score: 0,
        warnings: [],
        isSuitable: false,
      }));
    }

    const evaluated = rigs.map((rig) => {
      let score = 0;
      const warnings: string[] = [];

      // Depth Scoring - bevorzuge Rigs, die näher an der Anforderung sind
      if (depth > 0) {
        if (rig.maxDepth >= depth) {
          // Base score für Erfüllung
          score += 25;
          // Bonus: Je näher an der Anforderung, desto besser (max +10)
          // Formel: 10 - (Überschuss / Anforderung * 10), mindestens 0
          const excess = rig.maxDepth - depth;
          const excessRatio = excess / depth;
          const proximityBonus = Math.max(0, 10 - excessRatio * 10);
          score += proximityBonus;
        } else {
          warnings.push(`Tiefe überschreitet Maximum (${rig.maxDepth}m)`);
        }
      }

      // Hook Load Scoring - bevorzuge Rigs, die näher an der Anforderung sind
      if (hookLoad > 0) {
        if (rig.maxHookLoad >= hookLoad) {
          score += 25;
          const excess = rig.maxHookLoad - hookLoad;
          const excessRatio = excess / hookLoad;
          const proximityBonus = Math.max(0, 10 - excessRatio * 10);
          score += proximityBonus;
        } else {
          warnings.push(`Hakenlast zu hoch (Max: ${rig.maxHookLoad}t)`);
        }
      }

      // Torque Scoring - bevorzuge Rigs, die näher an der Anforderung sind
      if (torque > 0) {
        if (rig.rotaryTorque >= torque) {
          score += 25;
          const excess = rig.rotaryTorque - torque;
          const excessRatio = excess / torque;
          const proximityBonus = Math.max(0, 10 - excessRatio * 10);
          score += proximityBonus;
        } else {
          warnings.push("Drehmoment unzureichend");
        }
      }

      // Pressure Scoring - bevorzuge Rigs, die näher an der Anforderung sind
      if (pressure > 0) {
        if (rig.pumpPressure >= pressure) {
          score += 25;
          const excess = rig.pumpPressure - pressure;
          const excessRatio = excess / pressure;
          const proximityBonus = Math.max(0, 10 - excessRatio * 10);
          score += proximityBonus;
        } else {
          warnings.push("Pumpendruck zu niedrig");
        }
      }

      // Footprint exact match bonus
      if (requirements.footprint && rig.footprint === requirements.footprint) {
        score += 5;
      } else if (
        requirements.footprint &&
        rig.footprint !== requirements.footprint
      ) {
        score -= 10;
      }

      return {
        ...rig,
        score,
        warnings,
        isSuitable: warnings.length === 0 && score > 0,
      };
    });

    // Sort by score (highest first), then by warnings (fewest first)
    return evaluated.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.warnings.length - b.warnings.length;
    });
  }, [requirements, rigs]);

  // Equipment Toggle
  const toggleEquipment = (category: string, item: EquipmentItem) => {
    setSelectedEquipment((prev) => {
      const current = prev[category] || [];
      const exists = current.find((i) => i.id === item.id);

      if (exists) {
        return { ...prev, [category]: current.filter((i) => i.id !== item.id) };
      } else {
        return { ...prev, [category]: [...current, item] };
      }
    });
  };

  // Calculate Total Cost
  const calculateTotal = () => {
    let total = 0;
    if (selectedRig) {
      total += parseFloat(selectedRig.dayRate);
    }
    Object.values(selectedEquipment).forEach((items) => {
      items.forEach((item) => {
        total += parseFloat(item.price);
      });
    });
    return total;
  };

  // Tender Management Functions
  const saveCurrentConfiguration = async () => {
    if (!selectedRig || !requirements.projectName) {
      toast({
        title: "❌ Unvollständige Konfiguration",
        description:
          "Bitte wählen Sie eine Rig aus und geben Sie einen Projektnamen ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTender = await tenderService.createTender({
        projectName: requirements.projectName,
        clientName: requirements.clientName,
        location: requirements.location,
        projectDuration: requirements.projectDuration,
        selectedRig: selectedRig,
        selectedEquipment: selectedEquipment,
        totalPrice: calculateTotal(),
        isUnderContract: false,
        notes: "",
      });

      setSavedConfigurations((prev) => [...prev, newTender]);
      toast({
        title: "✅ Konfiguration gespeichert",
        description: `Tender-Konfiguration für "${requirements.projectName}" wurde gespeichert.`,
      });
    } catch (error) {
      console.error("Error saving tender:", error);
      toast({
        title: "❌ Fehler beim Speichern",
        description:
          "Die Tender-Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const toggleContractStatus = async (configId: string) => {
    console.log("🔄 toggleContractStatus called with:", configId);
    const config = savedConfigurations.find((c) => c.id === configId);
    if (!config) {
      console.log("❌ Config not found");
      return;
    }

    console.log("📋 Config found:", {
      name: config.selectedRig?.name,
      isUnderContract: config.isUnderContract,
    });

    // Wenn von "Ausstehend" zu "Unter Vertrag" gewechselt wird
    if (!config.isUnderContract) {
      console.log("✅ Opening contract date dialog");
      setPendingContractConfig(config);
      setContractStartDate(new Date());
      setContractDateDialogOpen(true);
    } else {
      // Wenn von "Unter Vertrag" zu "Ausstehend" gewechselt wird
      try {
        const updatedTender = await tenderService.updateTender(configId, {
          isUnderContract: false,
          contractStartDate: "",
        });
        setSavedConfigurations((prev) =>
          prev.map((c) => (c.id === configId ? updatedTender : c))
        );
        toast({
          title: "✅ Status geändert",
          description: "Anlage ist nicht mehr unter Vertrag.",
        });
      } catch (error) {
        console.error("Error toggling contract status:", error);
        toast({
          title: "❌ Fehler",
          description: "Der Vertragsstatus konnte nicht geändert werden.",
          variant: "destructive",
        });
      }
    }
  };

  // Confirm Contract Start Date
  const confirmContractStartDate = async () => {
    console.log("🔵 confirmContractStartDate called", {
      pendingContractConfig,
      contractStartDate,
      isSubmittingContract,
    });

    if (!pendingContractConfig || !contractStartDate || isSubmittingContract) {
      console.log("❌ Missing data or already submitting:", {
        hasPendingConfig: !!pendingContractConfig,
        hasContractDate: !!contractStartDate,
        isSubmitting: isSubmittingContract,
      });
      return;
    }

    setIsSubmittingContract(true);

    try {
      console.log("📤 Sending update request...");
      const updatedTender = await tenderService.updateTender(
        pendingContractConfig.id,
        {
          isUnderContract: true,
          contractStartDate: contractStartDate.toISOString(),
        }
      );

      console.log("✅ Update successful:", updatedTender);

      setSavedConfigurations((prev) =>
        prev.map((config) =>
          config.id === pendingContractConfig.id ? updatedTender : config
        )
      );

      toast({
        title: "✅ Vertrag gestartet",
        description: `Anlage ist ab ${contractStartDate.toLocaleDateString(
          "de-DE"
        )} unter Vertrag.`,
      });

      setContractDateDialogOpen(false);
      setPendingContractConfig(null);
      setContractStartDate(undefined);
    } catch (error) {
      console.error("❌ Error setting contract status:", error);
      toast({
        title: "❌ Fehler",
        description: "Der Vertragsstatus konnte nicht gesetzt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingContract(false);
    }
  };

  const viewTenderDetails = (config: TenderConfiguration) => {
    setSelectedTenderConfig(config);
    setTenderDetailDialogOpen(true);
  };

  const deleteTenderConfiguration = async (configId: string) => {
    try {
      await tenderService.deleteTender(configId);
      setSavedConfigurations((prev) =>
        prev.filter((config) => config.id !== configId)
      );
      toast({
        title: "🗑️ Konfiguration gelöscht",
        description: "Die Tender-Konfiguration wurde erfolgreich entfernt.",
      });
    } catch (error) {
      console.error("Error deleting tender:", error);
      toast({
        title: "❌ Fehler beim Löschen",
        description: "Die Tender-Konfiguration konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Open Equipment Management Dialog for Tender
  const openEquipmentManagement = (config: TenderConfiguration) => {
    setEditingTenderConfig(config);
    setTempEquipmentSelection(config.selectedEquipment || {});
    setEquipmentManagementDialogOpen(true);
  };

  // Save Equipment Changes to Tender
  const saveEquipmentChanges = async () => {
    if (!editingTenderConfig) return;

    try {
      const updatedConfig = {
        ...editingTenderConfig,
        selectedEquipment: tempEquipmentSelection,
      };

      await tenderService.updateTender(editingTenderConfig.id, updatedConfig);

      setSavedConfigurations((prev) =>
        prev.map((config) =>
          config.id === editingTenderConfig.id ? updatedConfig : config
        )
      );

      toast({
        title: "✅ Equipment aktualisiert",
        description: "Die Equipment-Konfiguration wurde gespeichert.",
      });

      setEquipmentManagementDialogOpen(false);
      setEditingTenderConfig(null);
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast({
        title: "❌ Fehler beim Speichern",
        description: "Equipment-Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  // Calculate Tender Duration in Days
  const calculateTenderDuration = (config: TenderConfiguration) => {
    if (!config.projectDuration) return 0;
    const match = config.projectDuration.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  // Calculate Days Elapsed (using createdAt as start date)
  const calculateDaysElapsed = (config: TenderConfiguration) => {
    if (!config.createdAt) return 0;
    const start = new Date(config.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Generate PDF Export
  const exportConfiguration = () => {
    if (!selectedRig) {
      toast({
        title: "❌ Keine Anlage ausgewählt",
        description: "Bitte wählen Sie zuerst eine Bohranlage aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const filename = `Angebot-${requirements.clientName || "Kunde"}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      rigQuoteExportService.generateQuote(
        {
          projectName: requirements.projectName,
          clientName: requirements.clientName,
          location: requirements.location,
          projectDuration: requirements.projectDuration,
          selectedRig: selectedRig,
          selectedEquipment: selectedEquipment as {
            [category: string]: Array<{
              name: string;
              price: string;
              [key: string]: string;
            }>;
          },
          additionalNotes: requirements.additionalNotes,
        },
        filename
      );

      toast({
        title: "✅ Angebot erstellt",
        description: `PDF wurde erfolgreich generiert: ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "❌ Export fehlgeschlagen",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Bohranlagen Konfigurator
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Professionelle Anlagenkonfiguration für Commerce
              </p>
            </div>
            <Card className="px-4 sm:px-6 py-3 sm:py-4 w-full lg:w-auto">
              <div className="text-center lg:text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gesamtpreis (Tagesrate)
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  € {calculateTotal().toLocaleString("de-DE")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="requirements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger
              value="requirements"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Anforderungen</span>
            </TabsTrigger>
            <TabsTrigger
              value="rigs"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">
                Anlagen ({matchedRigs.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!selectedRig}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Equipment</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!selectedRig}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">Zusammenfassung</span>
            </TabsTrigger>
            <TabsTrigger
              value="tender"
              className="flex flex-col gap-1 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground col-span-2 sm:col-span-1"
            >
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs">
                Tender ({savedConfigurations.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Requirements */}
          <TabsContent value="requirements" className="space-y-6">
            <Card className="border-2">
              <CardHeader className="bg-muted/50">
                <CardTitle>Projekt-Anforderungen</CardTitle>
                <CardDescription>
                  Geben Sie die Projekt-Details und Bohr-Parameter ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Project Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Projektname *</Label>
                    <Input
                      id="projectName"
                      value={requirements.projectName}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          projectName: e.target.value,
                        })
                      }
                      placeholder="z.B. North Sea Project"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Kunde *</Label>
                    <Input
                      id="clientName"
                      value={requirements.clientName}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          clientName: e.target.value,
                        })
                      }
                      placeholder="Kundenname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Standort *</Label>
                    <Input
                      id="location"
                      value={requirements.location}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          location: e.target.value,
                        })
                      }
                      placeholder="Bohrstandort"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Projektdauer</Label>
                    <Input
                      id="duration"
                      value={requirements.projectDuration}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          projectDuration: e.target.value,
                        })
                      }
                      placeholder="z.B. 90 Tage"
                    />
                  </div>
                </div>

                <Separator />

                {/* Technical Parameters */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Technische Parameter
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="depth">Bohrtiefe (m) *</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={requirements.depth}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            depth: e.target.value,
                          })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hookLoad">Hakenlast (t) *</Label>
                      <Input
                        id="hookLoad"
                        type="number"
                        value={requirements.hookLoad}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            hookLoad: e.target.value,
                          })
                        }
                        placeholder="400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footprint">Platzbedarf</Label>
                      <Select
                        value={requirements.footprint}
                        onValueChange={(value) =>
                          setRequirements({
                            ...requirements,
                            footprint: value as
                              | ""
                              | "Klein"
                              | "Mittel"
                              | "Groß",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Klein">Klein</SelectItem>
                          <SelectItem value="Mittel">Mittel</SelectItem>
                          <SelectItem value="Groß">Groß</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="torque">Rotary-Drehmoment (Nm)</Label>
                      <Input
                        id="torque"
                        type="number"
                        value={requirements.rotaryTorque}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            rotaryTorque: e.target.value,
                          })
                        }
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pressure">Pumpendruck (psi)</Label>
                      <Input
                        id="pressure"
                        type="number"
                        value={requirements.pumpPressure}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            pumpPressure: e.target.value,
                          })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mudWeight">Spülungsgewicht (ppg)</Label>
                      <Input
                        id="mudWeight"
                        type="number"
                        step="0.1"
                        value={requirements.mudWeight}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            mudWeight: e.target.value,
                          })
                        }
                        placeholder="12.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="casingSize">Casing Größe (")</Label>
                      <Input
                        id="casingSize"
                        value={requirements.casingSize}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            casingSize: e.target.value,
                          })
                        }
                        placeholder='13 3/8"'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="holeSize">Bohrloch Größe (")</Label>
                      <Input
                        id="holeSize"
                        value={requirements.holeSize}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            holeSize: e.target.value,
                          })
                        }
                        placeholder='17 1/2"'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formPressure">
                        Formationsdruck (psi)
                      </Label>
                      <Input
                        id="formPressure"
                        type="number"
                        value={requirements.formationPressure}
                        onChange={(e) =>
                          setRequirements({
                            ...requirements,
                            formationPressure: e.target.value,
                          })
                        }
                        placeholder="8000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Zusätzliche Anforderungen</Label>
                  <Textarea
                    id="notes"
                    value={requirements.additionalNotes}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        additionalNotes: e.target.value,
                      })
                    }
                    placeholder="Spezielle Anforderungen, Besonderheiten..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={!requirements.depth && !requirements.hookLoad}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Passende Anlagen finden ({matchedRigs.length})
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setRequirements({
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
                      });
                      setSelectedRig(null);
                    }}
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Rigs */}
          <TabsContent value="rigs" className="space-y-4">
            {matchedRigs.map((rig, index) => (
              <Card
                key={rig.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedRig?.id === rig.id
                    ? "ring-2 ring-primary shadow-lg border-primary"
                    : "hover:shadow-md hover:border-primary/50"
                } ${
                  rig.isSuitable && index === 0
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : ""
                }`}
                onClick={() => setSelectedRig(rig)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{rig.name}</CardTitle>
                        <Badge variant="secondary">{rig.category}</Badge>
                        {rig.isSuitable && index === 0 && (
                          <Badge className="bg-green-500">EMPFEHLUNG</Badge>
                        )}
                        {selectedRig?.id === rig.id && (
                          <Badge className="bg-blue-500">AUSGEWÄHLT</Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {rig.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tagesrate</p>
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-2xl font-bold text-green-600">
                          € {parseFloat(rig.dayRate).toLocaleString("de-DE")}
                        </p>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRigPriceEdit(rig);
                              }}
                              className="h-8 w-8 p-0"
                              title="Preis bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRigEdit(rig);
                              }}
                              className="h-8 px-3"
                              title="Rig bearbeiten"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Admin
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        MAX. TIEFE
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {rig.maxDepth.toLocaleString()} m
                      </p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        HAKENLAST
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {rig.maxHookLoad} t
                      </p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        DREHMOMENT
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {rig.rotaryTorque.toLocaleString()} Nm
                      </p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        PUMPENDRUCK
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {rig.pumpPressure.toLocaleString()} psi
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Drawworks</p>
                      <p className="font-semibold">{rig.drawworks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mud Pumps</p>
                      <p className="font-semibold">{rig.mudPumps}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Top Drive</p>
                      <p className="font-semibold">{rig.topDrive}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Crew Size</p>
                      <p className="font-semibold">{rig.crewSize}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mobilisierung</p>
                      <p className="font-semibold">{rig.mobilizationTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Platzbedarf</p>
                      <p className="font-semibold">{rig.footprint}</p>
                    </div>
                  </div>

                  {rig.warnings && rig.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        ⚠️ Hinweise:
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                        {rig.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {rig.applications.map((app) => (
                      <Badge key={app} variant="outline">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab 3: Equipment */}
          <TabsContent value="equipment" className="space-y-4">
            <Card className="border-2">
              <CardHeader className="bg-muted/50">
                <CardTitle>Zusatzausrüstung wählen</CardTitle>
                <CardDescription>
                  Wählen Sie die benötigte Zusatzausrüstung für Ihr Projekt
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                  <div className="space-y-4">
                    {Object.entries(equipmentCategories).map(
                      ([key, category]) => {
                        const Icon = equipmentCategoryIcons[key] || Package;
                        const selected = selectedEquipment[key] || [];

                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-blue-600" />
                                <h3 className="text-base font-semibold">
                                  {category.name}
                                </h3>
                                {selected.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {selected.length}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openAddEquipmentDialog(key)}
                                className="gap-1 h-8 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Hinzufügen
                              </Button>
                            </div>
                            <div className="space-y-1.5">
                              {category.items.map((item) => {
                                const isSelected = selected.some(
                                  (s) => s.id === item.id
                                );
                                return (
                                  <div
                                    key={item.id}
                                    className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-primary/5 border-primary"
                                        : "hover:bg-muted/50 hover:border-muted-foreground/20"
                                    }`}
                                    onClick={() => toggleEquipment(key, item)}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {Object.entries(item)
                                          .filter(
                                            ([key]) =>
                                              key !== "id" &&
                                              key !== "name" &&
                                              key !== "price"
                                          )
                                          .map(([, value]) => value)
                                          .join(" • ")}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="flex items-center gap-1.5">
                                        <div>
                                          <p className="font-bold text-green-600 text-sm">
                                            €{" "}
                                            {parseFloat(
                                              item.price
                                            ).toLocaleString("de-DE")}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground">
                                            /Tag
                                          </p>
                                        </div>
                                        <div className="flex gap-0.5">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openQuickActionDialog(key, item);
                                            }}
                                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                            title="Tender-Aufgabe erstellen"
                                          >
                                            <ClipboardList className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditEquipmentDialog(
                                                key,
                                                item
                                              );
                                            }}
                                            className="h-7 w-7 p-0"
                                            title="Equipment bearbeiten"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteEquipmentItem(key, item.id);
                                            }}
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            title="Equipment löschen"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <Separator className="mt-3" />
                          </div>
                        );
                      }
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Summary */}
          <TabsContent value="summary" className="space-y-4">
            <Card className="border-2">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Konfigurations-Zusammenfassung</CardTitle>
                    <CardDescription>
                      Überprüfen Sie Ihre Auswahl und erstellen Sie ein
                      professionelles Angebot
                    </CardDescription>
                  </div>
                  <Button
                    onClick={exportConfiguration}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileDown className="mr-2 h-5 w-5" />
                    Angebot als PDF erstellen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Projekt-Informationen
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Projektname</p>
                      <p className="font-semibold">
                        {requirements.projectName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kunde</p>
                      <p className="font-semibold">
                        {requirements.clientName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Standort</p>
                      <p className="font-semibold">
                        {requirements.location || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dauer</p>
                      <p className="font-semibold">
                        {requirements.projectDuration || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Selected Rig */}
                {selectedRig && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Ausgewählte Anlage
                    </h3>
                    <div className="bg-primary/5 border-2 border-primary rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold">
                          {selectedRig?.name || "Kein Rig ausgewählt"}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          €{" "}
                          {selectedRig
                            ? parseFloat(selectedRig.dayRate).toLocaleString(
                                "de-DE"
                              )
                            : "0"}
                          /Tag
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedRig?.description ||
                          "Keine Beschreibung verfügbar"}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Max. Tiefe</p>
                          <p className="font-semibold">
                            {selectedRig.maxDepth}m
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hakenlast</p>
                          <p className="font-semibold">
                            {selectedRig.maxHookLoad}t
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Crew</p>
                          <p className="font-semibold">
                            {selectedRig.crewSize}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mobilisierung</p>
                          <p className="font-semibold">
                            {selectedRig.mobilizationTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Selected Equipment */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Ausgewählte Zusatzausrüstung
                  </h3>
                  {Object.entries(selectedEquipment).filter(
                    ([, items]) => items.length > 0
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine Zusatzausrüstung ausgewählt
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(selectedEquipment)
                        .filter(([, items]) => items.length > 0)
                        .map(([key, items]) => {
                          const category =
                            equipmentCategories[
                              key as keyof typeof equipmentCategories
                            ];
                          return (
                            <div key={key}>
                              <p className="font-semibold text-sm mb-2">
                                {category.name}
                              </p>
                              <div className="space-y-1">
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                                  >
                                    <span>{item.name}</span>
                                    <span className="font-semibold text-green-600">
                                      €{" "}
                                      {parseFloat(item.price).toLocaleString(
                                        "de-DE"
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cost Summary */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Kosten-Übersicht (Tagesraten)
                  </h3>
                  <div className="space-y-2 text-sm mb-4">
                    {selectedRig && (
                      <div className="flex justify-between">
                        <span>Bohranlage {selectedRig.name}</span>
                        <span className="font-semibold">
                          €{" "}
                          {parseFloat(selectedRig.dayRate).toLocaleString(
                            "de-DE"
                          )}
                        </span>
                      </div>
                    )}
                    {Object.values(selectedEquipment).flat().length > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Zusatzausrüstung (
                          {Object.values(selectedEquipment).flat().length}{" "}
                          Positionen)
                        </span>
                        <span className="font-semibold">
                          €{" "}
                          {Object.values(selectedEquipment)
                            .flat()
                            .reduce(
                              (sum, item) => sum + parseFloat(item.price),
                              0
                            )
                            .toLocaleString("de-DE")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Gesamt Tagesrate</span>
                    <span className="text-3xl font-bold text-primary">
                      € {calculateTotal().toLocaleString("de-DE")}
                    </span>
                  </div>
                  {requirements.projectDuration && (
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          Projektkosten ({requirements.projectDuration})
                        </span>
                        <span className="text-xl font-bold text-primary">
                          €{" "}
                          {(
                            calculateTotal() *
                            parseInt(
                              requirements.projectDuration.replace(/\D/g, "") ||
                                "0"
                            )
                          ).toLocaleString("de-DE")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Tender Overview */}
          <TabsContent value="tender" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                      <Calculator className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Tender-Management
                      </CardTitle>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                        Professionelle Verwaltung aller
                        Bohranlage-Konfigurationen und Vertragsstatus
                      </CardDescription>
                    </div>
                  </div>
                  {savedConfigurations.length > 0 && (
                    <div className="flex items-center gap-4 text-sm bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="font-medium">
                          Unter Vertrag:{" "}
                          {
                            savedConfigurations.filter((c) => c.isUnderContract)
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                        <span className="font-medium">
                          Ausstehend:{" "}
                          {
                            savedConfigurations.filter(
                              (c) => !c.isUnderContract
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* View Toggle and Save Button */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={!showGanttView ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGanttView(false)}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Tabelle
                      </Button>
                      <Button
                        variant={showGanttView ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGanttView(true)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Gantt-Ansicht
                      </Button>
                    </div>

                    {/* Save Configuration Button */}
                    {selectedRig && requirements.projectName && (
                      <Button
                        onClick={saveCurrentConfiguration}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Aktuelle Konfiguration als Tender speichern
                      </Button>
                    )}
                  </div>

                  {/* Gantt Chart View */}
                  {showGanttView &&
                    savedConfigurations.some((c) => c.isUnderContract) && (
                      <Card className="border-2 border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Vertragslaufzeiten - Gantt-Diagramm
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {savedConfigurations
                              .filter(
                                (c) => c.isUnderContract && c.contractStartDate
                              )
                              .map((config) => {
                                const duration =
                                  calculateTenderDuration(config);
                                const elapsed = calculateDaysElapsed(config);
                                const progress =
                                  duration > 0
                                    ? Math.min((elapsed / duration) * 100, 100)
                                    : 0;

                                return (
                                  <div key={config.id} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                          {config.selectedRig?.name}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {config.projectName}
                                        </Badge>
                                      </div>
                                      <span className="text-muted-foreground">
                                        {elapsed} / {duration} Tage (
                                        {progress.toFixed(0)}%)
                                      </span>
                                    </div>
                                    <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                                      <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                      >
                                        <div className="h-full flex items-center justify-end pr-2">
                                          {progress > 15 && (
                                            <span className="text-xs font-semibold text-white">
                                              {progress.toFixed(0)}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>
                                        Start:{" "}
                                        {new Date(
                                          config.contractStartDate!
                                        ).toLocaleDateString("de-DE")}
                                      </span>
                                      <span>
                                        Ende:{" "}
                                        {new Date(
                                          new Date(
                                            config.contractStartDate!
                                          ).getTime() +
                                            duration * 24 * 60 * 60 * 1000
                                        ).toLocaleDateString("de-DE")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {/* Tender Table */}
                  {!showGanttView && (
                    <div className="rounded-xl border-2 border-primary/20 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                              <th className="text-left p-4 font-bold text-primary">
                                Rig & Projekt
                              </th>
                              <th className="text-left p-4 font-bold text-primary">
                                Tagesrate Details
                              </th>
                              <th className="text-left p-4 font-bold text-primary">
                                Dauer
                              </th>
                              <th className="text-left p-4 font-bold text-primary">
                                Status
                              </th>
                              <th className="text-left p-4 font-bold text-primary">
                                Aktionen
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Current Configuration Row (if exists) */}
                            {selectedRig && requirements.projectName && (
                              <tr className="border-b bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {selectedRig.name}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Aktuelle Konfiguration
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {requirements.projectName}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                                        Rig Basis:
                                      </span>
                                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                                        €
                                        {parseFloat(
                                          selectedRig.dayRate
                                        ).toLocaleString("de-DE")}
                                        /Tag
                                      </span>
                                    </div>
                                    {Object.values(selectedEquipment).flat()
                                      .length > 0 && (
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                                          Equipment (
                                          {
                                            Object.values(
                                              selectedEquipment
                                            ).flat().length
                                          }
                                          ):
                                        </span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                                          €
                                          {Object.values(selectedEquipment)
                                            .flat()
                                            .reduce(
                                              (sum, eq) =>
                                                sum + parseFloat(eq.price),
                                              0
                                            )
                                            .toLocaleString("de-DE")}
                                          /Tag
                                        </span>
                                      </div>
                                    )}
                                    <div className="border-t pt-2 mt-2">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                          Gesamtsumme:
                                        </span>
                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                          €
                                          {calculateTotal().toLocaleString(
                                            "de-DE"
                                          )}
                                          /Tag
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {requirements.projectDuration}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 border-yellow-300"
                                  >
                                    Ausstehend
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <Button
                                    size="sm"
                                    onClick={saveCurrentConfiguration}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Speichern
                                  </Button>
                                </td>
                              </tr>
                            )}

                            {/* Configurations NOT under contract - Yellow highlight */}
                            {savedConfigurations
                              .filter((config) => !config.isUnderContract)
                              .map((config) => (
                                <tr
                                  key={config.id}
                                  className="border-b bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer"
                                  onClick={() => viewTenderDetails(config)}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="border-yellow-500 text-yellow-700"
                                      >
                                        {config.selectedRig?.name ||
                                          "Unbekanntes Rig"}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-yellow-700 font-medium mt-1">
                                      {config.projectName}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm space-y-2">
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                                          Rig Basis:
                                        </span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                          €
                                          {parseFloat(
                                            config.selectedRig.dayRate
                                          ).toLocaleString("de-DE")}
                                          /Tag
                                        </span>
                                      </div>
                                      {config.selectedEquipment &&
                                        Object.values(
                                          config.selectedEquipment
                                        ).flat().length > 0 && (
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                                              Equipment (
                                              {
                                                Object.values(
                                                  config.selectedEquipment
                                                ).flat().length
                                              }
                                              ):
                                            </span>
                                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                                              €
                                              {Object.values(
                                                config.selectedEquipment
                                              )
                                                .flat()
                                                .reduce(
                                                  (sum, eq) =>
                                                    sum + parseFloat(eq.price),
                                                  0
                                                )
                                                .toLocaleString("de-DE")}
                                              /Tag
                                            </span>
                                          </div>
                                        )}
                                      <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Gesamtsumme:
                                          </span>
                                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                            €
                                            {(
                                              parseFloat(
                                                config.selectedRig.dayRate
                                              ) +
                                              (config.selectedEquipment
                                                ? Object.values(
                                                    config.selectedEquipment
                                                  )
                                                    .flat()
                                                    .reduce(
                                                      (sum, eq) =>
                                                        sum +
                                                        parseFloat(eq.price),
                                                      0
                                                    )
                                                : 0)
                                            ).toLocaleString("de-DE")}
                                            /Tag
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-yellow-700">
                                    {config.projectDuration}
                                  </td>
                                  <td className="p-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleContractStatus(config.id);
                                      }}
                                    >
                                      Ausstehend
                                    </Button>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-300 hover:bg-blue-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEquipmentManagement(config);
                                        }}
                                        title="Equipment verwalten"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-yellow-300 hover:bg-yellow-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          viewTenderDetails(config);
                                        }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-300 hover:bg-red-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTenderConfiguration(config.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}

                            {/* Section Header for Contracts - Green highlight */}
                            {savedConfigurations.some(
                              (config) => config.isUnderContract
                            ) && (
                              <tr className="bg-green-50 dark:bg-green-950/20">
                                <td colSpan={5} className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                                      Anlagen unter Vertrag
                                    </h4>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Configurations UNDER contract - Green highlight */}
                            {savedConfigurations
                              .filter((config) => config.isUnderContract)
                              .map((config) => (
                                <tr
                                  key={config.id}
                                  className="border-b bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer"
                                  onClick={() => viewTenderDetails(config)}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="border-green-500 text-green-700"
                                      >
                                        {config.selectedRig?.name ||
                                          "Unbekanntes Rig"}
                                      </Badge>
                                      <Badge
                                        variant="default"
                                        className="bg-green-500 text-white text-xs"
                                      >
                                        Unter Vertrag
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-green-700 font-medium mt-1">
                                      {config.projectName}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-200 shadow-sm space-y-2">
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                                          Rig Basis:
                                        </span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                          €
                                          {parseFloat(
                                            config.selectedRig.dayRate
                                          ).toLocaleString("de-DE")}
                                          /Tag
                                        </span>
                                      </div>
                                      {config.selectedEquipment &&
                                        Object.values(
                                          config.selectedEquipment
                                        ).flat().length > 0 && (
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                                              Equipment (
                                              {
                                                Object.values(
                                                  config.selectedEquipment
                                                ).flat().length
                                              }
                                              ):
                                            </span>
                                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                                              €
                                              {Object.values(
                                                config.selectedEquipment
                                              )
                                                .flat()
                                                .reduce(
                                                  (sum, eq) =>
                                                    sum + parseFloat(eq.price),
                                                  0
                                                )
                                                .toLocaleString("de-DE")}
                                              /Tag
                                            </span>
                                          </div>
                                        )}
                                      <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Gesamtsumme:
                                          </span>
                                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                            €
                                            {(
                                              parseFloat(
                                                config.selectedRig.dayRate
                                              ) +
                                              (config.selectedEquipment
                                                ? Object.values(
                                                    config.selectedEquipment
                                                  )
                                                    .flat()
                                                    .reduce(
                                                      (sum, eq) =>
                                                        sum +
                                                        parseFloat(eq.price),
                                                      0
                                                    )
                                                : 0)
                                            ).toLocaleString("de-DE")}
                                            /Tag
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-green-700 font-medium">
                                    {config.projectDuration}
                                  </td>
                                  <td className="p-3">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleContractStatus(config.id);
                                      }}
                                    >
                                      ✓ Unter Vertrag
                                    </Button>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-300 hover:bg-blue-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEquipmentManagement(config);
                                        }}
                                        title="Equipment verwalten"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-300 hover:bg-green-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          viewTenderDetails(config);
                                        }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-300 hover:bg-red-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTenderConfiguration(config.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}

                            {/* Empty State */}
                            {savedConfigurations.length === 0 &&
                              (!selectedRig || !requirements.projectName) && (
                                <tr className="border-b">
                                  <td
                                    colSpan={5}
                                    className="p-8 text-center text-muted-foreground"
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <Calculator className="h-8 w-8 text-muted-foreground/50" />
                                      <span>
                                        Keine Tender-Konfigurationen
                                        gespeichert.
                                      </span>
                                      <span className="text-sm">
                                        Erstellen Sie eine Konfiguration und
                                        speichern Sie sie als Tender.
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preis-Edit Dialog */}
      <Dialog open={editPriceDialogOpen} onOpenChange={setEditPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preis bearbeiten</DialogTitle>
            <DialogDescription>
              {editingRig && `Tagesrate für ${editingRig.name} anpassen`}
              {editingEquipmentItem &&
                `Preis für ${editingEquipmentItem.name} anpassen`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                type="number"
                value={tempPrice}
                onChange={(e) => setTempPrice(e.target.value)}
                placeholder="z.B. 85000"
                className="text-lg font-semibold"
              />
              <p className="text-sm text-muted-foreground">
                Formatiert: €{" "}
                {tempPrice
                  ? parseFloat(tempPrice).toLocaleString("de-DE")
                  : "0"}
                {editingRig && " / Tag"}
                {editingEquipmentItem && " / Tag"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              onClick={savePrice}
              disabled={!tempPrice || parseFloat(tempPrice) <= 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Preis speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Management Dialog */}
      <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {equipmentFormMode === "add"
                ? "Neues Equipment hinzufügen"
                : "Equipment bearbeiten"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory &&
                equipmentCategories[
                  selectedCategory as keyof typeof equipmentCategories
                ]?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipment-name">Name *</Label>
              <Input
                id="equipment-name"
                value={equipmentForm.name}
                onChange={(e) =>
                  setEquipmentForm({ ...equipmentForm, name: e.target.value })
                }
                placeholder='z.B. 5" Bohrgestänge (Drill Pipe)'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment-price">Preis (€ / Tag) *</Label>
              <Input
                id="equipment-price"
                type="number"
                value={equipmentForm.price}
                onChange={(e) =>
                  setEquipmentForm({ ...equipmentForm, price: e.target.value })
                }
                placeholder="450"
              />
              {equipmentForm.price && (
                <p className="text-sm text-muted-foreground">
                  Formatiert: €{" "}
                  {parseFloat(equipmentForm.price).toLocaleString("de-DE")} /
                  Tag
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Zusätzliche Eigenschaften (optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Fügen Sie beliebige zusätzliche Informationen hinzu
              </p>

              {Object.entries(equipmentForm)
                .filter(
                  ([key]) => key !== "id" && key !== "name" && key !== "price"
                )
                .map(([key, value], index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Eigenschaft (z.B. spec, capacity)"
                      value={key}
                      onChange={(e) => {
                        const newForm = { ...equipmentForm };
                        delete newForm[key];
                        newForm[e.target.value] = value;
                        setEquipmentForm(newForm);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Wert"
                      value={value}
                      onChange={(e) =>
                        setEquipmentForm({
                          ...equipmentForm,
                          [key]: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newForm = { ...equipmentForm };
                        delete newForm[key];
                        setEquipmentForm(newForm);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newKey = `property_${Date.now()}`;
                  setEquipmentForm({ ...equipmentForm, [newKey]: "" });
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Eigenschaft hinzufügen
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEquipmentDialog}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              onClick={saveEquipmentItem}
              disabled={!equipmentForm.name || !equipmentForm.price}
            >
              <Save className="mr-2 h-4 w-4" />
              {equipmentFormMode === "add" ? "Hinzufügen" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rig Edit Dialog (Admin only) */}
      <Dialog open={rigEditDialogOpen} onOpenChange={setRigEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bohranlage bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die technischen Spezifikationen und
              Equipment-Details für {editingRigData?.name}
            </DialogDescription>
          </DialogHeader>

          {editingRigData && (
            <div className="space-y-4">
              {/* Technical Main Specifications */}
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                  🔧 Technische Hauptspezifikationen
                  <span className="ml-2 text-xs bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded">
                    Admin bearbeitbar
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDepth">
                      Max. Bohrtiefe (m) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxDepth"
                      type="number"
                      value={editingRigData.maxDepth}
                      onChange={(e) =>
                        setEditingRigData({
                          ...editingRigData,
                          maxDepth: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="z.B. 2800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxHookLoad">
                      Max. Hakenlast (t) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxHookLoad"
                      type="number"
                      value={editingRigData.maxHookLoad}
                      onChange={(e) =>
                        setEditingRigData({
                          ...editingRigData,
                          maxHookLoad: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="z.B. 207"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rotaryTorque">
                      Drehmoment (Nm) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="rotaryTorque"
                      type="number"
                      value={editingRigData.rotaryTorque}
                      onChange={(e) =>
                        setEditingRigData({
                          ...editingRigData,
                          rotaryTorque: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="z.B. 25000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pumpPressure">
                      Pumpendruck (psi) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pumpPressure"
                      type="number"
                      value={editingRigData.pumpPressure}
                      onChange={(e) =>
                        setEditingRigData({
                          ...editingRigData,
                          pumpPressure: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="z.B. 4200"
                    />
                  </div>
                </div>
              </div>

              {/* Equipment Details */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  ⚙️ Equipment Details
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawworks">
                    Drawworks <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="drawworks"
                    value={editingRigData.drawworks}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        drawworks: e.target.value,
                      })
                    }
                    placeholder="z.B. 2000 HP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mudPumps">
                    Mud Pumps <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mudPumps"
                    value={editingRigData.mudPumps}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        mudPumps: e.target.value,
                      })
                    }
                    placeholder="z.B. 2x 2200 HP Triplex"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topDrive">
                    Top Drive <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="topDrive"
                    value={editingRigData.topDrive}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        topDrive: e.target.value,
                      })
                    }
                    placeholder="z.B. 1000 HP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="derrickCapacity">
                    Derrick Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="derrickCapacity"
                    value={editingRigData.derrickCapacity}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        derrickCapacity: e.target.value,
                      })
                    }
                    placeholder="z.B. 1000 t"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crewSize">
                    Crew Size <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="crewSize"
                    value={editingRigData.crewSize}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        crewSize: e.target.value,
                      })
                    }
                    placeholder="z.B. 45-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobilizationTime">
                    Mobilization Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobilizationTime"
                    value={editingRigData.mobilizationTime}
                    onChange={(e) =>
                      setEditingRigData({
                        ...editingRigData,
                        mobilizationTime: e.target.value,
                      })
                    }
                    placeholder="z.B. 30-45 Tage"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="dayRate">
                  Tagesrate (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dayRate"
                  type="number"
                  value={editingRigData.dayRate}
                  onChange={(e) =>
                    setEditingRigData({
                      ...editingRigData,
                      dayRate: e.target.value,
                    })
                  }
                  placeholder="85000"
                />
                {editingRigData.dayRate && (
                  <p className="text-sm text-muted-foreground">
                    Formatiert: €{" "}
                    {parseFloat(editingRigData.dayRate).toLocaleString("de-DE")}{" "}
                    / Tag
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Diese Änderungen werden in der Datenbank gespeichert und
                  sind für alle Benutzer sichtbar.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRigEditDialog}
              disabled={savingRig}
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              onClick={saveRigChanges}
              disabled={
                savingRig ||
                !editingRigData?.maxDepth ||
                !editingRigData?.maxHookLoad ||
                !editingRigData?.rotaryTorque ||
                !editingRigData?.pumpPressure ||
                !editingRigData?.drawworks ||
                !editingRigData?.mudPumps ||
                !editingRigData?.topDrive ||
                !editingRigData?.dayRate
              }
            >
              {savingRig ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Im Backend speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Action Dialog */}
      <Dialog
        open={quickActionDialogOpen}
        onOpenChange={setQuickActionDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tender-Aufgabe erstellen</DialogTitle>
            <DialogDescription>
              Erstelle eine neue Aufgabe für{" "}
              {quickActionEquipment?.equipmentName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">
                  {quickActionEquipment?.equipmentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quickActionEquipment?.categoryName}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Zuweisen an *</Label>
              <Select
                value={quickActionForm.assignedTo}
                onValueChange={(value) =>
                  setQuickActionForm({ ...quickActionForm, assignedTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Benutzer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Aufgabenbeschreibung *</Label>
              <Textarea
                id="description"
                value={quickActionForm.description}
                onChange={(e) =>
                  setQuickActionForm({
                    ...quickActionForm,
                    description: e.target.value,
                  })
                }
                placeholder="z.B. @Philip Bitte Preise für die Tanks kalkulieren"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Tipp: Verwende @ um Personen zu erwähnen
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Hinweis:</strong> Die Aufgabe wird automatisch dem
                Action Tracker mit einer Frist von 7 Tagen hinzugefügt.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQuickActionDialogOpen(false);
                setQuickActionForm({ assignedTo: "", description: "" });
                setQuickActionEquipment(null);
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={createQuickAction}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Action erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Management Dialog */}
      <Dialog
        open={equipmentManagementDialogOpen}
        onOpenChange={setEquipmentManagementDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Equipment verwalten - {editingTenderConfig?.projectName}
            </DialogTitle>
            <DialogDescription>
              Fügen Sie Equipment hinzu oder entfernen Sie es, um die Tagesrate
              anzupassen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Total */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Aktuelle Gesamt-Tagesrate:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    €{" "}
                    {editingTenderConfig
                      ? (
                          parseFloat(editingTenderConfig.selectedRig.dayRate) +
                          Object.values(tempEquipmentSelection)
                            .flat()
                            .reduce((sum, eq) => sum + parseFloat(eq.price), 0)
                        ).toLocaleString("de-DE")
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Categories */}
            {editingTenderConfig &&
              Object.entries(equipmentCategories).map(
                ([category, categoryData]) => {
                  const categoryLabel = categoryData.name || category;
                  const items = categoryData.items || [];
                  const selectedItems = tempEquipmentSelection[category] || [];

                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {categoryLabel}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {items.map((item: EquipmentItem) => {
                            const isSelected = selectedItems.some(
                              (sel) => sel.id === item.id
                            );
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      setTempEquipmentSelection((prev) => {
                                        const current = prev[category] || [];
                                        if (checked) {
                                          return {
                                            ...prev,
                                            [category]: [...current, item],
                                          };
                                        } else {
                                          return {
                                            ...prev,
                                            [category]: current.filter(
                                              (i) => i.id !== item.id
                                            ),
                                          };
                                        }
                                      });
                                    }}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {item.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      €
                                      {parseFloat(item.price).toLocaleString(
                                        "de-DE"
                                      )}
                                      /Tag
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Badge className="bg-primary">
                                    Ausgewählt
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEquipmentManagementDialogOpen(false);
                setEditingTenderConfig(null);
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={saveEquipmentChanges} className="bg-primary">
              <Save className="h-4 w-4 mr-2" />
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Start Date Dialog */}
      <Dialog
        open={contractDateDialogOpen}
        onOpenChange={setContractDateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vertragsstartdatum festlegen</DialogTitle>
            <DialogDescription>
              Wählen Sie das Startdatum für den Vertrag mit{" "}
              <strong>{pendingContractConfig?.selectedRig?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vertragsbeginn *</Label>
              <DatePicker
                date={contractStartDate}
                onSelect={setContractStartDate}
                placeholder="Startdatum wählen"
              />
            </div>

            {pendingContractConfig && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projekt:</span>
                      <span className="font-medium">
                        {pendingContractConfig.projectName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Geplante Dauer:
                      </span>
                      <span className="font-medium">
                        {pendingContractConfig.projectDuration}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tagesrate:</span>
                      <span className="font-medium text-primary">
                        €
                        {pendingContractConfig.totalPrice.toLocaleString(
                          "de-DE"
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setContractDateDialogOpen(false);
                setPendingContractConfig(null);
                setContractStartDate(undefined);
              }}
              disabled={isSubmittingContract}
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmContractStartDate}
              disabled={!contractStartDate || isSubmittingContract}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmittingContract ? "Wird gespeichert..." : "Vertrag starten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RigConfigurator;
