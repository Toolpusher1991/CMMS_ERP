// ═══════════════════════════════════════════════════════════
// CSPL Gap Analysis — Type Definitions
// H&P International E&M
// ═══════════════════════════════════════════════════════════

export type ItemStatus =
  | "OK"
  | "SHORTAGE"
  | "ZERO STOCK"
  | "NOT FOUND"
  | "NO MAT#"
  | "NO TARGET";

export type Priority = 1 | 2;

export interface CSPLItem {
  no: number;
  equipment: string;
  description: string;
  oem: string;
  material: string;
  min: number;
  max: number;
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
  criticalCount: number;
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
  coverageRate: number;
  items: AnalyzedItem[];
  criticalItems: AnalyzedItem[];
}

export interface ProcurementItem extends AnalyzedItem {
  priority: Priority;
}

export type TabId =
  | "overview"
  | "critical"
  | "procurement"
  | "equipment"
  | "detail";

export type StatusFilter = ItemStatus | "all";

// ── H&P Brand Colors ──
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
} as const;

// ── Status config for rendering ──
export const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; shortLabel: string; color: string; bg: string; tw: string }
> = {
  OK: {
    label: "OK",
    shortLabel: "OK",
    color: HP_COLORS.lightGreen,
    bg: "#e8f9ef",
    tw: "text-green-600 bg-green-50",
  },
  SHORTAGE: {
    label: "Shortage",
    shortLabel: "SHORT",
    color: HP_COLORS.amber,
    bg: "#fdf6e3",
    tw: "text-amber-600 bg-amber-50",
  },
  "ZERO STOCK": {
    label: "Zero Stock",
    shortLabel: "ZERO",
    color: HP_COLORS.red,
    bg: "#fdeaea",
    tw: "text-red-600 bg-red-50",
  },
  "NOT FOUND": {
    label: "Not Found",
    shortLabel: "N/F",
    color: HP_COLORS.lightPurple,
    bg: "#f3eeff",
    tw: "text-purple-600 bg-purple-50",
  },
  "NO MAT#": {
    label: "No Mat#",
    shortLabel: "NO#",
    color: "#888",
    bg: "#f0f0f0",
    tw: "text-gray-500 bg-gray-100",
  },
  "NO TARGET": {
    label: "No Target",
    shortLabel: "—",
    color: HP_COLORS.medGray,
    bg: "#f3f3f6",
    tw: "text-gray-400 bg-gray-50",
  },
};
