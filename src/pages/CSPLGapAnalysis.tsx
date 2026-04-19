import { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Search,
  Package,
  BarChart3,
  ShoppingCart,
  Layers,
  List,
  ArrowLeft,
  Trash2,
  Info,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type {
  AnalyzedItem,
  StatusSummary,
  EquipmentGroup,
  TabId,
  StatusFilter,
  ItemStatus,
  CSPLItem,
  StockMeta,
} from "@/lib/cspl-gap-analysis/types";
import { STATUS_CONFIG } from "@/lib/cspl-gap-analysis/types";
import {
  parseStockFile,
  parseCSPLFile,
  reconcile,
  computeSummary,
  computeEquipmentGroups,
  computeProcurementList,
  exportToExcel,
  type StockData,
} from "@/lib/cspl-gap-analysis/utils";

// ═══ STATUS BADGE ═══
function StatusBadge({ status }: { status: ItemStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold px-2 py-0.5 border-0", cfg.tw)}
    >
      {cfg.shortLabel}
    </Badge>
  );
}

// ═══ TRANSFER TAG ═══
function TransferTag() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
      <ArrowRightLeft className="h-3 w-3" /> Xfer
    </span>
  );
}

// ═══ ACTION TAG ═══
function ActionTag({ action }: { action: string }) {
  if (action === "TRANSFER") return <TransferTag />;
  if (action === "PROCURE")
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold border-0 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
      >
        Procure
      </Badge>
    );
  return null;
}

// ═══ PLANT COVERAGE DISPLAY ═══
function PlantCoverage({ item }: { item: AnalyzedItem }) {
  if (
    !item.material ||
    item.status === "NOT FOUND" ||
    item.status === "NO MAT#"
  ) {
    return <span className="text-muted-foreground">—</span>;
  }
  const color =
    item.plantCoverage === item.totalPlants
      ? "text-green-600 dark:text-green-400"
      : item.plantCoverage === 0
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("text-xs font-semibold", color)}>
        {item.plantCoverage}/{item.totalPlants}
      </span>
      {item.hasAlternative && <TransferTag />}
      {item.hasGap && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
          ⚠
        </span>
      )}
    </span>
  );
}

// ═══ PLANT SOURCES LIST ═══
function PlantSourcesList({ item }: { item: AnalyzedItem }) {
  if (!item.transferSources?.length)
    return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {item.transferSources.map((p) => (
        <span
          key={p.plant}
          className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400"
        >
          {p.plant}: {p.qty}
        </span>
      ))}
    </div>
  );
}

// ═══ DEMO DATA ═══
function generateDemoData(): { items: AnalyzedItem[]; stockMeta: StockMeta } {
  const plants = ["1100", "1200", "1300"];
  const demoRaw: (CSPLItem & { stocks: Record<string, number> })[] = [
    {
      no: 1,
      equipment: "Mud Pump F-1600",
      description: 'Liner 6-1/2"',
      oem: "NOV",
      material: "10045678",
      min: 6,
      max: 12,
      stocks: { "1100": 5, "1200": 3, "1300": 0 },
    },
    {
      no: 2,
      equipment: "Mud Pump F-1600",
      description: "Piston Rubber",
      oem: "NOV",
      material: "10045679",
      min: 12,
      max: 24,
      stocks: { "1100": 2, "1200": 2, "1300": 0 },
    },
    {
      no: 3,
      equipment: "Mud Pump F-1600",
      description: "Valve Seat",
      oem: "NOV",
      material: "10045680",
      min: 4,
      max: 8,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 4,
      equipment: "Top Drive TDS-11SA",
      description: "Main Bearing Assembly",
      oem: "NOV",
      material: "10051234",
      min: 1,
      max: 2,
      stocks: { "1100": 1, "1200": 0, "1300": 0 },
    },
    {
      no: 5,
      equipment: "Top Drive TDS-11SA",
      description: "Washpipe Assembly",
      oem: "NOV",
      material: "10051235",
      min: 2,
      max: 4,
      stocks: { "1100": 0, "1200": 0, "1300": 1 },
    },
    {
      no: 6,
      equipment: "Top Drive TDS-11SA",
      description: "Motor Brush Set",
      oem: "GE",
      material: "",
      min: 4,
      max: 8,
      stocks: {},
    },
    {
      no: 7,
      equipment: "Drawworks ACS-1000",
      description: "Brake Band",
      oem: "NOV",
      material: "10060001",
      min: 2,
      max: 4,
      stocks: { "1100": 3, "1200": 0, "1300": 0 },
    },
    {
      no: 8,
      equipment: "Drawworks ACS-1000",
      description: "Crown Saver Sensor",
      oem: "Pason",
      material: "10060099",
      min: 2,
      max: 4,
      stocks: { "1100": 1, "1200": 1, "1300": 0 },
    },
    {
      no: 9,
      equipment: "Drawworks ACS-1000",
      description: "AC Motor Filter",
      oem: "Siemens",
      material: "10060100",
      min: 3,
      max: 6,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 10,
      equipment: 'BOP Ram 13-5/8"',
      description: "Ram Packer",
      oem: "Cameron",
      material: "10070010",
      min: 4,
      max: 8,
      stocks: { "1100": 2, "1200": 2, "1300": 0 },
    },
    {
      no: 11,
      equipment: 'BOP Ram 13-5/8"',
      description: "Bonnet Seal Kit",
      oem: "Cameron",
      material: "10070011",
      min: 2,
      max: 4,
      stocks: { "1100": 0, "1200": 0, "1300": 2 },
    },
    {
      no: 12,
      equipment: 'BOP Ram 13-5/8"',
      description: "Operating Cylinder Repair Kit",
      oem: "Cameron",
      material: "10070012",
      min: 1,
      max: 2,
      stocks: { "1100": 1, "1200": 0, "1300": 0 },
    },
    {
      no: 13,
      equipment: 'BOP Annular 13-5/8"',
      description: "Packing Unit",
      oem: "Hydril",
      material: "10070050",
      min: 1,
      max: 2,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 14,
      equipment: 'BOP Annular 13-5/8"',
      description: "Wear Ring Set",
      oem: "Hydril",
      material: "",
      min: 2,
      max: 4,
      stocks: {},
    },
    {
      no: 15,
      equipment: "SCR Power System",
      description: "SCR Thyristor Module",
      oem: "ABB",
      material: "10080001",
      min: 2,
      max: 4,
      stocks: { "1100": 1, "1200": 1, "1300": 0 },
    },
    {
      no: 16,
      equipment: "SCR Power System",
      description: "Cooling Fan Motor",
      oem: "ABB",
      material: "10080002",
      min: 2,
      max: 4,
      stocks: { "1100": 0, "1200": 1, "1300": 0 },
    },
    {
      no: 17,
      equipment: "SCR Power System",
      description: "Control Board PCB",
      oem: "ABB",
      material: "10080003",
      min: 1,
      max: 2,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 18,
      equipment: "Rotary Table",
      description: "Master Bushing Insert",
      oem: "NOV",
      material: "10090001",
      min: 2,
      max: 4,
      stocks: { "1100": 3, "1200": 0, "1300": 0 },
    },
    {
      no: 19,
      equipment: "Rotary Table",
      description: "Main Shaft Bearing",
      oem: "NOV",
      material: "10090002",
      min: 1,
      max: 2,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 20,
      equipment: "Rotary Table",
      description: "Sprocket Chain",
      oem: "Tsubaki",
      material: "10090003",
      min: 1,
      max: 2,
      stocks: { "1100": 0, "1200": 0, "1300": 1 },
    },
    {
      no: 21,
      equipment: "Shale Shaker",
      description: "Screen Panel 200 Mesh",
      oem: "Derrick",
      material: "10100001",
      min: 20,
      max: 40,
      stocks: { "1100": 10, "1200": 5, "1300": 0 },
    },
    {
      no: 22,
      equipment: "Shale Shaker",
      description: "Vibrator Motor",
      oem: "Derrick",
      material: "10100002",
      min: 2,
      max: 4,
      stocks: { "1100": 1, "1200": 1, "1300": 0 },
    },
    {
      no: 23,
      equipment: "Centrifugal Pump",
      description: "Mech. Seal Kit 4x3",
      oem: "Mission",
      material: "10110001",
      min: 4,
      max: 8,
      stocks: { "1100": 3, "1200": 2, "1300": 1 },
    },
    {
      no: 24,
      equipment: "Centrifugal Pump",
      description: "Impeller 4x3",
      oem: "Mission",
      material: "10110002",
      min: 2,
      max: 4,
      stocks: { "1100": 0, "1200": 0, "1300": 0 },
    },
    {
      no: 25,
      equipment: "Choke Manifold",
      description: "Choke Insert Bean",
      oem: "Cameron",
      material: "10120001",
      min: 6,
      max: 12,
      stocks: { "1100": 5, "1200": 3, "1300": 0 },
    },
    {
      no: 26,
      equipment: "Choke Manifold",
      description: 'Gate Valve Repair Kit 3-1/16"',
      oem: "Cameron",
      material: "",
      min: 2,
      max: 0,
      stocks: {},
    },
    {
      no: 27,
      equipment: "HPU Koomey",
      description: "Triplex Pump Plunger Kit",
      oem: "Koomey",
      material: "10130001",
      min: 1,
      max: 2,
      stocks: { "1100": 1, "1200": 0, "1300": 0 },
    },
    {
      no: 28,
      equipment: "HPU Koomey",
      description: "Accumulator Bladder 11gal",
      oem: "Koomey",
      material: "10130002",
      min: 4,
      max: 8,
      stocks: { "1100": 1, "1200": 1, "1300": 0 },
    },
  ];

  const items = demoRaw.map((d, i) => {
    const plantBreakdown = d.stocks;
    const totalStock = Object.values(plantBreakdown).reduce((a, v) => a + v, 0);
    const plantsWithStock = plants
      .filter((p) => (plantBreakdown[p] || 0) > 0)
      .map((p) => ({ plant: p, qty: plantBreakdown[p] }));
    const plantsWithout = plants.filter((p) => !(plantBreakdown[p] > 0));

    let status: ItemStatus;
    if (!d.material) status = "NO MAT#";
    else if (d.min === 0 && d.max === 0) status = "NO TARGET";
    else if (totalStock === 0) status = "ZERO STOCK";
    else if (totalStock < d.min) status = "SHORTAGE";
    else status = "OK";

    const isCritical = status === "SHORTAGE" || status === "ZERO STOCK";
    const hasAlternative = isCritical && plantsWithStock.length > 0;
    const hasGap = status === "OK" && plantsWithout.length > 0;

    return {
      ...d,
      no: i + 1,
      status,
      available: totalStock,
      delta: totalStock - d.min,
      fillRate:
        d.min > 0 ? Math.min(Math.round((totalStock / d.min) * 100), 999) : 0,
      orderQtyMin: Math.max(d.min - totalStock, 0),
      orderQtyMax: Math.max(d.max - totalStock, 0),
      stockDesc: "",
      stockMfr: "",
      plantBreakdown,
      plantsWithStock,
      plantsWithout,
      plantCoverage: plantsWithStock.length,
      totalPlants: plants.length,
      transferSources: plantsWithStock,
      totalTransferQty: plantsWithStock.reduce((a, p) => a + p.qty, 0),
      hasAlternative,
      hasGap,
      action: (isCritical ? (hasAlternative ? "TRANSFER" : "PROCURE") : "") as
        | ""
        | "TRANSFER"
        | "PROCURE",
    };
  });

  return {
    items,
    stockMeta: { totalMaterials: 25, totalQty: 52, plants },
  };
}

// ═══ MAIN PAGE ═══
export default function CSPLGapAnalysis() {
  const { toast } = useToast();

  const [csplItems, setCsplItems] = useState<AnalyzedItem[]>([]);
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [stockMeta, setStockMeta] = useState<StockMeta>({
    totalMaterials: 0,
    totalQty: 0,
    plants: [],
  });
  const [csplFileName, setCsplFileName] = useState("");
  const [stockFileName, setStockFileName] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [csplWorkbook, setCsplWorkbook] = useState<XLSX.WorkBook | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<AnalyzedItem | null>(null);

  const csplInputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);

  // ── File handlers ──
  const readWorkbook = useCallback(
    (file: File): Promise<XLSX.WorkBook> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            resolve(XLSX.read(data, { type: "array" }));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      }),
    [],
  );

  const runAnalysis = useCallback(
    (csplWb: XLSX.WorkBook, sd: StockData) => {
      const parsed = parseCSPLFile(csplWb);
      const analyzed = reconcile(parsed, sd);
      setCsplItems(analyzed);
      setSummary(computeSummary(analyzed));
      setEquipmentGroups(computeEquipmentGroups(analyzed));
      setActiveTab("overview");
      toast({
        title: "Analyse abgeschlossen",
        description: `${analyzed.length} Positionen gegen ${sd.meta.totalMaterials} SAP-Materialien über ${sd.meta.plants.length} Plants abgeglichen.`,
      });
    },
    [toast],
  );

  const handleStockUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const wb = await readWorkbook(file);
        const sd = parseStockFile(wb);
        setStockData(sd);
        setStockMeta(sd.meta);
        setStockFileName(file.name);
        toast({
          title: "SAP-Bestandsliste geladen",
          description: `${sd.meta.totalMaterials} Materialien · ${sd.meta.plants.length} Plants`,
        });
        if (csplWorkbook) runAnalysis(csplWorkbook, sd);
      } catch (err) {
        toast({
          title: "Fehler",
          description: String(err),
          variant: "destructive",
        });
      }
      e.target.value = "";
    },
    [readWorkbook, csplWorkbook, runAnalysis, toast],
  );

  const handleCSPLUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const wb = await readWorkbook(file);
        setCsplWorkbook(wb);
        setCsplFileName(file.name);
        toast({
          title: "CSPL geladen",
          description: `"${file.name}" erkannt.`,
        });
        if (stockData) runAnalysis(wb, stockData);
      } catch (err) {
        toast({
          title: "Fehler",
          description: String(err),
          variant: "destructive",
        });
      }
      e.target.value = "";
    },
    [readWorkbook, stockData, runAnalysis, toast],
  );

  const handleReset = useCallback(() => {
    setCsplItems([]);
    setSummary(null);
    setEquipmentGroups([]);
    setCsplFileName("");
    setStockFileName("");
    setCsplWorkbook(null);
    setStockData(null);
    setStockMeta({ totalMaterials: 0, totalQty: 0, plants: [] });
    setSearchQuery("");
    setStatusFilter("all");
    setEquipmentFilter("");
    setExpandedGroups(new Set());
    setDetailItem(null);
    setActiveTab("overview");
  }, []);

  const handleLoadDemo = useCallback(() => {
    const { items, stockMeta: sm } = generateDemoData();
    setCsplItems(items);
    setSummary(computeSummary(items));
    setEquipmentGroups(computeEquipmentGroups(items));
    setStockMeta(sm);
    setCsplFileName("DEMO_CSPL.xlsx");
    setStockFileName("DEMO_MB52.xlsx");
    setActiveTab("overview");
    toast({
      title: "Demo geladen",
      description: `${items.length} Beispiel-Positionen mit ${sm.plants.length} Plants.`,
    });
  }, [toast]);

  const handleExport = useCallback(async () => {
    try {
      await exportToExcel(csplItems, stockMeta);
      toast({
        title: "Export erfolgreich",
        description: "Excel-Datei heruntergeladen.",
      });
    } catch (err) {
      toast({
        title: "Export-Fehler",
        description: String(err),
        variant: "destructive",
      });
    }
  }, [csplItems, stockMeta, toast]);

  // ── Filtered items for detail table ──
  const filteredItems = useMemo(() => {
    let items = csplItems;
    if (statusFilter !== "all")
      items = items.filter((i) => i.status === statusFilter);
    if (equipmentFilter)
      items = items.filter((i) => i.equipment === equipmentFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.material.toLowerCase().includes(q) ||
          i.equipment.toLowerCase().includes(q) ||
          (i.oem || "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [csplItems, statusFilter, equipmentFilter, searchQuery]);

  const procurementItems = useMemo(
    () => computeProcurementList(csplItems),
    [csplItems],
  );
  const equipmentNames = useMemo(
    () =>
      [...new Set(csplItems.map((r) => r.equipment))].filter(Boolean).sort(),
    [csplItems],
  );

  // Derived lists — computed eagerly so hooks are never conditional
  const xferItems = useMemo(
    () =>
      csplItems
        .filter((r) => r.hasAlternative)
        .sort((a, b) => b.orderQtyMin - a.orderQtyMin),
    [csplItems],
  );
  const gapItems = useMemo(
    () =>
      csplItems
        .filter((r) => r.hasGap)
        .sort((a, b) => a.plantCoverage - b.plantCoverage),
    [csplItems],
  );
  const unavailItems = useMemo(
    () =>
      [
        ...csplItems
          .filter((r) => r.status === "ZERO STOCK")
          .map((r) => ({ ...r, reason: "ZERO STOCK" as const })),
        ...csplItems
          .filter((r) => r.status === "NOT FOUND")
          .map((r) => ({ ...r, reason: "NOT FOUND" as const })),
      ].sort((a, b) =>
        a.reason !== b.reason
          ? a.reason === "ZERO STOCK"
            ? -1
            : 1
          : b.min - a.min,
      ),
    [csplItems],
  );
  const shortageItems = useMemo(
    () =>
      csplItems
        .filter((r) => r.status === "SHORTAGE")
        .sort((a, b) => a.delta - b.delta),
    [csplItems],
  );

  // Transfer summary by source plant
  const plantTransferMap = useMemo(() => {
    const map: Record<string, { materials: Set<string>; qty: number }> = {};
    xferItems.forEach((r) =>
      r.transferSources.forEach((p) => {
        if (!map[p.plant]) map[p.plant] = { materials: new Set(), qty: 0 };
        map[p.plant].materials.add(r.material);
        map[p.plant].qty += p.qty;
      }),
    );
    return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty);
  }, [xferItems]);

  const xferQty = useMemo(
    () => xferItems.reduce((a, r) => a + r.orderQtyMin, 0),
    [xferItems],
  );
  const procQty = useMemo(
    () => procurementItems.reduce((a, r) => a + r.orderQtyMin, 0),
    [procurementItems],
  );

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // ═══ UPLOAD VIEW ═══
  if (!summary) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" /> CSPL Gap Analysis
            </CardTitle>
            <CardDescription>
              SAP material list vs. CSPL — gap analysis, transfer opportunities
              & procurement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stock Upload — Step 1 */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  stockFileName
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
                onClick={() => stockInputRef.current?.click()}
              >
                <input
                  ref={stockInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleStockUpload}
                />
                {stockFileName ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {stockFileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stockMeta.totalMaterials} Mat. ·{" "}
                      {stockMeta.plants.length} Plants
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">SAP Bestandsliste (MB52)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete Oman stock export
                    </p>
                  </>
                )}
              </div>

              {/* CSPL Upload — Step 2 */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  csplFileName
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
                onClick={() => csplInputRef.current?.click()}
              >
                <input
                  ref={csplInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleCSPLUpload}
                />
                {csplFileName ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {csplFileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klicken um zu ändern
                    </p>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">CSPL hochladen</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Critical Spare Parts List (.xlsx)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Features:</p>
                <p>
                  • Automatic material number normalization (spaces, .0-Suffix)
                </p>
                <p>
                  • Multi-sheet CSPL (e.g. T51) and flat format auto-detected
                </p>
                <p>
                  •{" "}
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    Stock Transfer Detection:
                  </span>{" "}
                  Shows where material exists at other plants → transfer instead
                  of procurement
                </p>
                <p>• Per-plant stock breakdown for every item</p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadDemo}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" /> Demo laden — Beispieldaten
                anzeigen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══ ANALYSIS VIEW ═══
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* H&P Navy Header */}
      <div className="bg-gradient-to-r from-[#143269] to-[#2B5597] px-6 py-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                CSPL Gap Analysis
              </h1>
              <p className="text-sm text-white/60">
                {summary.total} items · {stockMeta.plants.length} plants ·
                Coverage: {summary.coverageRate}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-white/80 hover:text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Excel Export
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-white/80 hover:text-white border border-white/30 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard
            label="CSPL Items"
            value={summary.total}
            color="border-l-blue-600"
          />
          <KpiCard
            label="OK"
            value={summary.ok}
            color="border-l-green-500"
            sub={`${summary.coverageRate}% of total`}
          />
          <KpiCard
            label="Unavailable"
            value={summary.zeroStock + summary.notFound}
            color="border-l-red-500"
            sub={`${summary.zeroStock} Zero · ${summary.notFound} N/F`}
          />
          <KpiCard
            label="Shortage"
            value={summary.shortage}
            color="border-l-amber-500"
            sub="Below min target"
          />
          <KpiCard
            label="No Mat#"
            value={summary.noMat}
            color="border-l-orange-500"
            sub="No SAP material#"
          />
          <KpiCard
            label="No Target"
            value={summary.noTarget}
            color="border-l-gray-400"
            sub="Min = 0"
          />
          <KpiCard
            label="Transfer avail."
            value={summary.transferCount}
            color="border-l-teal-500"
            sub="Available elsewhere"
          />
        </div>

        {/* Coverage Bar */}
        <Card>
          <CardContent className="py-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Stock Coverage
            </div>
            <div className="h-5 rounded bg-muted overflow-hidden flex">
              {summary.ok > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(summary.ok / summary.total) * 100}%` }}
                />
              )}
              {summary.shortage > 0 && (
                <div
                  className="bg-amber-500 transition-all"
                  style={{
                    width: `${(summary.shortage / summary.total) * 100}%`,
                  }}
                />
              )}
              {summary.zeroStock + summary.notFound > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{
                    width: `${((summary.zeroStock + summary.notFound) / summary.total) * 100}%`,
                  }}
                />
              )}
              {summary.noTarget > 0 && (
                <div
                  className="bg-gray-400 transition-all"
                  style={{
                    width: `${(summary.noTarget / summary.total) * 100}%`,
                  }}
                />
              )}
              {summary.noMat > 0 && (
                <div
                  className="bg-orange-500 transition-all"
                  style={{ width: `${(summary.noMat / summary.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              <span>
                <span className="text-green-500">●</span> OK ({summary.ok})
              </span>
              <span>
                <span className="text-amber-500">●</span> Shortage (
                {summary.shortage})
              </span>
              <span>
                <span className="text-red-500">●</span> Unavailable (
                {summary.zeroStock + summary.notFound})
              </span>
              <span>
                <span className="text-gray-400">●</span> No Target (
                {summary.noTarget})
              </span>
              <span>
                <span className="text-orange-500">●</span> No Mat# (
                {summary.noMat})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="critical" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Critical</span>
              {summary.zeroStock + summary.notFound > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-4 px-1 text-[10px]"
                >
                  {summary.zeroStock + summary.notFound}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Transfers</span>
              {summary.transferCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                  {summary.transferCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="procurement" className="gap-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Procurement</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="detail" className="gap-1">
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Detail</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══ OVERVIEW TAB ═══ */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Action Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Action Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Action</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-center">
                        Total Qty needed
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <TransferTag />
                      </TableCell>
                      <TableCell className="text-center font-semibold text-teal-600">
                        {summary.transferCount}
                      </TableCell>
                      <TableCell className="text-center text-teal-600">
                        {xferQty} EA
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-0 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
                        >
                          Procure
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-red-600">
                        {summary.procureCount}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {procQty} EA
                      </TableCell>
                    </TableRow>
                    {summary.gapCount > 0 && (
                      <TableRow>
                        <TableCell>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold dark:bg-amber-950/30 dark:text-amber-400">
                            ⚠ Coverage Gap
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-amber-600">
                          {summary.gapCount}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          OK total, not all plants
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* SAP Info */}
            <Card>
              <CardContent className="py-3 text-sm text-muted-foreground">
                <b>{stockMeta.totalMaterials}</b> materials ·{" "}
                <b>{stockMeta.totalQty}</b> total qty · Plants:{" "}
                <b>{stockMeta.plants.join(", ")}</b>
              </CardContent>
            </Card>

            {/* Equipment Groups — expandable */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Equipment Groups — click to expand
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Equipment</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">OK</TableHead>
                        <TableHead className="text-center">Short</TableHead>
                        <TableHead className="text-center">Zero</TableHead>
                        <TableHead className="text-center">N/F</TableHead>
                        <TableHead className="text-center">No#</TableHead>
                        <TableHead className="text-center">Xfer</TableHead>
                        <TableHead className="text-center">Coverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipmentGroups.map((g) => {
                        const isOpen = expandedGroups.has(g.name);
                        const cov = g.coverageRate;
                        const statusOrder: Record<string, number> = {
                          "ZERO STOCK": 0,
                          SHORTAGE: 1,
                          "NOT FOUND": 2,
                          "NO MAT#": 3,
                          "NO TARGET": 4,
                          OK: 5,
                        };
                        const sorted = [...g.items].sort(
                          (a, b) =>
                            (statusOrder[a.status] || 9) -
                            (statusOrder[b.status] || 9),
                        );
                        return (
                          <>
                            <TableRow
                              key={g.name}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleGroup(g.name)}
                            >
                              <TableCell className="font-semibold flex items-center gap-1 text-sm">
                                {isOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-primary" />
                                )}
                                {g.name}
                              </TableCell>
                              <TableCell className="text-center">
                                {g.total}
                              </TableCell>
                              <TableCell className="text-center text-green-600">
                                {g.ok}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center",
                                  g.shortage > 0
                                    ? "text-amber-600 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {g.shortage}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center",
                                  g.zeroStock > 0
                                    ? "text-red-600 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {g.zeroStock}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center",
                                  g.notFound > 0
                                    ? "text-purple-600 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {g.notFound}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center",
                                  g.noMat > 0
                                    ? "text-orange-600 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {g.noMat}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center",
                                  g.transferCount > 0
                                    ? "text-teal-600 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {g.transferCount}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center font-semibold",
                                  cov >= 80
                                    ? "text-green-600"
                                    : cov >= 50
                                      ? "text-amber-600"
                                      : "text-red-600",
                                )}
                              >
                                {cov}%
                              </TableCell>
                            </TableRow>
                            {isOpen && (
                              <TableRow key={`${g.name}-sub`}>
                                <TableCell
                                  colSpan={9}
                                  className="p-0 bg-muted/30"
                                >
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-center w-20">
                                          Status
                                        </TableHead>
                                        <TableHead className="text-left">
                                          Description
                                        </TableHead>
                                        <TableHead className="text-center">
                                          OEM
                                        </TableHead>
                                        <TableHead className="text-center">
                                          SAP Mat.
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Min
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Max
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Stock
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Delta
                                        </TableHead>
                                        <TableHead className="text-center">
                                          Plants
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sorted.map((r) => (
                                        <TableRow
                                          key={r.no}
                                          className="cursor-pointer hover:bg-muted/50"
                                          onClick={() => setDetailItem(r)}
                                        >
                                          <TableCell className="text-center">
                                            <StatusBadge status={r.status} />
                                          </TableCell>
                                          <TableCell
                                            className="text-left text-xs max-w-[250px] truncate"
                                            title={r.description}
                                          >
                                            {r.description}
                                          </TableCell>
                                          <TableCell className="text-center text-xs text-muted-foreground">
                                            {r.oem}
                                          </TableCell>
                                          <TableCell className="text-center font-mono text-xs">
                                            {r.material}
                                          </TableCell>
                                          <TableCell className="text-center text-xs">
                                            {r.min}
                                          </TableCell>
                                          <TableCell className="text-center text-xs">
                                            {r.max}
                                          </TableCell>
                                          <TableCell
                                            className={cn(
                                              "text-center text-xs font-semibold",
                                              r.available === 0 && r.material
                                                ? "text-red-600"
                                                : "",
                                            )}
                                          >
                                            {r.available}
                                          </TableCell>
                                          <TableCell
                                            className={cn(
                                              "text-center text-xs font-semibold",
                                              r.delta < 0
                                                ? "text-red-600"
                                                : r.delta > 0
                                                  ? "text-green-600"
                                                  : "text-amber-600",
                                            )}
                                          >
                                            {r.delta >= 0 ? "+" : ""}
                                            {r.delta}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <PlantCoverage item={r} />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ CRITICAL TAB ═══ */}
          <TabsContent value="critical" className="space-y-4 mt-4">
            {/* Status explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="py-3 text-sm">
                  <b className="text-red-600">ZERO STOCK</b> — Material exists
                  in SAP but current inventory is 0. Clear procurement gap —
                  order or transfer.
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="py-3 text-sm">
                  <b className="text-purple-600">NOT FOUND</b> — Material number
                  does not exist in SAP stock export. Verify SAP material number
                  before ordering.
                </CardContent>
              </Card>
            </div>

            {/* Unavailable */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Unavailable —{" "}
                  {unavailItems.length} items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-10">#</TableHead>
                        <TableHead className="text-center">Reason</TableHead>
                        <TableHead className="text-center">Equipment</TableHead>
                        <TableHead className="text-left">Description</TableHead>
                        <TableHead className="text-center">OEM</TableHead>
                        <TableHead className="text-center">SAP Mat.</TableHead>
                        <TableHead className="text-center">Min</TableHead>
                        <TableHead className="text-center">
                          Other Plants
                        </TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unavailItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No critical items
                          </TableCell>
                        </TableRow>
                      ) : (
                        unavailItems.map((r, i) => (
                          <TableRow
                            key={r.no}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem(r)}
                          >
                            <TableCell className="text-center text-xs">
                              {i + 1}
                            </TableCell>
                            <TableCell className="text-center">
                              <StatusBadge status={r.reason} />
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground max-w-[100px] truncate">
                              {r.equipment}
                            </TableCell>
                            <TableCell className="text-left text-xs">
                              {r.description}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {r.oem}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {r.material}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold">
                              {r.min}
                            </TableCell>
                            <TableCell className="text-center">
                              <PlantSourcesList item={r} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ActionTag action={r.action} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Shortage */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Shortage —{" "}
                  {shortageItems.length} items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-10">#</TableHead>
                        <TableHead className="text-center">Equipment</TableHead>
                        <TableHead className="text-left">Description</TableHead>
                        <TableHead className="text-center">SAP Mat.</TableHead>
                        <TableHead className="text-center">Min</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Gap</TableHead>
                        <TableHead className="text-center">Fill %</TableHead>
                        <TableHead className="text-center">
                          Other Plants
                        </TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shortageItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No shortage items
                          </TableCell>
                        </TableRow>
                      ) : (
                        shortageItems.map((r, i) => (
                          <TableRow
                            key={r.no}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem(r)}
                          >
                            <TableCell className="text-center text-xs">
                              {i + 1}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {r.equipment}
                            </TableCell>
                            <TableCell className="text-left text-xs">
                              {r.description}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {r.material}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {r.min}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold text-amber-600">
                              {r.available}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold text-red-600">
                              {r.delta}
                            </TableCell>
                            <TableCell className="text-center text-xs text-amber-600">
                              {r.fillRate}%
                            </TableCell>
                            <TableCell className="text-center">
                              <PlantSourcesList item={r} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ActionTag action={r.action} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TRANSFERS TAB ═══ */}
          <TabsContent value="transfers" className="space-y-4 mt-4">
            {/* Transfer opportunities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-600 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Stock Transfer
                  Opportunities
                </CardTitle>
                <CardDescription className="text-xs">
                  Materials missing or short at the CSPL location, but available
                  at other Oman plants. Transfer instead of procurement saves
                  lead time and cost.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Equipment</TableHead>
                        <TableHead className="text-left">Description</TableHead>
                        <TableHead className="text-center">SAP Mat.</TableHead>
                        <TableHead className="text-center">Min</TableHead>
                        <TableHead className="text-center">
                          Stock (here)
                        </TableHead>
                        <TableHead className="text-center">Gap</TableHead>
                        <TableHead className="text-center">
                          Available elsewhere
                        </TableHead>
                        <TableHead className="text-center">
                          Transfer from
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xferItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No transfer opportunities
                          </TableCell>
                        </TableRow>
                      ) : (
                        xferItems.map((r) => (
                          <TableRow
                            key={r.no}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem(r)}
                          >
                            <TableCell className="text-center">
                              <StatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {r.equipment}
                            </TableCell>
                            <TableCell className="text-left text-xs">
                              {r.description}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {r.material}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {r.min}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center text-xs font-semibold",
                                r.available === 0
                                  ? "text-red-600"
                                  : "text-amber-600",
                              )}
                            >
                              {r.available}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold text-red-600">
                              {r.delta}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold text-teal-600">
                              {r.totalTransferQty}
                            </TableCell>
                            <TableCell className="text-center text-xs text-teal-600">
                              {r.transferSources
                                .map((p) => `${p.plant} (${p.qty})`)
                                .join(", ")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Transfer summary by source plant */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-600">
                  Transfer Summary by Source Plant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Source Plant</TableHead>
                      <TableHead className="text-center">
                        Materials available
                      </TableHead>
                      <TableHead className="text-center">
                        Total transferable qty
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plantTransferMap.map(([plant, d]) => (
                      <TableRow key={plant}>
                        <TableCell className="font-semibold">{plant}</TableCell>
                        <TableCell className="text-center text-teal-600">
                          {d.materials.size}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-teal-600">
                          {d.qty}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Coverage gaps */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Coverage Gaps — OK items
                  missing from some plants
                </CardTitle>
                <CardDescription className="text-xs">
                  Total stock is sufficient, but material is not present on all
                  plants. Emergency need may require internal transfer.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Plants</TableHead>
                        <TableHead className="text-center">Equipment</TableHead>
                        <TableHead className="text-left">Description</TableHead>
                        <TableHead className="text-center">SAP Mat.</TableHead>
                        <TableHead className="text-center">Min</TableHead>
                        <TableHead className="text-center">
                          Total Stock
                        </TableHead>
                        <TableHead className="text-left text-red-600">
                          Missing from
                        </TableHead>
                        <TableHead className="text-left text-teal-600">
                          Available at
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gapItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            All OK items present on all plants
                          </TableCell>
                        </TableRow>
                      ) : (
                        gapItems.map((r) => (
                          <TableRow
                            key={r.no}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem(r)}
                          >
                            <TableCell className="text-center">
                              <PlantCoverage item={r} />
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {r.equipment}
                            </TableCell>
                            <TableCell className="text-left text-xs">
                              {r.description}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {r.material}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {r.min}
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold text-green-600">
                              {r.available}
                            </TableCell>
                            <TableCell className="text-left text-xs text-red-600">
                              {r.plantsWithout.join(", ")}
                            </TableCell>
                            <TableCell className="text-left text-xs text-teal-600">
                              {r.plantsWithStock
                                .map((p) => `${p.plant} (${p.qty})`)
                                .join(", ")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PROCUREMENT TAB ═══ */}
          <TabsContent value="procurement" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Procurement Action List (excl. transfer candidates)
                </CardTitle>
                <CardDescription className="text-xs">
                  Items where no stock exists at other Oman plants — external
                  procurement required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {procurementItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    All critical items can be covered via stock transfer
                  </p>
                ) : (
                  <div className="space-y-2">
                    {procurementItems.map((r) => (
                      <div
                        key={r.no}
                        className="flex gap-3 items-start p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setDetailItem(r)}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                            r.priority === 1 ? "bg-red-500" : "bg-amber-500",
                          )}
                        >
                          P{r.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {r.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.equipment}
                            {r.oem ? ` · ${r.oem}` : ""}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {r.material}
                          </div>
                          <div className="flex gap-2 mt-1 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-muted">
                              Min: <b>{r.min}</b>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted">
                              Stock:{" "}
                              <b
                                className={
                                  r.available === 0
                                    ? "text-red-600"
                                    : "text-amber-600"
                                }
                              >
                                {r.available}
                              </b>
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded",
                                r.priority === 1
                                  ? "bg-red-50 dark:bg-red-950/30"
                                  : "bg-amber-50 dark:bg-amber-950/30",
                              )}
                            >
                              Order: <b>{r.orderQtyMin}</b>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment procurement summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Procurement Summary by Equipment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Equipment</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-center">
                        Total Order Qty
                      </TableHead>
                      <TableHead className="text-center">P1</TableHead>
                      <TableHead className="text-center">P2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const eqP: Record<
                        string,
                        { n: number; q: number; p1: number; p2: number }
                      > = {};
                      procurementItems.forEach((r) => {
                        if (!eqP[r.equipment])
                          eqP[r.equipment] = { n: 0, q: 0, p1: 0, p2: 0 };
                        eqP[r.equipment].n++;
                        eqP[r.equipment].q += r.orderQtyMin;
                        if (r.priority === 1) eqP[r.equipment].p1++;
                        else eqP[r.equipment].p2++;
                      });
                      return Object.entries(eqP)
                        .sort((a, b) => b[1].q - a[1].q)
                        .map(([name, g]) => (
                          <TableRow key={name}>
                            <TableCell className="font-semibold text-sm">
                              {name}
                            </TableCell>
                            <TableCell className="text-center">{g.n}</TableCell>
                            <TableCell className="text-center font-semibold">
                              {g.q}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center",
                                g.p1 > 0
                                  ? "text-red-600 font-semibold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {g.p1}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center",
                                g.p2 > 0
                                  ? "text-amber-600"
                                  : "text-muted-foreground",
                              )}
                            >
                              {g.p2}
                            </TableCell>
                          </TableRow>
                        ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ EQUIPMENT TAB ═══ */}
          <TabsContent value="equipment" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipmentGroups.map((g) => {
                const hasCrit = g.shortage + g.zeroStock > 0;
                const critItems = g.items.filter(
                  (r) => r.status === "SHORTAGE" || r.status === "ZERO STOCK",
                );
                const nfItems = g.items.filter((r) => r.status === "NOT FOUND");
                const isOpen = expandedGroups.has("eq-" + g.name);
                return (
                  <Card
                    key={g.name}
                    className={cn(
                      "cursor-pointer transition-colors",
                      hasCrit
                        ? "border-l-4 border-l-red-500"
                        : nfItems.length > 0
                          ? "border-l-4 border-l-purple-500"
                          : "border-l-4 border-l-blue-500",
                    )}
                    onClick={() => {
                      setExpandedGroups((prev) => {
                        const next = new Set(prev);
                        const key = "eq-" + g.name;
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                    }}
                  >
                    <CardContent className="py-3">
                      <div className="font-semibold text-sm">
                        {g.name}{" "}
                        <span className="font-normal text-xs text-muted-foreground">
                          ({g.total})
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                        <span className="text-green-600">{g.ok} OK</span>
                        {g.shortage > 0 && (
                          <span className="text-amber-600">
                            {g.shortage} short
                          </span>
                        )}
                        {g.zeroStock > 0 && (
                          <span className="text-red-600">
                            {g.zeroStock} zero
                          </span>
                        )}
                        {g.notFound > 0 && (
                          <span className="text-purple-600">
                            {g.notFound} n/f
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 rounded bg-muted overflow-hidden flex mt-2">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(g.ok / g.total) * 100}%` }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${(g.shortage / g.total) * 100}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${(g.zeroStock / g.total) * 100}%` }}
                        />
                        <div
                          className="bg-purple-500"
                          style={{ width: `${(g.notFound / g.total) * 100}%` }}
                        />
                      </div>
                      {isOpen && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {critItems.length > 0 ? (
                            critItems.map((r) => (
                              <div
                                key={r.no}
                                className="flex items-center gap-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailItem(r);
                                }}
                              >
                                <StatusBadge status={r.status} />
                                <span className="flex-1 truncate">
                                  {r.description}
                                </span>
                                {r.hasAlternative && <TransferTag />}
                                <span
                                  className={cn(
                                    "font-semibold",
                                    r.available === 0
                                      ? "text-red-600"
                                      : "text-amber-600",
                                  )}
                                >
                                  {r.available}/{r.min}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-green-600">
                              ✓ All covered
                            </div>
                          )}
                          {nfItems.length > 0 && (
                            <div className="text-[10px] text-purple-600 pt-1 border-t">
                              {nfItems.length} item
                              {nfItems.length > 1 ? "s" : ""} not found in SAP
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══ DETAIL TABLE TAB ═══ */}
          <TabsContent value="detail" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-sm">
                    {filteredItems.length} of {csplItems.length}
                    {filteredItems.length > 800 ? " (first 800)" : ""}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(
                      [
                        "all",
                        "ZERO STOCK",
                        "SHORTAGE",
                        "OK",
                        "NOT FOUND",
                        "NO MAT#",
                      ] as StatusFilter[]
                    ).map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={statusFilter === f ? "default" : "outline"}
                        className={cn(
                          "text-xs h-7 px-2.5",
                          statusFilter === f &&
                            f === "all" &&
                            "bg-blue-600 hover:bg-blue-700",
                          statusFilter === f &&
                            f === "ZERO STOCK" &&
                            "bg-red-600 hover:bg-red-700",
                          statusFilter === f &&
                            f === "SHORTAGE" &&
                            "bg-amber-600 hover:bg-amber-700",
                          statusFilter === f &&
                            f === "OK" &&
                            "bg-green-600 hover:bg-green-700",
                          statusFilter === f &&
                            f === "NOT FOUND" &&
                            "bg-purple-600 hover:bg-purple-700",
                          statusFilter === f &&
                            f === "NO MAT#" &&
                            "bg-gray-600 hover:bg-gray-700",
                        )}
                        onClick={() => setStatusFilter(f)}
                      >
                        {f === "all"
                          ? "Alle"
                          : STATUS_CONFIG[f]?.shortLabel || f}
                      </Button>
                    ))}
                    <Select
                      value={equipmentFilter}
                      onValueChange={setEquipmentFilter}
                    >
                      <SelectTrigger className="w-[160px] h-7 text-xs">
                        <SelectValue placeholder="All equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">All equipment</SelectItem>
                        {equipmentNames.map((eq) => (
                          <SelectItem key={eq} value={eq}>
                            {eq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-7 text-xs w-44"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Equipment</TableHead>
                        <TableHead className="text-left">Description</TableHead>
                        <TableHead className="text-center">OEM</TableHead>
                        <TableHead className="text-center">SAP Mat.</TableHead>
                        <TableHead className="text-center">Min</TableHead>
                        <TableHead className="text-center">Max</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Delta</TableHead>
                        <TableHead className="text-center">Plants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.slice(0, 800).map((r) => (
                        <TableRow
                          key={r.no}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setDetailItem(r)}
                        >
                          <TableCell className="text-center">
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground max-w-[100px] truncate">
                            {r.equipment}
                          </TableCell>
                          <TableCell
                            className="text-left text-xs max-w-[200px] truncate"
                            title={r.description}
                          >
                            {r.description}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {r.oem}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {r.material}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {r.min}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {r.max}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-center text-xs font-semibold",
                              r.available === 0 && r.material
                                ? "text-red-600"
                                : "",
                            )}
                          >
                            {r.available}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-center text-xs font-semibold",
                              r.delta < 0
                                ? "text-red-600"
                                : r.delta > 0
                                  ? "text-green-600"
                                  : "text-amber-600",
                            )}
                          >
                            {r.delta >= 0 ? "+" : ""}
                            {r.delta}
                          </TableCell>
                          <TableCell className="text-center">
                            <PlantCoverage item={r} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No results
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══ DETAIL PANEL (slide-in) ═══ */}
        {detailItem && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setDetailItem(null)}
            />
            <div className="fixed right-0 top-0 w-full sm:w-[420px] h-screen bg-background border-l shadow-xl z-50 overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-sm font-medium truncate max-w-[320px]">
                  {detailItem.description}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:text-primary-foreground/80"
                  onClick={() => setDetailItem(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                {/* Status */}
                <div className="flex gap-2">
                  <StatusBadge status={detailItem.status} />
                  {detailItem.hasAlternative && <TransferTag />}
                </div>

                {/* Identification */}
                <div>
                  <SectionTitle>Identification</SectionTitle>
                  <DPRow label="Description" value={detailItem.description} />
                  <DPRow label="Equipment" value={detailItem.equipment} />
                  <DPRow label="OEM Part No." value={detailItem.oem || "—"} />
                  <DPRow
                    label="SAP Material"
                    value={detailItem.material || "—"}
                  />
                  {detailItem.stockDesc && (
                    <DPRow
                      label="SAP Description"
                      value={detailItem.stockDesc}
                    />
                  )}
                  {detailItem.stockMfr && (
                    <DPRow
                      label="SAP Manufacturer"
                      value={detailItem.stockMfr}
                    />
                  )}
                </div>

                {/* Stock levels */}
                <div>
                  <SectionTitle>Stock Levels</SectionTitle>
                  <DPRow label="Target Min" value={String(detailItem.min)} />
                  <DPRow label="Target Max" value={String(detailItem.max)} />
                  <DPRow
                    label="Total Stock"
                    value={
                      <span
                        className={cn(
                          "font-semibold",
                          detailItem.available === 0 && detailItem.material
                            ? "text-red-600"
                            : "",
                        )}
                      >
                        {detailItem.available}
                      </span>
                    }
                  />
                  <DPRow
                    label="Delta"
                    value={
                      <span
                        className={cn(
                          "font-semibold",
                          detailItem.delta < 0
                            ? "text-red-600"
                            : detailItem.delta > 0
                              ? "text-green-600"
                              : "text-amber-600",
                        )}
                      >
                        {detailItem.delta >= 0 ? "+" : ""}
                        {detailItem.delta}
                      </span>
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    Fill rate: {detailItem.fillRate}%
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        detailItem.fillRate >= 100
                          ? "bg-green-500"
                          : detailItem.fillRate >= 50
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                      style={{
                        width: `${Math.min(detailItem.fillRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Per-plant breakdown */}
                {stockMeta.plants.length > 0 &&
                  detailItem.material &&
                  detailItem.status !== "NOT FOUND" &&
                  detailItem.status !== "NO MAT#" && (
                    <div>
                      <SectionTitle>
                        Stock per Plant ({detailItem.plantCoverage}/
                        {detailItem.totalPlants})
                      </SectionTitle>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left text-xs">
                              Plant
                            </TableHead>
                            <TableHead className="text-center text-xs">
                              Qty
                            </TableHead>
                            <TableHead className="text-center text-xs"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockMeta.plants.map((plant) => {
                            const qty = detailItem.plantBreakdown[plant] || 0;
                            return (
                              <TableRow key={plant}>
                                <TableCell className="font-semibold text-xs">
                                  {plant}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-center text-xs",
                                    qty > 0
                                      ? "font-semibold text-green-600"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {qty}
                                </TableCell>
                                <TableCell className="text-center">
                                  {qty === 0 && (
                                    <span className="text-[10px] text-red-500">
                                      ✗ missing
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {detailItem.plantsWithout.length > 0 && (
                        <div className="text-xs p-2 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 mt-2">
                          Missing from:{" "}
                          <b>{detailItem.plantsWithout.join(", ")}</b>
                        </div>
                      )}
                    </div>
                  )}

                {/* Action recommendation */}
                {(detailItem.status === "SHORTAGE" ||
                  detailItem.status === "ZERO STOCK") && (
                  <div>
                    <SectionTitle>Recommended Action</SectionTitle>
                    {detailItem.hasAlternative ? (
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 space-y-2">
                        <div className="text-sm font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                          <ArrowRightLeft className="h-3.5 w-3.5" /> Stock
                          transfer recommended
                        </div>
                        {detailItem.transferSources.map((p) => (
                          <div
                            key={p.plant}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-semibold">{p.plant}</span>
                            <span className="font-semibold text-teal-600">
                              {p.qty} EA
                            </span>
                          </div>
                        ))}
                        <div className="text-xs border-t border-teal-200 dark:border-teal-800 pt-2 mt-1">
                          Required: <b>{detailItem.orderQtyMin}</b> · Elsewhere:{" "}
                          <b className="text-teal-600">
                            {detailItem.totalTransferQty}
                          </b>
                        </div>
                        {detailItem.totalTransferQty <
                          detailItem.orderQtyMin && (
                          <div className="text-xs text-amber-600">
                            ⚠ Remaining{" "}
                            {detailItem.orderQtyMin -
                              detailItem.totalTransferQty}{" "}
                            via procurement
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <DPRow
                          label="Priority"
                          value={
                            detailItem.status === "ZERO STOCK" ? (
                              <span className="text-red-600 font-semibold">
                                P1 — Zero Stock
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold">
                                P2 — Below Min
                              </span>
                            )
                          }
                        />
                        <DPRow
                          label="Order qty → Min"
                          value={<b>{detailItem.orderQtyMin}</b>}
                        />
                        <DPRow
                          label="Order qty → Max"
                          value={<b>{detailItem.orderQtyMax}</b>}
                        />
                        <div className="text-xs text-muted-foreground mt-2 p-2 rounded bg-muted">
                          No stock at other plants — external procurement
                          required
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailItem.hasGap && (
                  <div>
                    <SectionTitle>Coverage Gap</SectionTitle>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <div className="text-sm font-semibold text-amber-600 mb-1">
                        ⚠ Not on all plants
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total stock covers target. In case of emergency need at{" "}
                        <b>{detailItem.plantsWithout.join(", ")}</b> internal
                        transfer required.
                      </div>
                    </div>
                  </div>
                )}

                {detailItem.status === "NOT FOUND" && (
                  <div>
                    <SectionTitle>Possible Causes</SectionTitle>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>• Flag for Deletion in SAP</p>
                      <p>• New material number assigned</p>
                      <p>• Not yet created in SAP master</p>
                      <p>• Typo in CSPL material number</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══ SUB-COMPONENTS ═══
function KpiCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  return (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="py-3 px-4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </div>
        <div className="text-2xl font-medium mt-0.5">{value}</div>
        {sub && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
      {children}
    </div>
  );
}

function DPRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-right max-w-[190px] break-all text-xs">
        {value}
      </span>
    </div>
  );
}
