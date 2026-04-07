// ═══════════════════════════════════════════════════════════
// CSPL Gap Analysis — Parsing & Matching Utilities
// H&P International E&M
// ═══════════════════════════════════════════════════════════

import * as XLSX from "xlsx";
import type {
  CSPLItem,
  StockEntry,
  AnalyzedItem,
  ItemStatus,
  StatusSummary,
  EquipmentGroup,
  ProcurementItem,
} from "./types";

// ─────────────────────────────────────────────────────
// Material Number Normalization
// SAP stores as float (10082354.0), CSPL may have
// spaces (1008 2354) or other formatting quirks.
// This normalizes to a clean integer string.
// ─────────────────────────────────────────────────────
export function normalizeMaterial(value: unknown): string {
  if (value == null || value === undefined) return "";

  let s = String(value)
    .replace(/\s+/g, "")      // strip all whitespace
    .replace(/\u00a0/g, "")   // strip non-breaking spaces
    .trim();

  // Remove trailing .0 (SAP float export artifact)
  if (s.endsWith(".0")) s = s.slice(0, -2);

  // Try integer conversion for any remaining float artifacts
  try {
    const n = parseFloat(s);
    if (!isNaN(n) && isFinite(n)) s = String(Math.round(n));
  } catch {
    // keep as-is
  }

  if (s === "nan" || s === "NaN" || s === "undefined") return "";
  return s;
}

// ─────────────────────────────────────────────────────
// Parse a numeric value that might contain text
// e.g. "1 set" → 1, "2" → 2, NaN → 0
// ─────────────────────────────────────────────────────
function parseNumeric(value: unknown): number {
  if (value == null) return 0;
  const s = String(value).trim();
  const match = s.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// ─────────────────────────────────────────────────────
// Find column index by keyword patterns
// ─────────────────────────────────────────────────────
function findColIndex(
  headers: string[],
  patterns: string[]
): number {
  const lower = headers.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
  for (const p of patterns) {
    const idx = lower.findIndex((h) => h.includes(p));
    if (idx >= 0) return idx;
  }
  return -1;
}

// ═════════════════════════════════════════════════════
// PARSE SAP MATERIAL LIST (MB52 Export)
// ═════════════════════════════════════════════════════
export function parseStockFile(
  workbook: XLSX.WorkBook
): Map<string, StockEntry> {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  if (rows.length === 0) return new Map();

  const cols = Object.keys(rows[0]);
  const colLower = cols.map((c) =>
    c.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  const find = (patterns: string[]) => {
    for (const p of patterns) {
      const idx = colLower.findIndex((c) => c.includes(p));
      if (idx >= 0) return cols[idx];
    }
    return null;
  };

  const cMat = find(["material", "matnr", "materialnumber"]);
  const cQty = find([
    "unrestricted", "freibestand", "stock", "qty",
    "quantity", "bestand", "verwendbar",
  ]);
  const cPlant = find(["plant", "werk", "plnt"]);
  const cDesc = find(["materialdesc", "description", "desc", "text"]);
  const cMfr = find(["manufacturer", "hersteller", "name1"]);

  if (!cMat || !cQty) {
    throw new Error(
      "Spalten nicht erkannt: Material und Unrestricted/Stock werden benötigt."
    );
  }

  // Aggregate by material number
  const stockMap = new Map<string, StockEntry>();

  for (const row of rows) {
    const mat = normalizeMaterial(row[cMat]);
    const qty = parseFloat(String(row[cQty])) || 0;
    if (!mat) continue;

    const existing = stockMap.get(mat);
    if (existing) {
      existing.quantity += qty;
    } else {
      stockMap.set(mat, {
        material: mat,
        quantity: qty,
        plant: cPlant ? String(row[cPlant] || "") : undefined,
        description: cDesc ? String(row[cDesc] || "") : undefined,
        manufacturer: cMfr ? String(row[cMfr] || "") : undefined,
      });
    }
  }

  return stockMap;
}

// ═════════════════════════════════════════════════════
// PARSE CSPL — Auto-detects multi-sheet or flat format
// ═════════════════════════════════════════════════════
export function parseCSPLFile(workbook: XLSX.WorkBook): CSPLItem[] {
  const isMultiSheet = workbook.SheetNames.length > 2;
  return isMultiSheet
    ? parseMultiSheetCSPL(workbook)
    : parseFlatCSPL(workbook);
}

// ── Multi-sheet CSPL (e.g. T51 format) ──
// Each sheet = one equipment group
// Row 0 col 2: Equipment name
// Row 6: Header row (Description, OEM P/N, OEM, KCAD SAP Material No., Min, Max)
// Row 7+: Data
function parseMultiSheetCSPL(workbook: XLSX.WorkBook): CSPLItem[] {
  const items: CSPLItem[] = [];
  let counter = 1;

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toLowerCase().includes("cover")) continue;

    const ws = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    }) as unknown[][];

    if (raw.length < 8 || (raw[0]?.length ?? 0) < 5) continue;

    // Equipment name from first row, column C (index 2)
    const equipment = String(raw[0]?.[2] ?? sheetName).trim();

    // Find header row (contains "Description" or "Min")
    let headerRow = 6;
    for (let i = 4; i < Math.min(10, raw.length); i++) {
      if (
        raw[i]?.some((v) =>
          String(v).toLowerCase().includes("description")
        )
      ) {
        headerRow = i;
        break;
      }
    }

    // Parse data rows
    for (let i = headerRow + 1; i < raw.length; i++) {
      const row = raw[i];
      if (!row) continue;

      const desc = String(row[1] ?? "").trim();
      const mat = normalizeMaterial(row[4]);

      if (!desc && !mat) continue;

      items.push({
        no: counter++,
        equipment,
        description: desc,
        oem: String(row[2] ?? "").trim(),
        material: mat,
        min: parseNumeric(row[5]),
        max: parseNumeric(row[6]),
      });
    }
  }

  return items;
}

// ── Flat CSPL or Reconciliation format ──
// Single sheet with header row containing Equipment, Description, SAP Mat.No. etc.
function parseFlatCSPL(workbook: XLSX.WorkBook): CSPLItem[] {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
  }) as unknown[][];

  // Find header row (look for "SAP Mat" or "Material" keyword)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    if (
      raw[i]?.some(
        (v) =>
          String(v).includes("SAP Mat") ||
          String(v).toLowerCase().includes("material")
      )
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) headerIdx = 0;

  const headers = (raw[headerIdx] ?? []).map((h) =>
    String(h).replace(/\n/g, " ").trim()
  );

  const iEq = findColIndex(headers, ["equipment"]);
  const iDesc = findColIndex(headers, ["description", "desc", "text"]);
  const iOem = findColIndex(headers, ["oem", "partno", "part no"]);
  const iMat = findColIndex(headers, ["sap mat", "material", "matnr"]);
  const iMin = findColIndex(headers, ["min", "minimum"]);
  const iMax = findColIndex(headers, ["max", "maximum"]);

  const items: CSPLItem[] = [];

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;

    const desc = iDesc >= 0 ? String(row[iDesc] ?? "").trim() : "";
    const mat = iMat >= 0 ? normalizeMaterial(row[iMat]) : "";

    if (!desc && !mat) continue;

    items.push({
      no: items.length + 1,
      equipment: iEq >= 0 ? String(row[iEq] ?? "").trim() : "",
      description: desc,
      oem: iOem >= 0 ? String(row[iOem] ?? "").trim() : "",
      material: mat,
      min: iMin >= 0 ? parseNumeric(row[iMin]) : 0,
      max: iMax >= 0 ? parseNumeric(row[iMax]) : 0,
    });
  }

  return items;
}

// ═════════════════════════════════════════════════════
// RECONCILIATION — Match CSPL against Stock
// ═════════════════════════════════════════════════════
export function reconcile(
  csplItems: CSPLItem[],
  stockMap: Map<string, StockEntry>
): AnalyzedItem[] {
  return csplItems.map((item) => {
    const stockEntry = item.material
      ? stockMap.get(item.material)
      : undefined;
    const available = stockEntry?.quantity ?? 0;

    let status: ItemStatus;
    if (!item.material) {
      status = "NO MAT#";
    } else if (!stockEntry && !stockMap.has(item.material)) {
      status = "NOT FOUND";
    } else if (available === 0) {
      status = "ZERO STOCK";
    } else if (item.min <= 0) {
      status = "NO TARGET";
    } else if (available < item.min) {
      status = "SHORTAGE";
    } else {
      status = "OK";
    }

    const delta = available - item.min;
    const fillRate =
      item.min > 0 ? Math.min(Math.round((available / item.min) * 100), 999) : 0;
    const orderQtyMin = Math.max(item.min - available, 0);
    const orderQtyMax = Math.max(item.max - available, 0);

    return {
      ...item,
      status,
      available,
      delta,
      fillRate,
      orderQtyMin,
      orderQtyMax,
    };
  });
}

// ═════════════════════════════════════════════════════
// ANALYTICS
// ═════════════════════════════════════════════════════
export function computeSummary(items: AnalyzedItem[]): StatusSummary {
  const total = items.length;
  const ok = items.filter((r) => r.status === "OK").length;
  const shortage = items.filter((r) => r.status === "SHORTAGE").length;
  const zeroStock = items.filter((r) => r.status === "ZERO STOCK").length;
  const notFound = items.filter((r) => r.status === "NOT FOUND").length;
  const noMat = items.filter((r) => r.status === "NO MAT#").length;
  const noTarget = items.filter((r) => r.status === "NO TARGET").length;

  const actionable = total - noTarget - noMat - notFound;
  const coverageRate = actionable > 0 ? Math.round((ok / actionable) * 100) : 0;

  const totalMinRequired = items.reduce((a, r) => a + r.min, 0);
  const totalStock = items.reduce((a, r) => a + r.available, 0);

  return {
    total,
    ok,
    shortage,
    zeroStock,
    notFound,
    noMat,
    noTarget,
    coverageRate,
    criticalCount: shortage + zeroStock,
    totalMinRequired,
    totalStock,
    totalGap: totalStock - totalMinRequired,
  };
}

export function computeEquipmentGroups(
  items: AnalyzedItem[]
): EquipmentGroup[] {
  const map = new Map<string, AnalyzedItem[]>();

  for (const item of items) {
    const key = item.equipment || "Uncategorized";
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }

  return Array.from(map.entries())
    .map(([name, groupItems]) => {
      const total = groupItems.length;
      const ok = groupItems.filter((r) => r.status === "OK").length;
      const shortage = groupItems.filter((r) => r.status === "SHORTAGE").length;
      const zeroStock = groupItems.filter(
        (r) => r.status === "ZERO STOCK"
      ).length;
      const notFound = groupItems.filter(
        (r) => r.status === "NOT FOUND"
      ).length;
      const noMat = groupItems.filter((r) => r.status === "NO MAT#").length;
      const actionable = total - noMat - notFound;
      const coverageRate =
        actionable > 0 ? Math.round((ok / actionable) * 100) : 0;

      return {
        name,
        total,
        ok,
        shortage,
        zeroStock,
        notFound,
        noMat,
        coverageRate,
        items: groupItems,
        criticalItems: groupItems.filter(
          (r) => r.status === "SHORTAGE" || r.status === "ZERO STOCK"
        ),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function computeProcurementList(
  items: AnalyzedItem[]
): ProcurementItem[] {
  return items
    .filter((r) => r.status === "ZERO STOCK" || r.status === "SHORTAGE")
    .map((r) => ({
      ...r,
      priority: (r.status === "ZERO STOCK" ? 1 : 2) as 1 | 2,
    }))
    .sort((a, b) => a.priority - b.priority || b.orderQtyMin - a.orderQtyMin);
}

// ═════════════════════════════════════════════════════
// EXCEL EXPORT
// ═════════════════════════════════════════════════════
export function exportToExcel(items: AnalyzedItem[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Full gap analysis
  const gapData = items.map((r) => ({
    No: r.no,
    Status: r.status,
    Equipment: r.equipment,
    Description: r.description,
    "OEM P/N": r.oem,
    "SAP Mat.No.": r.material,
    Min: r.min,
    Max: r.max,
    Stock: r.available,
    Delta: r.delta,
    "Fill %": r.fillRate,
    "Order Qty (to Min)": r.orderQtyMin,
    "Order Qty (to Max)": r.orderQtyMax,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(gapData),
    "Gap Analysis"
  );

  // Sheet 2: Procurement actions
  const procData = computeProcurementList(items).map((r) => ({
    Priority: `P${r.priority}`,
    Equipment: r.equipment,
    Description: r.description,
    "OEM P/N": r.oem,
    "SAP Mat.No.": r.material,
    Min: r.min,
    Stock: r.available,
    "Order Qty": r.orderQtyMin,
  }));
  if (procData.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(procData),
      "Procurement"
    );
  }

  // Sheet 3: Not found
  const nfData = items
    .filter((r) => r.status === "NOT FOUND")
    .map((r) => ({
      Equipment: r.equipment,
      Description: r.description,
      "OEM P/N": r.oem,
      "SAP Mat.No.": r.material,
      Min: r.min,
    }));
  if (nfData.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(nfData),
      "Not Found"
    );
  }

  XLSX.writeFile(wb, "CSPL_Gap_Analysis_Export.xlsx");
}
