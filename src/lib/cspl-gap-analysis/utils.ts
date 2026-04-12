// ═══════════════════════════════════════════════════════════
// CSPL Gap Analysis — Parsing & Matching Utilities (v7)
// H&P International E&M — per-plant stock, transfers, ExcelJS export
// ═══════════════════════════════════════════════════════════

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import type {
  CSPLItem,
  AnalyzedItem,
  ItemStatus,
  StatusSummary,
  EquipmentGroup,
  ProcurementItem,
  StockMeta,
  PlantStock,
} from "./types";

// ─── Material Number Normalization ───
export function normalizeMaterial(value: unknown): string {
  if (value == null) return "";
  let s = String(value)
    .replace(/\s+/g, "")
    .replace(/\u00a0/g, "")
    .trim();
  if (s.endsWith(".0")) s = s.slice(0, -2);
  try {
    const n = parseFloat(s);
    if (!isNaN(n) && isFinite(n)) s = String(Math.round(n));
  } catch {
    // keep as-is
  }
  if (s === "nan" || s === "NaN" || s === "undefined") return "";
  return s;
}

function parseNumeric(value: unknown): number {
  if (value == null) return 0;
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function findColIndex(headers: string[], patterns: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const p of patterns) {
    const idx = lower.findIndex((h) => h.includes(p));
    if (idx >= 0) return idx;
  }
  return -1;
}

// ═══ Per-plant stock data structures ═══
export interface StockData {
  byPlant: Record<string, Record<string, number>>; // mat -> plant -> qty
  agg: Record<string, { qty: number; desc: string; mfr: string }>;
  meta: StockMeta;
}

// ═══ PARSE SAP MATERIAL LIST (MB52) — per-plant ═══
export function parseStockFile(workbook: XLSX.WorkBook): StockData {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (rows.length === 0) throw new Error("Keine Daten gefunden");

  const cols = Object.keys(rows[0]);
  const colLower = cols.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const find = (patterns: string[]) => {
    for (const p of patterns) {
      const idx = colLower.findIndex((c) => c.includes(p));
      if (idx >= 0) return cols[idx];
    }
    return null;
  };

  const cMat = find(["material", "matnr"]);
  const cQty = find(["unrestricted", "freibestand", "stock", "qty", "quantity", "bestand"]);
  const cPlant = find(["plant", "werk", "plnt"]);
  const cDesc = find(["materialdesc", "description", "desc", "text"]);
  const cMfr = find(["manufacturer", "hersteller", "name1"]);

  if (!cMat || !cQty) {
    throw new Error("Spalten nicht erkannt: Material + Unrestricted/Stock werden benötigt.");
  }

  const byPlant: Record<string, Record<string, number>> = {};
  const agg: Record<string, { qty: number; desc: string; mfr: string }> = {};
  const plantSet = new Set<string>();
  let totalQty = 0;

  for (const r of rows) {
    const mat = normalizeMaterial(r[cMat]);
    const qty = parseFloat(String(r[cQty])) || 0;
    const plant = cPlant ? String(r[cPlant] || "").trim() : "ALL";
    if (!mat) continue;

    plantSet.add(plant);

    if (!byPlant[mat]) byPlant[mat] = {};
    byPlant[mat][plant] = (byPlant[mat][plant] || 0) + qty;

    if (!agg[mat]) agg[mat] = { qty: 0, desc: cDesc ? String(r[cDesc] || "") : "", mfr: cMfr ? String(r[cMfr] || "") : "" };
    agg[mat].qty += qty;
    totalQty += qty;
  }

  return {
    byPlant,
    agg,
    meta: {
      totalMaterials: Object.keys(agg).length,
      totalQty: Math.round(totalQty),
      plants: [...plantSet].filter(Boolean).sort(),
    },
  };
}

// ═══ PARSE CSPL ═══
export function parseCSPLFile(workbook: XLSX.WorkBook): CSPLItem[] {
  const isMultiSheet = workbook.SheetNames.length > 2;
  return isMultiSheet ? parseMultiSheetCSPL(workbook) : parseFlatCSPL(workbook);
}

function parseMultiSheetCSPL(workbook: XLSX.WorkBook): CSPLItem[] {
  const items: CSPLItem[] = [];
  let counter = 1;

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toLowerCase().includes("cover")) continue;

    const ws = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" }) as unknown[][];
    if (raw.length < 7 || (raw[0]?.length ?? 0) < 3) continue;

    // Equipment name from row 0-2, col 2 or sheet name
    let equipment = sheetName;
    for (let i = 0; i < Math.min(3, raw.length); i++) {
      const v = raw[i]?.[2];
      if (v && String(v).trim() && !String(v).toLowerCase().includes("spare") && !String(v).toLowerCase().includes("e&m")) {
        equipment = String(v).trim();
        break;
      }
    }

    // Scan rows 0-10 for column keywords
    let sapCol = -1, descCol = -1, minCol = -1, maxCol = -1, oemCol = -1, dataStart = -1;
    const scanRows = Math.min(12, raw.length);
    for (let i = 0; i < scanRows; i++) {
      const row = raw[i] || [];
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j] || "").toLowerCase().replace(/\n/g, " ").trim();
        if (!val) continue;
        if ((val.includes("sap material") || val.includes("kcad sap")) && sapCol < 0) sapCol = j;
        if (val === "description" && descCol < 0) descCol = j;
        if (val.includes("oem p/n") && oemCol < 0) oemCol = j;
        if (val === "min" && minCol < 0) { minCol = j; dataStart = i + 1; }
        if (val === "max" && maxCol < 0) maxCol = j;
      }
    }

    if (descCol < 0) descCol = 1;

    // Fallback: scan data rows for 7-8 digit numbers
    if (sapCol < 0 && dataStart > 0) {
      const sampleRow = raw[dataStart] || [];
      for (let j = 0; j < sampleRow.length; j++) {
        if (j === descCol || j === minCol || j === maxCol || j === oemCol) continue;
        const v = String(sampleRow[j] || "").replace(/\s/g, "");
        if (/^\d{7,8}$/.test(v)) { sapCol = j; break; }
      }
    }

    if (sapCol < 0 || dataStart < 0) continue;

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i] || [];
      const desc = descCol >= 0 ? String(r[descCol] || "").trim() : "";
      const mat = sapCol >= 0 ? normalizeMaterial(r[sapCol]) : "";
      if (!desc && !mat) continue;
      items.push({
        no: counter++,
        equipment,
        description: desc,
        oem: oemCol >= 0 ? String(r[oemCol] || "").trim() : "",
        material: mat,
        min: minCol >= 0 ? parseNumeric(r[minCol]) : 0,
        max: maxCol >= 0 ? parseNumeric(r[maxCol]) : 0,
      });
    }
  }
  return items;
}

function parseFlatCSPL(workbook: XLSX.WorkBook): CSPLItem[] {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" }) as unknown[][];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    if (raw[i]?.some((v) => String(v).includes("SAP Mat") || String(v).toLowerCase().includes("material"))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) headerIdx = 0;

  const headers = (raw[headerIdx] ?? []).map((h) => String(h).replace(/\n/g, " ").trim());
  const iEq = findColIndex(headers, ["equipment"]);
  const iDesc = findColIndex(headers, ["description", "desc"]);
  const iOem = findColIndex(headers, ["oem", "part no"]);
  const iMat = findColIndex(headers, ["sap mat", "material"]);
  const iMin = findColIndex(headers, ["min"]);
  const iMax = findColIndex(headers, ["max"]);

  const items: CSPLItem[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r) continue;
    const desc = iDesc >= 0 ? String(r[iDesc] || "").trim() : "";
    const mat = iMat >= 0 ? normalizeMaterial(r[iMat]) : "";
    if (!desc && !mat) continue;
    items.push({
      no: items.length + 1,
      equipment: iEq >= 0 ? String(r[iEq] || "").trim() : "",
      description: desc,
      oem: iOem >= 0 ? String(r[iOem] || "") : "",
      material: mat,
      min: iMin >= 0 ? parseNumeric(r[iMin]) : 0,
      max: iMax >= 0 ? parseNumeric(r[iMax]) : 0,
    });
  }
  return items;
}

// ═══ RECONCILE with per-plant data ═══
export function reconcile(csplItems: CSPLItem[], stock: StockData): AnalyzedItem[] {
  const allPlants = stock.meta.plants;

  return csplItems.map((c, i) => {
    const aggEntry = c.material ? stock.agg[c.material] : undefined;
    const plantBreakdown = c.material ? (stock.byPlant[c.material] || {}) : {};
    const totalStock = aggEntry ? aggEntry.qty : 0;

    const plantsWithStock: PlantStock[] = [];
    const plantsWithout: string[] = [];
    allPlants.forEach((p) => {
      const qty = plantBreakdown[p] || 0;
      if (qty > 0) plantsWithStock.push({ plant: p, qty });
      else plantsWithout.push(p);
    });

    let status: ItemStatus;
    if (!c.material) status = "NO MAT#";
    else if (!aggEntry) status = "NOT FOUND";
    else if (totalStock === 0) status = "ZERO STOCK";
    else if (c.min <= 0) status = "NO TARGET";
    else if (totalStock < c.min) status = "SHORTAGE";
    else status = "OK";

    const isCritical = status === "SHORTAGE" || status === "ZERO STOCK";
    const hasAlternative = isCritical && plantsWithStock.length > 0;
    const hasGap = status === "OK" && plantsWithout.length > 0;

    return {
      ...c,
      no: i + 1,
      status,
      available: totalStock,
      delta: totalStock - c.min,
      fillRate: c.min > 0 ? Math.min(Math.round((totalStock / c.min) * 100), 999) : 0,
      orderQtyMin: Math.max(c.min - totalStock, 0),
      orderQtyMax: Math.max(c.max - totalStock, 0),
      stockDesc: aggEntry?.desc || "",
      stockMfr: aggEntry?.mfr || "",
      plantBreakdown,
      plantsWithStock,
      plantsWithout,
      plantCoverage: plantsWithStock.length,
      totalPlants: allPlants.length,
      transferSources: plantsWithStock,
      totalTransferQty: plantsWithStock.reduce((a, p) => a + p.qty, 0),
      hasAlternative,
      hasGap,
      action: isCritical ? (hasAlternative ? "TRANSFER" : "PROCURE") : "",
    };
  });
}

// ═══ ANALYTICS ═══
export function computeSummary(items: AnalyzedItem[]): StatusSummary {
  const total = items.length;
  const ok = items.filter((r) => r.status === "OK").length;
  const shortage = items.filter((r) => r.status === "SHORTAGE").length;
  const zeroStock = items.filter((r) => r.status === "ZERO STOCK").length;
  const notFound = items.filter((r) => r.status === "NOT FOUND").length;
  const noMat = items.filter((r) => r.status === "NO MAT#").length;
  const noTarget = items.filter((r) => r.status === "NO TARGET").length;
  const transferCount = items.filter((r) => r.hasAlternative).length;
  const procureCount = items.filter((r) => (r.status === "SHORTAGE" || r.status === "ZERO STOCK") && !r.hasAlternative).length;
  const gapCount = items.filter((r) => r.hasGap).length;

  const matched = total - notFound - noMat;
  const coverageRate = total > 0 ? Math.round((ok / total) * 100) : 0;
  const coverageRateMatched = matched > 0 ? Math.round((ok / matched) * 100) : 0;

  return {
    total, ok, shortage, zeroStock, notFound, noMat, noTarget,
    coverageRate,
    coverageRateMatched,
    criticalCount: shortage + zeroStock,
    transferCount,
    procureCount,
    gapCount,
    totalMinRequired: items.reduce((a, r) => a + r.min, 0),
    totalStock: items.reduce((a, r) => a + r.available, 0),
    totalGap: items.reduce((a, r) => a + r.available, 0) - items.reduce((a, r) => a + r.min, 0),
  };
}

export function computeEquipmentGroups(items: AnalyzedItem[]): EquipmentGroup[] {
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
      const zeroStock = groupItems.filter((r) => r.status === "ZERO STOCK").length;
      const notFound = groupItems.filter((r) => r.status === "NOT FOUND").length;
      const noMat = groupItems.filter((r) => r.status === "NO MAT#").length;
      const transferCount = groupItems.filter((r) => r.hasAlternative).length;
      const actionable = total - noMat - notFound;
      const coverageRate = actionable > 0 ? Math.round((ok / actionable) * 100) : 0;

      return {
        name, total, ok, shortage, zeroStock, notFound, noMat, transferCount,
        coverageRate,
        items: groupItems,
        criticalItems: groupItems.filter((r) => r.status === "SHORTAGE" || r.status === "ZERO STOCK"),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function computeProcurementList(items: AnalyzedItem[]): ProcurementItem[] {
  return items
    .filter((r) => (r.status === "ZERO STOCK" || r.status === "SHORTAGE") && !r.hasAlternative)
    .map((r) => ({ ...r, priority: (r.status === "ZERO STOCK" ? 1 : 2) as 1 | 2 }))
    .sort((a, b) => a.priority - b.priority || b.orderQtyMin - a.orderQtyMin);
}

// ═══ EXCEL EXPORT (ExcelJS — styled, per-equipment sheets) ═══
export async function exportToExcel(items: AnalyzedItem[], stockMeta: StockMeta): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "H&P E&M — CSPL Gap Analysis v7";
  wb.created = new Date();

  const allPlants = stockMeta.plants;
  const C = {
    deep: { argb: "FF143269" }, hp: { argb: "FF2B5597" }, w: { argb: "FFFFFFFF" },
    g: { argb: "FF24C26B" }, r: { argb: "FFD94040" }, am: { argb: "FFE8A820" },
    te: { argb: "FF0D9488" }, pu: { argb: "FF8B5CF6" }, or: { argb: "FFE07020" },
  };
  const fl = (c: Partial<ExcelJS.Color>): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: c });
  const bd: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
  const rowBg: Record<string, Partial<ExcelJS.Color>> = {
    "ZERO STOCK": { argb: "FFFFEAEA" }, "NOT FOUND": { argb: "FFF5EEFF" },
    "NO MAT#": { argb: "FFFFF5EB" }, SHORTAGE: { argb: "FFFFFCF0" },
  };
  const scMap: Record<string, Partial<ExcelJS.Color>> = {
    OK: C.g, SHORTAGE: C.am, "ZERO STOCK": C.r, "NOT FOUND": C.pu, "NO MAT#": C.or,
  };

  // ── Summary sheet ──
  const ws0 = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FF143269" } } });
  ws0.columns = [{ width: 36 }, { width: 16 }];
  const s = computeSummary(items);
  const sr = (l: string, v?: string | number | null, b?: boolean, c?: string) => {
    const row = ws0.addRow([l, v != null ? v : ""]);
    row.getCell(1).font = { name: "Arial", size: b ? 11 : 10, bold: !!b, color: { argb: c || "FF143269" } };
    row.getCell(2).font = { name: "Arial", size: b ? 11 : 10, bold: !!b, color: { argb: c || "FF143269" } };
    row.getCell(2).alignment = { horizontal: "right" };
  };
  ws0.addRow([]);
  sr("CSPL GAP ANALYSIS", null, true);
  sr("Generated", new Date().toLocaleDateString("en-GB"));
  sr("Plants", allPlants.join(", "));
  ws0.addRow([]);
  sr("Total", s.total, true);
  sr("OK", s.ok, true, "FF24C26B");
  sr("Unavailable", s.zeroStock + s.notFound, true, "FFD94040");
  sr("   Zero Stock", s.zeroStock, false, "FFD94040");
  sr("   Not Found", s.notFound, false, "FF8B5CF6");
  sr("Shortage", s.shortage, true, "FFE8A820");
  sr("No Mat#", s.noMat, false, "FFE07020");
  ws0.addRow([]);
  sr("Coverage", s.coverageRate + "% of total", true);

  // ── Group by equipment ──
  const eqGroups: Record<string, AnalyzedItem[]> = {};
  items.forEach((r) => {
    if (!r.equipment) return;
    if (!eqGroups[r.equipment]) eqGroups[r.equipment] = [];
    eqGroups[r.equipment].push(r);
  });

  // ── One sheet per equipment ──
  Object.entries(eqGroups).forEach(([eqName, eqItems]) => {
    const sn = eqName.replace(/[\\/*?:\[\]]/g, "").substring(0, 31);
    const hasCrit = eqItems.some((r) => r.status === "ZERO STOCK" || r.status === "NOT FOUND");
    const hasWarn = eqItems.some((r) => r.status === "SHORTAGE");
    const ws = wb.addWorksheet(sn, {
      properties: { tabColor: hasCrit ? { argb: "FFD94040" } : hasWarn ? { argb: "FFE8A820" } : { argb: "FF24C26B" } },
    });

    const r0 = ws.addRow(["", "Equipment", eqName, "E&M Critical Spare Part"]);
    r0.getCell(2).font = { name: "Arial", size: 10, bold: true, color: C.deep };
    r0.getCell(3).font = { name: "Arial", size: 10, bold: true, color: C.deep };
    ws.addRow([]); ws.addRow([]); ws.addRow([]); ws.addRow([]);

    const plantCols = allPlants.filter((p) => eqItems.some((r) => (r.plantBreakdown || {})[p] > 0));
    const hdrArr = ["", "Description", "OEM P/N", "OEM", "SAP Material No.", "Min", "Max", "Comments", "Status", "Total Stock", "Delta", "Action"];
    plantCols.forEach((p) => hdrArr.push(p));

    const hdr = ws.addRow(hdrArr);
    hdr.height = 20;
    hdrArr.forEach((_, idx) => {
      const cell = hdr.getCell(idx + 1);
      cell.font = { name: "Arial", size: 9, bold: true, color: C.w };
      cell.fill = fl(idx <= 7 ? C.deep : C.hp);
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = bd;
    });

    ws.getColumn(1).width = 14; ws.getColumn(2).width = 42; ws.getColumn(3).width = 18;
    ws.getColumn(4).width = 12; ws.getColumn(5).width = 16; ws.getColumn(6).width = 6;
    ws.getColumn(7).width = 6; ws.getColumn(8).width = 14; ws.getColumn(9).width = 13;
    ws.getColumn(10).width = 9; ws.getColumn(11).width = 7; ws.getColumn(12).width = 28;
    for (let p = 0; p < plantCols.length; p++) ws.getColumn(13 + p).width = 8;

    const statusOrder: Record<string, number> = { "ZERO STOCK": 0, "NOT FOUND": 1, "NO MAT#": 2, SHORTAGE: 3, "NO TARGET": 4, OK: 5 };
    [...eqItems].sort((a, b) => (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9)).forEach((r) => {
      let act = "";
      if (r.status === "NOT FOUND") act = "⚠ VERIFY MAT#";
      else if (r.status === "NO MAT#") act = "⚠ ADD SAP MAT#";
      else if (r.status === "ZERO STOCK" && r.hasAlternative) act = "TRANSFER";
      else if (r.status === "ZERO STOCK") act = "ORDER";
      else if (r.status === "SHORTAGE" && r.hasAlternative) act = "TRANSFER (short)";
      else if (r.status === "SHORTAGE") act = "REORDER";

      const rd: (string | number)[] = ["", r.description, r.oem, "", r.material || "", r.min, r.max, "", r.status, r.available, r.delta, act];
      plantCols.forEach((p) => rd.push((r.plantBreakdown || {})[p] || 0));

      const row = ws.addRow(rd);
      const nc = hdrArr.length;
      for (let c = 1; c <= nc; c++) {
        row.getCell(c).font = { name: "Arial", size: 9 };
        row.getCell(c).border = bd;
        row.getCell(c).alignment = { vertical: "middle" };
      }
      const bg = rowBg[r.status];
      if (bg) { for (let c = 1; c <= nc; c++) row.getCell(c).fill = fl(bg); }
      if (scMap[r.status]) row.getCell(9).font = { name: "Arial", size: 9, bold: true, color: scMap[r.status] };
      if (r.delta < 0) row.getCell(11).font = { name: "Arial", size: 9, bold: true, color: C.r };
      else if (r.delta > 0) row.getCell(11).font = { name: "Arial", size: 9, bold: true, color: C.g };
      for (let p = 0; p < plantCols.length; p++) {
        const v = (r.plantBreakdown || {})[plantCols[p]] || 0;
        const cell = row.getCell(13 + p);
        cell.alignment = { horizontal: "center" };
        cell.font = v > 0 ? { name: "Arial", size: 9, bold: true, color: C.te } : { name: "Arial", size: 9, color: { argb: "FFCCCCCC" } };
      }
    });
  });

  // ── SCM Actions summary ──
  const wsA = wb.addWorksheet("SCM Actions", { properties: { tabColor: { argb: "FFD94040" } } });
  const hA = ["Priority", "Equipment", "Description", "SAP Mat.", "Min", "Stock", "Order Qty", "Available at"];
  wsA.columns = [{ width: 16 }, { width: 24 }, { width: 46 }, { width: 14 }, { width: 8 }, { width: 8 }, { width: 10 }, { width: 42 }];
  const hrA = wsA.addRow(hA);
  hrA.height = 22;
  hA.forEach((_, i) => {
    const cell = hrA.getCell(i + 1);
    cell.font = { name: "Arial", bold: true, color: C.w, size: 10 };
    cell.fill = fl(C.r);
    cell.border = bd;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  items
    .filter((r) => r.status === "ZERO STOCK" || r.status === "SHORTAGE")
    .sort((a, b) => (a.status === "ZERO STOCK" ? 0 : 1) - (b.status === "ZERO STOCK" ? 0 : 1))
    .forEach((r) => {
      const pri = r.status === "ZERO STOCK"
        ? (r.hasAlternative ? "P2 TRANSFER" : "P1 ORDER")
        : (r.hasAlternative ? "P4 TRANSFER" : "P3 REORDER");
      const src = r.hasAlternative ? (r.transferSources || []).map((p) => p.plant + ": " + p.qty).join(", ") : "";
      const row = wsA.addRow([pri, r.equipment, r.description, r.material || "", r.min, r.available, r.orderQtyMin, src]);
      for (let c = 1; c <= 8; c++) {
        row.getCell(c).font = { name: "Arial", size: 9 };
        row.getCell(c).border = bd;
      }
      row.getCell(1).font = { name: "Arial", size: 9, bold: true, color: pri.includes("TRANSFER") ? C.te : C.r };
    });

  // ── Download ──
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CSPL_Gap_Analysis_" + new Date().toISOString().slice(0, 10) + ".xlsx";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}
