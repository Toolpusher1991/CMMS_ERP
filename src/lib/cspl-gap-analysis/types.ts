// ═══════════════════════════════════════════════════════════
// CSPL Gap Analysis — Type Definitions (v7)
// H&P International E&M — with plant-level stock & transfers
// ═══════════════════════════════════════════════════════════

export type ItemStatus =
  | "OK"
  | "SHORTAGE"
  | "ZERO STOCK"
  | "NOT FOUND"
  | "NO MAT#"
  | "NO TARGET";

export type Priority = 1 | 2;

export type TabId =
  | "overview"
  | "critical"
  | "transfers"
  | "procurement"
  | "equipment"
  | "detail";

export type StatusFilter = ItemStatus | "all";

export interface CSPLItem {
  no: number;
  equipment: string;
  description: string;
  oem: string;
  material: string;
  min: number;
  max: number;
}

export interface PlantStock {
  plant: string;
  qty: number;
}

export interface StockEntry {
  material: string;
  quantity: number;
  plant?: string;
  description?: string;
  manufacturer?: string;
}

export interface AnalyzedItem extends CSPLItem {
  status: ItemStatus;
  available: number;
  delta: number;
  fillRate: number;
  orderQtyMin: number;
  orderQtyMax: number;
  stockDesc: string;
  stockMfr: string;
  plantBreakdown: Record<string, number>;
  plantsWithStock: PlantStock[];
  plantsWithout: string[];
  plantCoverage: number;
  totalPlants: number;
  transferSources: PlantStock[];
  totalTransferQty: number;
  hasAlternative: boolean;
  hasGap: boolean;
  action: "" | "TRANSFER" | "PROCURE";
}

export interface StockMeta {
  totalMaterials: number;
  totalQty: number;
  plants: string[];
}

export interface StatusSummary {
  total: number;
  ok: number;
  shortage: number;
  zeroStock: number;
  notFound: number;
  noMat: number;
  noTarget: number;
  coverageRate: number;
  coverageRateMatched: number;
  criticalCount: number;
  transferCount: number;
  procureCount: number;
  gapCount: number;
  totalMinRequired: number;
  totalStock: number;
  totalGap: number;
}

export interface EquipmentGroup {
  name: string;
  total: number;
  ok: number;
  shortage: number;
  zeroStock: number;
  notFound: number;
  noMat: number;
  transferCount: number;
  coverageRate: number;
  items: AnalyzedItem[];
  criticalItems: AnalyzedItem[];
}

export interface ProcurementItem extends AnalyzedItem {
  priority: Priority;
}

export const HP_COLORS = {
  deepBlue: "#143269",
  hpBlue: "#2B5597",
  lightBlue: "#00B2E3",
  lightGreen: "#24C26B",
  medGreen: "#238755",
  darkGreen: "#0D5E4F",
  lightPurple: "#6645C6",
  medPurple: "#560BA9",
  darkGray: "#64646E",
  medGray: "#C8C8D2",
  paleGray: "#F0F0FA",
  red: "#D94040",
  amber: "#E8A820",
  teal: "#0D9488",
  orange: "#E07020",
} as const;

export const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; shortLabel: string; color: string; bg: string; tw: string }
> = {
  OK: {
    label: "OK",
    shortLabel: "OK",
    color: HP_COLORS.lightGreen,
    bg: "#e8f9ef",
    tw: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30",
  },
  SHORTAGE: {
    label: "Shortage",
    shortLabel: "SHORT",
    color: HP_COLORS.amber,
    bg: "#fdf6e3",
    tw: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  },
  "ZERO STOCK": {
    label: "Zero Stock",
    shortLabel: "ZERO",
    color: HP_COLORS.red,
    bg: "#fdeaea",
    tw: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
  },
  "NOT FOUND": {
    label: "Not Found",
    shortLabel: "N/F",
    color: HP_COLORS.lightPurple,
    bg: "#f3eeff",
    tw: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30",
  },
  "NO MAT#": {
    label: "No Mat#",
    shortLabel: "NO#",
    color: HP_COLORS.orange,
    bg: "#fde8d8",
    tw: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30",
  },
  "NO TARGET": {
    label: "No Target",
    shortLabel: "—",
    color: HP_COLORS.medGray,
    bg: "#f3f3f6",
    tw: "text-gray-400 bg-gray-50 dark:text-gray-500 dark:bg-gray-900/30",
  },
};
