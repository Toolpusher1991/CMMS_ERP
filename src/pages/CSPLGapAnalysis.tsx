import { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Package,
  BarChart3,
  ShoppingCart,
  Layers,
  List,
  ArrowLeft,
  Trash2,
  Info,
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
import { Progress } from "@/components/ui/progress";

import type {
  AnalyzedItem,
  StatusSummary,
  EquipmentGroup,
  TabId,
  StatusFilter,
  ItemStatus,
  CSPLItem,
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
} from "@/lib/cspl-gap-analysis/utils";

// ═════════════════════════════════════════════════════
// STATUS BADGE
// ═════════════════════════════════════════════════════
function StatusBadge({ status }: { status: ItemStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold px-2.5 py-1 border-0", cfg.tw)}
    >
      {cfg.label}
    </Badge>
  );
}

// ═════════════════════════════════════════════════════
// DEMO DATA
// ═════════════════════════════════════════════════════
function generateDemoData(): AnalyzedItem[] {
  const demoItems: (CSPLItem & { available: number })[] = [
    {
      no: 1,
      equipment: "Mud Pump F-1600",
      description: 'Liner 6-1/2"',
      oem: "NOV",
      material: "10045678",
      min: 6,
      max: 12,
      available: 8,
    },
    {
      no: 2,
      equipment: "Mud Pump F-1600",
      description: "Piston Rubber",
      oem: "NOV",
      material: "10045679",
      min: 12,
      max: 24,
      available: 4,
    },
    {
      no: 3,
      equipment: "Mud Pump F-1600",
      description: "Valve Seat",
      oem: "NOV",
      material: "10045680",
      min: 4,
      max: 8,
      available: 0,
    },
    {
      no: 4,
      equipment: "Top Drive TDS-11SA",
      description: "Main Bearing Assembly",
      oem: "NOV",
      material: "10051234",
      min: 1,
      max: 2,
      available: 1,
    },
    {
      no: 5,
      equipment: "Top Drive TDS-11SA",
      description: "Washpipe Assembly",
      oem: "NOV",
      material: "10051235",
      min: 2,
      max: 4,
      available: 0,
    },
    {
      no: 6,
      equipment: "Top Drive TDS-11SA",
      description: "Motor Brush Set",
      oem: "GE",
      material: "",
      min: 4,
      max: 8,
      available: 0,
    },
    {
      no: 7,
      equipment: "Drawworks ACS-1000",
      description: "Brake Band",
      oem: "NOV",
      material: "10060001",
      min: 2,
      max: 4,
      available: 3,
    },
    {
      no: 8,
      equipment: "Drawworks ACS-1000",
      description: "Crown Saver Sensor",
      oem: "Pason",
      material: "10060099",
      min: 2,
      max: 4,
      available: 2,
    },
    {
      no: 9,
      equipment: "Drawworks ACS-1000",
      description: "AC Motor Filter",
      oem: "Siemens",
      material: "10060100",
      min: 3,
      max: 6,
      available: 0,
    },
    {
      no: 10,
      equipment: 'BOP Ram 13-5/8"',
      description: "Ram Packer",
      oem: "Cameron",
      material: "10070010",
      min: 4,
      max: 8,
      available: 4,
    },
    {
      no: 11,
      equipment: 'BOP Ram 13-5/8"',
      description: "Bonnet Seal Kit",
      oem: "Cameron",
      material: "10070011",
      min: 2,
      max: 4,
      available: 0,
    },
    {
      no: 12,
      equipment: 'BOP Ram 13-5/8"',
      description: "Operating Cylinder Repair Kit",
      oem: "Cameron",
      material: "10070012",
      min: 1,
      max: 2,
      available: 1,
    },
    {
      no: 13,
      equipment: 'BOP Annular 13-5/8"',
      description: "Packing Unit",
      oem: "Hydril",
      material: "10070050",
      min: 1,
      max: 2,
      available: 0,
    },
    {
      no: 14,
      equipment: 'BOP Annular 13-5/8"',
      description: "Wear Ring Set",
      oem: "Hydril",
      material: "",
      min: 2,
      max: 4,
      available: 0,
    },
    {
      no: 15,
      equipment: "SCR Power System",
      description: "SCR Thyristor Module",
      oem: "ABB",
      material: "10080001",
      min: 2,
      max: 4,
      available: 2,
    },
    {
      no: 16,
      equipment: "SCR Power System",
      description: "Cooling Fan Motor",
      oem: "ABB",
      material: "10080002",
      min: 2,
      max: 4,
      available: 1,
    },
    {
      no: 17,
      equipment: "SCR Power System",
      description: "Control Board PCB",
      oem: "ABB",
      material: "10080003",
      min: 1,
      max: 2,
      available: 0,
    },
    {
      no: 18,
      equipment: "Rotary Table",
      description: "Master Bushing Insert",
      oem: "NOV",
      material: "10090001",
      min: 2,
      max: 4,
      available: 3,
    },
    {
      no: 19,
      equipment: "Rotary Table",
      description: "Main Shaft Bearing",
      oem: "NOV",
      material: "10090002",
      min: 1,
      max: 2,
      available: 0,
    },
    {
      no: 20,
      equipment: "Rotary Table",
      description: "Sprocket Chain",
      oem: "Tsubaki",
      material: "10090003",
      min: 1,
      max: 2,
      available: 0,
    },
    {
      no: 21,
      equipment: "Shale Shaker",
      description: "Screen Panel 200 Mesh",
      oem: "Derrick",
      material: "10100001",
      min: 20,
      max: 40,
      available: 15,
    },
    {
      no: 22,
      equipment: "Shale Shaker",
      description: "Vibrator Motor",
      oem: "Derrick",
      material: "10100002",
      min: 2,
      max: 4,
      available: 2,
    },
    {
      no: 23,
      equipment: "Centrifugal Pump",
      description: "Mech. Seal Kit 4x3",
      oem: "Mission",
      material: "10110001",
      min: 4,
      max: 8,
      available: 6,
    },
    {
      no: 24,
      equipment: "Centrifugal Pump",
      description: "Impeller 4x3",
      oem: "Mission",
      material: "10110002",
      min: 2,
      max: 4,
      available: 0,
    },
    {
      no: 25,
      equipment: "Choke Manifold",
      description: "Choke Insert Bean",
      oem: "Cameron",
      material: "10120001",
      min: 6,
      max: 12,
      available: 8,
    },
    {
      no: 26,
      equipment: "Choke Manifold",
      description: 'Gate Valve Repair Kit 3-1/16"',
      oem: "Cameron",
      material: "",
      min: 2,
      max: 0,
      available: 0,
    },
    {
      no: 27,
      equipment: "HPU Koomey",
      description: "Triplex Pump Plunger Kit",
      oem: "Koomey",
      material: "10130001",
      min: 1,
      max: 2,
      available: 1,
    },
    {
      no: 28,
      equipment: "HPU Koomey",
      description: "Accumulator Bladder 11gal",
      oem: "Koomey",
      material: "10130002",
      min: 4,
      max: 8,
      available: 2,
    },
  ];

  return demoItems.map((d) => {
    let status: ItemStatus;
    if (!d.material) status = "NO MAT#";
    else if (d.min === 0 && d.max === 0) status = "NO TARGET";
    else if (d.available === 0) status = "ZERO STOCK";
    else if (d.available < d.min) status = "SHORTAGE";
    else status = "OK";

    const delta = d.available - d.min;
    const fillRate =
      d.min > 0
        ? Math.min((d.available / d.min) * 100, 100)
        : d.available > 0
          ? 100
          : 0;
    const orderQtyMin = Math.max(0, d.min - d.available);
    const orderQtyMax = Math.max(0, d.max - d.available);

    return {
      no: d.no,
      equipment: d.equipment,
      description: d.description,
      oem: d.oem,
      material: d.material,
      min: d.min,
      max: d.max,
      status,
      available: d.available,
      delta,
      fillRate,
      orderQtyMin,
      orderQtyMax,
    };
  });
}

// ═════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════
export default function CSPLGapAnalysis() {
  const { toast } = useToast();

  // File state
  const [csplItems, setCsplItems] = useState<AnalyzedItem[]>([]);
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [csplFileName, setCsplFileName] = useState<string>("");
  const [stockFileName, setStockFileName] = useState<string>("");
  const [csplWorkbook, setCsplWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [stockWorkbook, setStockWorkbook] = useState<XLSX.WorkBook | null>(
    null,
  );

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
            const wb = XLSX.read(data, { type: "array" });
            resolve(wb);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      }),
    [],
  );

  const handleCSPLUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const wb = await readWorkbook(file);
        setCsplWorkbook(wb);
        setCsplFileName(file.name);
        const parsed = parseCSPLFile(wb);
        toast({
          title: "CSPL geladen",
          description: `${parsed.length} Positionen aus "${file.name}" erkannt.`,
        });

        // Auto-reconcile if stock already loaded
        if (stockWorkbook) {
          const stockMap = parseStockFile(stockWorkbook);
          const analyzed = reconcile(parsed, stockMap);
          setCsplItems(analyzed);
          setSummary(computeSummary(analyzed));
          setEquipmentGroups(computeEquipmentGroups(analyzed));
        }
      } catch (err) {
        toast({
          title: "Fehler beim Laden",
          description: String(err),
          variant: "destructive",
        });
      }
      // Reset input
      e.target.value = "";
    },
    [readWorkbook, stockWorkbook, toast],
  );

  const handleStockUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const wb = await readWorkbook(file);
        setStockWorkbook(wb);
        setStockFileName(file.name);
        const stockMap = parseStockFile(wb);
        toast({
          title: "Bestandsliste geladen",
          description: `${stockMap.size} Materialien aus "${file.name}" erkannt.`,
        });

        // Auto-reconcile if CSPL already loaded
        if (csplWorkbook) {
          const parsed = parseCSPLFile(csplWorkbook);
          const analyzed = reconcile(parsed, stockMap);
          setCsplItems(analyzed);
          setSummary(computeSummary(analyzed));
          setEquipmentGroups(computeEquipmentGroups(analyzed));
        }
      } catch (err) {
        toast({
          title: "Fehler beim Laden",
          description: String(err),
          variant: "destructive",
        });
      }
      e.target.value = "";
    },
    [readWorkbook, csplWorkbook, toast],
  );

  const handleRunAnalysis = useCallback(() => {
    if (!csplWorkbook || !stockWorkbook) {
      toast({
        title: "Dateien fehlen",
        description: "Bitte CSPL und SAP Bestandsliste hochladen.",
        variant: "destructive",
      });
      return;
    }
    try {
      const parsed = parseCSPLFile(csplWorkbook);
      const stockMap = parseStockFile(stockWorkbook);
      const analyzed = reconcile(parsed, stockMap);
      setCsplItems(analyzed);
      setSummary(computeSummary(analyzed));
      setEquipmentGroups(computeEquipmentGroups(analyzed));
      setActiveTab("overview");
      toast({
        title: "Analyse abgeschlossen",
        description: `${analyzed.length} Positionen analysiert.`,
      });
    } catch (err) {
      toast({
        title: "Analyse-Fehler",
        description: String(err),
        variant: "destructive",
      });
    }
  }, [csplWorkbook, stockWorkbook, toast]);

  const handleReset = useCallback(() => {
    setCsplItems([]);
    setSummary(null);
    setEquipmentGroups([]);
    setCsplFileName("");
    setStockFileName("");
    setCsplWorkbook(null);
    setStockWorkbook(null);
    setSearchQuery("");
    setStatusFilter("all");
    setExpandedGroup(null);
    setActiveTab("overview");
  }, []);

  const handleLoadDemo = useCallback(() => {
    const demo = generateDemoData();
    setCsplItems(demo);
    setSummary(computeSummary(demo));
    setEquipmentGroups(computeEquipmentGroups(demo));
    setCsplFileName("DEMO_CSPL.xlsx");
    setStockFileName("DEMO_MB52.xlsx");
    setActiveTab("overview");
    toast({
      title: "Demo geladen",
      description: `${demo.length} Beispiel-Positionen geladen.`,
    });
  }, [toast]);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    let items = csplItems;
    if (statusFilter !== "all") {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.material.toLowerCase().includes(q) ||
          i.equipment.toLowerCase().includes(q) ||
          i.oem.toLowerCase().includes(q),
      );
    }
    return items;
  }, [csplItems, statusFilter, searchQuery]);

  const procurementItems = useMemo(
    () => computeProcurementList(csplItems),
    [csplItems],
  );

  // ═════════════════════════════════════════════════════
  // UPLOAD VIEW (no data yet)
  // ═════════════════════════════════════════════════════
  if (!summary) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              CSPL Gap Analysis
            </CardTitle>
            <CardDescription>
              Kritische Ersatzteile nach CSPL vs. SAP-Bestand analysieren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CSPL Upload */}
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
                    <p className="font-semibold text-green-600">
                      {csplFileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klicken um zu ändern
                    </p>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">CSPL-Datei hochladen</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Critical Spare Parts List (.xlsx)
                    </p>
                  </>
                )}
              </div>

              {/* Stock Upload */}
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
                    <p className="font-semibold text-green-600">
                      {stockFileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klicken um zu ändern
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">SAP Bestandsliste</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MB52 Export (.xlsx)
                    </p>
                  </>
                )}
              </div>
            </div>

            {csplFileName && stockFileName && (
              <div className="flex justify-center">
                <Button size="lg" onClick={handleRunAnalysis}>
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Analyse starten
                </Button>
              </div>
            )}

            {/* Info box */}
            <div className="rounded-lg border bg-muted/30 p-4 flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  So funktioniert's:
                </p>
                <p>
                  1. CSPL hochladen (Multi-Sheet oder Flat-Format) — enthält
                  Equipment, Beschreibung, SAP Material-Nr., Min/Max.
                </p>
                <p>
                  2. SAP MB52-Export hochladen — enthält Materialnummern und
                  Bestände (Unrestricted).
                </p>
                <p>
                  3. Die Analyse gleicht automatisch CSPL-Anforderungen gegen
                  den aktuellen Bestand ab.
                </p>
              </div>
            </div>

            {/* Demo Button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadDemo}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Demo laden — Beispieldaten anzeigen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // ANALYSIS VIEW (data loaded)
  // ═════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="h-6 w-6" />
                CSPL Gap Analysis
              </CardTitle>
              <CardDescription>
                {summary.total} Positionen analysiert — Coverage Rate:{" "}
                {summary.coverageRate}%
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(csplItems)}
              >
                <Download className="mr-2 h-4 w-4" />
                Excel Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <Trash2 className="mr-2 h-4 w-4" />
                Neue Analyse
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard
              label="OK"
              value={summary.ok}
              total={summary.total}
              className="text-green-600 border-green-500/20"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <SummaryCard
              label="Shortage"
              value={summary.shortage}
              total={summary.total}
              className="text-amber-600 border-amber-500/20"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <SummaryCard
              label="Zero Stock"
              value={summary.zeroStock}
              total={summary.total}
              className="text-red-600 border-red-500/20"
              icon={<XCircle className="h-5 w-5" />}
            />
            <SummaryCard
              label="Not Found"
              value={summary.notFound}
              total={summary.total}
              className="text-purple-600 border-purple-500/20"
              icon={<Search className="h-5 w-5" />}
            />
            <SummaryCard
              label="No Mat#"
              value={summary.noMat}
              total={summary.total}
              className="text-gray-500 border-gray-500/20"
              icon={<Package className="h-5 w-5" />}
            />
            <SummaryCard
              label="No Target"
              value={summary.noTarget}
              total={summary.total}
              className="text-gray-400 border-gray-400/20"
              icon={<Info className="h-5 w-5" />}
            />
          </div>

          {/* ── Coverage Bar ── */}
          <div className="space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Coverage Rate</span>
              <span
                className={cn(
                  "font-bold",
                  summary.coverageRate >= 80
                    ? "text-green-500"
                    : summary.coverageRate >= 50
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              >
                {summary.coverageRate}%
              </span>
            </div>
            <Progress value={summary.coverageRate} className="h-4" />
          </div>

          {/* ── Tabs ── */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabId)}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Übersicht</span>
              </TabsTrigger>
              <TabsTrigger value="critical" className="gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Kritisch</span>
                {summary.criticalCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {summary.criticalCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="procurement" className="gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Beschaffung</span>
              </TabsTrigger>
              <TabsTrigger value="equipment" className="gap-1.5">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Equipment</span>
              </TabsTrigger>
              <TabsTrigger value="detail" className="gap-1.5">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Detail</span>
              </TabsTrigger>
            </TabsList>

            {/* ── OVERVIEW ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Distribution */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Status-Verteilung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      [
                        { key: "OK" as ItemStatus, count: summary.ok },
                        {
                          key: "SHORTAGE" as ItemStatus,
                          count: summary.shortage,
                        },
                        {
                          key: "ZERO STOCK" as ItemStatus,
                          count: summary.zeroStock,
                        },
                        {
                          key: "NOT FOUND" as ItemStatus,
                          count: summary.notFound,
                        },
                        { key: "NO MAT#" as ItemStatus, count: summary.noMat },
                        {
                          key: "NO TARGET" as ItemStatus,
                          count: summary.noTarget,
                        },
                      ] as const
                    ).map(({ key, count }) => (
                      <div key={key} className="flex items-center gap-3">
                        <StatusBadge status={key} />
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${summary.total > 0 ? (count / summary.total) * 100 : 0}%`,
                                backgroundColor: STATUS_CONFIG[key].color,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-base font-mono w-12 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Kennzahlen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MetricRow
                        label="Gesamt Positionen"
                        value={summary.total}
                      />
                      <MetricRow
                        label="Benötigter Min-Bestand"
                        value={summary.totalMinRequired}
                      />
                      <MetricRow
                        label="Aktueller Bestand"
                        value={summary.totalStock}
                      />
                      <MetricRow
                        label="Gesamt-Lücke"
                        value={summary.totalGap}
                        highlight={summary.totalGap < 0}
                      />
                      <MetricRow
                        label="Kritische Positionen"
                        value={summary.criticalCount}
                        highlight={summary.criticalCount > 0}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top equipment by criticality */}
              {equipmentGroups.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Equipment nach Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {equipmentGroups.slice(0, 8).map((g) => (
                        <div
                          key={g.name}
                          className="flex items-center gap-4 py-2"
                        >
                          <span className="text-base flex-1 truncate">
                            {g.name}
                          </span>
                          <div className="w-40">
                            <Progress value={g.coverageRate} className="h-3" />
                          </div>
                          <span
                            className={cn(
                              "text-sm font-mono w-12 text-right",
                              g.coverageRate >= 80
                                ? "text-green-500"
                                : g.coverageRate >= 50
                                  ? "text-amber-500"
                                  : "text-red-500",
                            )}
                          >
                            {g.coverageRate}%
                          </span>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {g.total} Items
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── CRITICAL ── */}
            <TabsContent value="critical" className="mt-4">
              <ItemTable
                items={csplItems.filter(
                  (i) => i.status === "SHORTAGE" || i.status === "ZERO STOCK",
                )}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                title={`${summary.criticalCount} Kritische Positionen`}
              />
            </TabsContent>

            {/* ── PROCUREMENT ── */}
            <TabsContent value="procurement" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Beschaffungsliste ({procurementItems.length})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToExcel(csplItems)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Prio</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead className="w-32">SAP Mat.Nr.</TableHead>
                          <TableHead className="w-20 text-right">Min</TableHead>
                          <TableHead className="w-20 text-right">
                            Bestand
                          </TableHead>
                          <TableHead className="w-24 text-right">
                            Bestellmenge
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {procurementItems.map((item) => (
                          <TableRow key={`proc-${item.no}`}>
                            <TableCell>
                              <Badge
                                variant={
                                  item.priority === 1
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                P{item.priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.equipment}
                            </TableCell>
                            <TableCell className="text-sm max-w-[250px] truncate">
                              {item.description}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.material || "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {item.min}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {item.available}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm text-red-500">
                              {item.orderQtyMin}
                            </TableCell>
                          </TableRow>
                        ))}
                        {procurementItems.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Keine Beschaffungen nötig
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── EQUIPMENT ── */}
            <TabsContent value="equipment" className="mt-4 space-y-3">
              {equipmentGroups.map((g) => (
                <Card key={g.name}>
                  <div
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() =>
                      setExpandedGroup(expandedGroup === g.name ? null : g.name)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-base">{g.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {g.total} Items
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {g.ok > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 bg-green-50 border-0"
                          >
                            {g.ok} OK
                          </Badge>
                        )}
                        {g.shortage > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 bg-amber-50 border-0"
                          >
                            {g.shortage} Short
                          </Badge>
                        )}
                        {g.zeroStock > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-red-600 bg-red-50 border-0"
                          >
                            {g.zeroStock} Zero
                          </Badge>
                        )}
                      </div>
                      <div className="w-28">
                        <Progress value={g.coverageRate} className="h-3" />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-mono w-12 text-right",
                          g.coverageRate >= 80
                            ? "text-green-500"
                            : g.coverageRate >= 50
                              ? "text-amber-500"
                              : "text-red-500",
                        )}
                      >
                        {g.coverageRate}%
                      </span>
                    </div>
                  </div>
                  {expandedGroup === g.name && (
                    <CardContent className="pt-0 pb-3">
                      <div className="rounded-md border overflow-auto max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Status</TableHead>
                              <TableHead>Beschreibung</TableHead>
                              <TableHead className="w-32">
                                SAP Mat.Nr.
                              </TableHead>
                              <TableHead className="w-20 text-right">
                                Min
                              </TableHead>
                              <TableHead className="w-20 text-right">
                                Bestand
                              </TableHead>
                              <TableHead className="w-20 text-right">
                                Delta
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {g.items.map((item) => (
                              <TableRow key={`eq-${item.no}`}>
                                <TableCell>
                                  <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className="text-sm max-w-[300px] truncate">
                                  {item.description}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {item.material || "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {item.min}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {item.available}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right text-sm font-semibold",
                                    item.delta < 0
                                      ? "text-red-500"
                                      : item.delta > 0
                                        ? "text-green-500"
                                        : "",
                                  )}
                                >
                                  {item.delta}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* ── DETAIL ── */}
            <TabsContent value="detail" className="mt-4">
              <ItemTable
                items={filteredItems}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                title={`Alle Positionen (${filteredItems.length})`}
                showFilters
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════

function SummaryCard({
  label,
  value,
  total,
  className,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
  icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Card className={cn("border", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{pct}%</div>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-base text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-lg font-mono font-semibold",
          highlight ? "text-red-500" : "",
        )}
      >
        {value.toLocaleString("de-DE")}
      </span>
    </div>
  );
}

function ItemTable({
  items,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  title,
  showFilters,
}: {
  items: AnalyzedItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (v: StatusFilter) => void;
  title: string;
  showFilters?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-56"
              />
            </div>
            {showFilters && onStatusFilterChange && (
              <Select
                value={statusFilter}
                onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="SHORTAGE">Shortage</SelectItem>
                  <SelectItem value="ZERO STOCK">Zero Stock</SelectItem>
                  <SelectItem value="NOT FOUND">Not Found</SelectItem>
                  <SelectItem value="NO MAT#">No Mat#</SelectItem>
                  <SelectItem value="NO TARGET">No Target</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="w-32">SAP Mat.Nr.</TableHead>
                <TableHead className="w-20 text-right">Min</TableHead>
                <TableHead className="w-20 text-right">Max</TableHead>
                <TableHead className="w-20 text-right">Bestand</TableHead>
                <TableHead className="w-20 text-right">Delta</TableHead>
                <TableHead className="w-20 text-right">Fill%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 200).map((item) => (
                <TableRow key={`d-${item.no}`}>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.no}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate">
                    {item.equipment}
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">
                    {item.description}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.material || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.min}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.max}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.available}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-semibold",
                      item.delta < 0
                        ? "text-red-500"
                        : item.delta > 0
                          ? "text-green-500"
                          : "",
                    )}
                  >
                    {item.delta}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.fillRate > 0 ? `${Math.round(item.fillRate)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Keine Einträge gefunden
                  </TableCell>
                </TableRow>
              )}
              {items.length > 200 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-4 text-muted-foreground text-xs"
                  >
                    Zeige 200 von {items.length} Einträgen. Nutze die Suche oder
                    Filter um einzugrenzen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
