import type {
  SectionDef, ApplicableSection,
  Inspection, ItemResult, InspectionStats, CumulativeMode, LowerRef,
} from "./types";
import { EQUIPMENT } from "./equipment-registry";

/** Lower frequencies for cumulative mode (Cat IV is excluded) */
export function lowerFrequencies(equipmentType: string, freqId: string): string[] {
  const eq = EQUIPMENT[equipmentType];
  if (!eq?.frequencies) return [];
  const freq = eq.frequencies.find(f => f.id === freqId);
  if (!freq || freq.special === "cativ") return [];
  const idx = eq.frequencies.findIndex(f => f.id === freqId);
  return eq.frequencies.slice(0, idx)
    .filter(f => f.special !== "cativ")
    .map(f => f.id);
}

export function canBeCumulative(equipmentType: string, freqId: string): boolean {
  return lowerFrequencies(equipmentType, freqId).length > 0;
}

function sectionApplies(section: SectionDef, rigConfig: Record<string, string>): boolean {
  if (!section.requires) return true;
  for (const k in section.requires) {
    if ((rigConfig[k] || "") !== section.requires[k]) return false;
  }
  return true;
}

/** Get flat list of applicable sections (handles cumulative + rig config) */
export function applicableSections(ins: Inspection): ApplicableSection[] {
  const eq = EQUIPMENT[ins.equipmentType];
  if (!eq || eq.placeholder) return [];
  const freq = eq.frequencies.find(f => f.id === ins.frequency);
  if (!freq) return [];
  const freqIds = ins.cumulativeMode === "cumulative"
    ? [...lowerFrequencies(ins.equipmentType, ins.frequency), ins.frequency]
    : [ins.frequency];
  const out: ApplicableSection[] = [];
  freqIds.forEach(fid => {
    const fdef = eq.frequencies.find(x => x.id === fid);
    (eq.sections[fid] || []).forEach(sec => {
      if (sectionApplies(sec, ins.rigConfig)) {
        out.push({ ...sec, freqId: fid, freqLabel: fdef!.label, freqCat: fdef!.cat });
      }
    });
  });
  return out;
}

export function calcStats(ins: Inspection): InspectionStats {
  const secs = applicableSections(ins);
  let total = 0, ok = 0, obs = 0, def = 0, na = 0, done = 0, critOpen = 0;
  secs.forEach(s => s.items.forEach(it => {
    total++;
    const r = ins.results[it.id];
    if (r?.status) {
      done++;
      if (r.status === "ok") ok++;
      else if (r.status === "obs") { obs++; if (it.critical) critOpen++; }
      else if (r.status === "def") { def++; if (it.critical) critOpen++; }
      else if (r.status === "na") na++;
    }
  }));
  return { total, ok, obs, def, na, done, critOpen, pct: total ? Math.round(done / total * 100) : 0 };
}

/** Create a fresh inspection */
export function createInspection(
  equipmentType: string,
  frequencyId: string,
  rigConfig: Record<string, string>,
  opts?: { cumulativeMode?: CumulativeMode; lowerRefs?: LowerRef[] },
): Inspection {
  const now = Date.now();
  const ins: Inspection = {
    id: "INS-" + now.toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1296).toString(36).toUpperCase(),
    equipmentType,
    frequency: frequencyId,
    cumulativeMode: opts?.cumulativeMode || "standalone",
    lowerRefs: opts?.lowerRefs || [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
    rigConfig,
    header: {
      reportNo: "", date: new Date().toISOString().slice(0, 10),
      rig: "", location: "",
      inspectorName: "", inspectorCert: "",
      supervisorName: "", clientName: "",
      manufacturer: rigConfig.manufacturer || "",
      model: "", serialNo: "", yearOfMfg: "",
      workOrder: "", notes: "",
      lastInspection: "", nextDue: "",
    },
    results: {},
    signatures: { inspector: "", supervisor: "", client: "" },
    finalNotes: "",
  };
  // Pre-populate results
  applicableSections(ins).forEach(sec => sec.items.forEach(it => {
    ins.results[it.id] = {
      status: null, methods: it.methods || [],
      measurement: "", nominal: "", tolMin: "", tolMax: "",
      unit: it.unit || "", comment: "", photos: [],
    };
  }));
  return ins;
}

/** Tolerance check */
export function tolClass(r: ItemResult): { klass: string; text: string } {
  if (!r.measurement || (r.tolMin === "" && r.tolMax === "")) return { klass: "", text: "" };
  const v = parseFloat(r.measurement);
  const lo = r.tolMin !== "" ? parseFloat(r.tolMin) : -Infinity;
  const hi = r.tolMax !== "" ? parseFloat(r.tolMax) : Infinity;
  if (isNaN(v)) return { klass: "", text: "" };
  if (v < lo || v > hi) return { klass: "fail", text: "Out of tolerance" };
  return { klass: "pass", text: "Within tolerance" };
}
