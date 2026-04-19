import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  AlertTriangle,
  X,
  Minus,
  Camera,
  MessageSquare,
  Download,
  Trash2,
  Plus,
  Wifi,
  Cog,
  HardDrive,
  Layers,
  Box,
  Triangle,
  Shield,
  Circle,
  RotateCw,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import type {
  EquipmentDef,
  Inspection,
  ItemResult,
  ItemStatus,
  InspectionItemDef,
  ApplicableSection,
  CumulativeMode,
  LowerRef,
} from "@/lib/rig-inspection/types";
import { EQUIPMENT } from "@/lib/rig-inspection/equipment-registry";
import {
  applicableSections,
  calcStats,
  createInspection,
  canBeCumulative,
  lowerFrequencies,
  tolClass,
} from "@/lib/rig-inspection/utils";

// ─── Screen enum ───
type Screen = "home" | "frequency" | "config" | "inspection" | "archive";

// ─── LocalStorage helpers for inspections ───
const STORAGE_KEY = "rig_inspections";
function loadAll(): Inspection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveAll(list: Inspection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function saveInspection(ins: Inspection) {
  const list = loadAll();
  const idx = list.findIndex((x) => x.id === ins.id);
  if (idx >= 0) list[idx] = ins;
  else list.push(ins);
  saveAll(list);
}
function deleteInspection(id: string) {
  saveAll(loadAll().filter((x) => x.id !== id));
}

// ─── CAT badge colours ───
const catColor: Record<string, string> = {
  I: "bg-emerald-600 text-white",
  II: "bg-blue-600 text-white",
  III: "bg-amber-600 text-white",
  IV: "bg-red-600 text-white",
};

// ────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────
export default function RigInspection() {
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedEquip, setSelectedEquip] = useState<string>("");
  const [selectedFreq, setSelectedFreq] = useState<string>("");
  const [current, setCurrent] = useState<Inspection | null>(null);
  const [step, setStep] = useState(0);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  }, []);

  // ─── Auto-save current inspection ───
  const autoSave = useCallback((ins: Inspection) => {
    ins.updatedAt = Date.now();
    saveInspection(ins);
    setCurrent({ ...ins });
  }, []);

  // ─── START ───
  const startInspection = useCallback(
    (
      eqType: string,
      freqId: string,
      rigConfig: Record<string, string>,
      opts?: { cumulativeMode?: CumulativeMode; lowerRefs?: LowerRef[] },
    ) => {
      const ins = createInspection(eqType, freqId, rigConfig, opts);
      saveInspection(ins);
      setCurrent(ins);
      setStep(0);
      go("inspection");
    },
    [go],
  );

  const resumeInspection = useCallback(
    (id: string) => {
      const all = loadAll();
      const ins = all.find((x) => x.id === id);
      if (!ins) {
        toast({ title: "Not found" });
        return;
      }
      setCurrent(ins);
      setStep(0);
      go("inspection");
    },
    [go, toast],
  );

  // ─── RENDER SCREEN ───
  const isHome = screen === "home";

  return (
    <div className={isHome ? "" : "max-w-7xl mx-auto"}>
      {isHome && (
        <>
          {/* ─── Navy Header Bar ─── */}
          <div className="bg-[#143269] text-white">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded flex items-center justify-center font-bold text-sm">
                  H&P
                </div>
                <div>
                  <div className="font-semibold text-sm tracking-wide">
                    Equipment Maintenance
                  </div>
                  <div className="text-[11px] text-white/60">
                    CAT I – IV · API 7K / RP 7L / RP 8B
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  className="text-sm font-medium text-white/90 hover:text-white border-b-2 border-white pb-0.5"
                  onClick={() => go("home")}
                >
                  Equipment
                </button>
                <button
                  className="text-sm font-medium text-white/60 hover:text-white"
                  onClick={() => go("archive")}
                >
                  Archive
                </button>
              </div>
            </div>
            {/* gradient accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-[#2B5597] via-[#24C26B] to-[#24C26B]" />
          </div>
        </>
      )}

      {!isHome && (
        <div className="h-0.5 w-full bg-gradient-to-r from-[#2B5597] to-[#24C26B] mb-6" />
      )}

      {screen === "home" && (
        <HomeScreen
          onSelectEquipment={(eqId) => {
            setSelectedEquip(eqId);
            go("frequency");
          }}
          onResume={resumeInspection}
        />
      )}
      {screen === "frequency" && (
        <FrequencyScreen
          equipmentType={selectedEquip}
          onBack={() => go("home")}
          onSelect={(freqId) => {
            setSelectedFreq(freqId);
            go("config");
          }}
        />
      )}
      {screen === "config" && (
        <ConfigScreen
          equipmentType={selectedEquip}
          frequencyId={selectedFreq}
          onBack={() => go("frequency")}
          onStart={startInspection}
        />
      )}
      {screen === "inspection" && current && (
        <InspectionWizard
          inspection={current}
          step={step}
          setStep={setStep}
          onSave={autoSave}
          onExit={() => {
            go("home");
          }}
          onDelete={() => {
            deleteInspection(current.id);
            setCurrent(null);
            go("home");
            toast({ title: "Gelöscht" });
          }}
        />
      )}
      {screen === "archive" && (
        <ArchiveScreen
          onBack={() => go("home")}
          onOpen={resumeInspection}
          onDelete={(id) => {
            deleteInspection(id);
          }}
        />
      )}
    </div>
  );
}

// ─── Equipment icon mapping ───
const equipmentIcons: Record<string, React.ReactNode> = {
  drawworks: <Cog className="h-10 w-10 text-[#2B5597]" strokeWidth={1.5} />,
  topdrive: (
    <HardDrive className="h-10 w-10 text-[#2B5597]" strokeWidth={1.5} />
  ),
  mudpumps: <Layers className="h-10 w-10 text-[#2B5597]" strokeWidth={1.5} />,
  travelblock: <Box className="h-10 w-10 text-[#2B5597]" strokeWidth={1.5} />,
  tanks: <Box className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />,
  mast: <Triangle className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />,
  bop: <Shield className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />,
  crownblock: <Circle className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />,
  rotarytable: (
    <RotateCw className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />
  ),
  ironroughneck: (
    <Wrench className="h-10 w-10 text-[#8898aa]" strokeWidth={1.5} />
  ),
};

// ────────────────────────────────────────────
// HOME SCREEN — H&P-style Equipment Dashboard
// ────────────────────────────────────────────
function HomeScreen({
  onSelectEquipment,
  onResume,
}: {
  onSelectEquipment: (id: string) => void;
  onResume: (id: string) => void;
}) {
  const drafts = useMemo(
    () =>
      loadAll()
        .filter((x) => x.status === "draft")
        .slice(0, 3),
    [],
  );

  const activeEquipment = Object.values(EQUIPMENT).filter(
    (eq) => !eq.placeholder,
  );
  const placeholderEquipment = Object.values(EQUIPMENT).filter(
    (eq) => eq.placeholder,
  );

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
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Bohranlagen
              </h1>
              <p className="text-sm text-white/60">
                Rig equipment maintenance — field-ready, offline-first
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* ─── RFID Scanner Banner ─── */}
        <div className="mt-10 bg-[#1e3a6e] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Wifi className="h-6 w-6 text-white/80" />
            </div>
            <div>
              <div className="text-[#24C26B] text-xs font-bold uppercase tracking-widest">
                Phase 2 Preview
              </div>
              <div className="text-white font-semibold mt-0.5">
                Tap to scan equipment tag
              </div>
              <div className="text-white/60 text-sm mt-0.5 max-w-md">
                Hold the tablet against the equipment's RFID / NFC tag. We'll
                identify the unit, pull its history, and jump you straight to
                the due inspection.
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold px-6"
              onClick={() => {}}
            >
              Simulate Scan
            </Button>
            <span className="text-white/40 text-[10px] uppercase tracking-wider">
              Demo only
            </span>
          </div>
        </div>

        {/* ─── Drafts / Continue ─── */}
        {drafts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Continue inspection
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((ins) => {
                const eq = EQUIPMENT[ins.equipmentType];
                const freq = eq?.frequencies.find(
                  (f) => f.id === ins.frequency,
                );
                const stats = calcStats(ins);
                return (
                  <div
                    key={ins.id}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 cursor-pointer hover:border-[#2B5597] hover:shadow-lg transition-all"
                    onClick={() => onResume(ins.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#143269] dark:text-blue-300">
                        {eq?.name}
                      </span>
                      {freq && (
                        <Badge className={catColor[freq.cat]}>
                          CAT {freq.cat}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ins.header.reportNo || ins.id}
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2B5597] to-[#24C26B] rounded-full transition-all"
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {stats.pct}% — {stats.done}/{stats.total} items
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Main Equipment ─── */}
        <div className="mt-10">
          <details open>
            <summary className="cursor-pointer text-sm font-semibold text-[#143269] dark:text-blue-300 uppercase tracking-widest mb-1 list-none flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4" />
              Main equipment
            </summary>
            <p className="text-sm text-muted-foreground mb-5 ml-5.5">
              Drawworks is active. Other equipment will be rolled out in the
              same pattern.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {activeEquipment.map((eq) => (
                <div
                  key={eq.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-[#2B5597] hover:shadow-lg transition-all group"
                  onClick={() => onSelectEquipment(eq.id)}
                >
                  <div className="mb-5">
                    {equipmentIcons[eq.id] || (
                      <Cog
                        className="h-10 w-10 text-[#2B5597]"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-[#143269] dark:text-blue-300 text-lg group-hover:text-[#2B5597] transition-colors">
                    {eq.name}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {eq.docRef}
                    {eq.equipmentCode ? ` · ${eq.equipmentCode}` : ""}
                  </div>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-[#4a6fa5]">
                      {eq.frequencies.length} inspection types
                    </span>
                    <Badge className="bg-[#24C26B] hover:bg-[#1ea856] text-white text-[10px] font-bold px-2.5 py-0.5">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* ─── Placeholder Equipment ─── */}
        {placeholderEquipment.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {placeholderEquipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 opacity-60"
              >
                <div className="mb-5">
                  {equipmentIcons[eq.id] || (
                    <Cog
                      className="h-10 w-10 text-[#8898aa]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <h3 className="font-bold text-[#8898aa] text-lg">{eq.name}</h3>
                <div className="text-xs text-muted-foreground mt-1.5">—</div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <Badge
                    variant="outline"
                    className="text-[#8898aa] border-[#8898aa] text-[10px] font-bold px-2.5 py-0.5"
                  >
                    COMING SOON
                  </Badge>
                  <span className="text-xs text-muted-foreground italic">
                    Placeholder
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// FREQUENCY PICKER
// ────────────────────────────────────────────
function FrequencyScreen({
  equipmentType,
  onBack,
  onSelect,
}: {
  equipmentType: string;
  onBack: () => void;
  onSelect: (freqId: string) => void;
}) {
  const eq = EQUIPMENT[equipmentType];
  if (!eq || eq.placeholder) return null;

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Equipment", onClick: onBack }, { label: eq.name }]}
      />
      <h1 className="text-2xl font-medium text-[#143269] dark:text-blue-300 tracking-tight mb-1">
        {eq.name} inspection
      </h1>
      <p className="text-[#2B5597] dark:text-blue-400 font-light mb-6">
        Choose the inspection category per {eq.docRef}. Each frequency is
        standalone.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eq.frequencies.map((freq) => {
          let itemCount = 0;
          (eq.sections[freq.id] || []).forEach((s) => {
            itemCount += s.items.length;
          });
          return (
            <Card
              key={freq.id}
              className="cursor-pointer hover:border-[#2B5597] hover:shadow-md transition-all"
              onClick={() => onSelect(freq.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#143269] dark:text-blue-300">
                    {freq.label}
                  </span>
                  <Badge className={catColor[freq.cat]}>CAT {freq.cat}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {freq.desc}
                </p>
                <div className="text-xs text-muted-foreground">
                  <strong>Performed by:</strong> {freq.who}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>
                    {freq.special === "cativ"
                      ? "Major overhaul"
                      : `${itemCount} tasks max`}
                  </span>
                  <span>
                    {freq.special === "cativ" ? "Handover" : "Standalone"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// CONFIG SCREEN — rig setup + cumulation mode
// ────────────────────────────────────────────
function ConfigScreen({
  equipmentType,
  frequencyId,
  onBack,
  onStart,
}: {
  equipmentType: string;
  frequencyId: string;
  onBack: () => void;
  onStart: (
    eqType: string,
    freqId: string,
    config: Record<string, string>,
    opts?: { cumulativeMode?: CumulativeMode; lowerRefs?: LowerRef[] },
  ) => void;
}) {
  const eq = EQUIPMENT[equipmentType];
  const freq = eq?.frequencies.find((f) => f.id === frequencyId);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<CumulativeMode>("standalone");
  const canCumulate = canBeCumulative(equipmentType, frequencyId);

  if (!eq || !freq) return null;

  const missing = eq.config.filter((c) => !config[c.key]).map((c) => c.label);

  const proceed = () => {
    if (missing.length) return;
    onStart(equipmentType, frequencyId, config, {
      cumulativeMode: canCumulate ? mode : "standalone",
    });
  };

  // Count items per mode
  const lowerIds = lowerFrequencies(equipmentType, frequencyId);
  let lowerCount = 0,
    ownCount = 0;
  lowerIds.forEach((id) =>
    (eq.sections[id] || []).forEach((s) => {
      lowerCount += s.items.length;
    }),
  );
  (eq.sections[frequencyId] || []).forEach((s) => {
    ownCount += s.items.length;
  });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Equipment", onClick: () => {} },
          { label: eq.name, onClick: onBack },
          { label: `${freq.label} (Cat ${freq.cat})` },
        ]}
      />
      <h1 className="text-2xl font-medium text-[#143269] dark:text-blue-300 tracking-tight mb-1">
        Inspection setup
      </h1>
      <p className="text-[#2B5597] dark:text-blue-400 font-light mb-6">
        Tell us about this {eq.name.toLowerCase()} so we only show the checks
        that apply to it.
      </p>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#143269] dark:text-blue-300">
              Equipment setup
            </CardTitle>
            <Badge className={catColor[freq.cat]}>
              CAT {freq.cat} · {freq.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eq.config.map((c) => (
              <div key={c.key}>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </Label>
                <Select
                  value={config[c.key] || ""}
                  onValueChange={(v) =>
                    setConfig((p) => ({ ...p, [c.key]: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="— select —" />
                  </SelectTrigger>
                  <SelectContent>
                    {c.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {canCumulate && (
            <div className="mt-8 border rounded-md p-5">
              <h3 className="font-medium text-[#143269] dark:text-blue-300 mb-2">
                Have the lower-category tasks already been completed?
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {eq.docRef} requires that a {freq.label.toLowerCase()}{" "}
                inspection also covers the lower-frequency tasks. Choose{" "}
                <strong>Standalone</strong> if those have already been done, or{" "}
                <strong>Cumulative</strong> to include everything.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={`text-left border rounded-md p-4 transition-all ${mode === "standalone" ? "border-[#2B5597] bg-[#2B5597]/5 ring-1 ring-[#2B5597]" : "hover:border-muted-foreground"}`}
                  onClick={() => setMode("standalone")}
                >
                  <div className="font-medium text-sm">Standalone</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Only {freq.label.toLowerCase()} tasks
                  </div>
                  <div className="text-xs font-medium mt-2">
                    {ownCount} tasks
                  </div>
                </button>
                <button
                  className={`text-left border rounded-md p-4 transition-all ${mode === "cumulative" ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500" : "hover:border-muted-foreground"}`}
                  onClick={() => setMode("cumulative")}
                >
                  <div className="font-medium text-sm">Cumulative</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Everything in one report
                  </div>
                  <div className="text-xs font-medium mt-2">
                    {ownCount + lowerCount} tasks
                  </div>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={proceed}
          disabled={missing.length > 0}
          className="bg-gradient-to-r from-[#2B5597] to-[#24C26B] hover:opacity-90 text-white"
        >
          Start inspection <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-destructive mt-2">
          Please fill: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// INSPECTION WIZARD
// ────────────────────────────────────────────
function InspectionWizard({
  inspection,
  step,
  setStep,
  onSave,
  onExit,
  onDelete,
}: {
  inspection: Inspection;
  step: number;
  setStep: (s: number) => void;
  onSave: (ins: Inspection) => void;
  onExit: () => void;
  onDelete: () => void;
}) {
  const eq = EQUIPMENT[inspection.equipmentType];
  const freq = eq?.frequencies.find((f) => f.id === inspection.frequency);
  const secs = useMemo(() => applicableSections(inspection), [inspection]);
  const stats = useMemo(() => calcStats(inspection), [inspection]);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Build steps
  type StepDef = {
    id: string;
    label: string;
    kind: "header" | "section" | "signoff";
    secRef?: ApplicableSection;
  };
  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = [
      { id: "header", label: "Report details", kind: "header" },
    ];
    secs.forEach((sec) =>
      s.push({
        id: "sec-" + sec.id,
        label: sec.name,
        kind: "section",
        secRef: sec,
      }),
    );
    s.push({ id: "signoff", label: "Sign-off & export", kind: "signoff" });
    return s;
  }, [secs]);

  const isStepComplete = (i: number) => {
    const s = steps[i];
    if (s.kind === "header")
      return !!(
        inspection.header.reportNo &&
        inspection.header.date &&
        inspection.header.inspectorName
      );
    if (s.kind === "section" && s.secRef)
      return s.secRef.items.every((it) => inspection.results[it.id]?.status);
    if (s.kind === "signoff") return !!inspection.signatures.inspector;
    return false;
  };

  // Count incomplete items per step
  const stepItemCount = (i: number) => {
    const s = steps[i];
    if (s.kind === "section" && s.secRef) {
      const incomplete = s.secRef.items.filter(
        (it) => !inspection.results[it.id]?.status,
      ).length;
      return incomplete;
    }
    return 0;
  };

  const currentStep = steps[step];
  if (!eq || !freq) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Navy Header ─── */}
      <div className="bg-[#143269] text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded flex items-center justify-center font-bold text-sm">
              H&P
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide">
                Equipment Maintenance
              </div>
              <div className="text-[11px] text-white/60">
                CAT I – IV · API 7K / RP 7L / RP 8B
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="text-sm font-medium text-white/90 hover:text-white border-b-2 border-white pb-0.5"
              onClick={onExit}
            >
              Equipment
            </button>
            <button
              className="text-sm font-medium text-white/60 hover:text-white"
              onClick={onExit}
            >
              Archive
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-[#2B5597] via-[#24C26B] to-[#24C26B]" />
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 bg-[#f7f9fc] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumbs */}
          <div className="text-sm mb-6 flex items-center gap-1.5">
            <button className="text-[#2B5597] hover:underline" onClick={onExit}>
              Equipment
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{eq.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {freq.label} (Cat {freq.cat})
            </span>
          </div>

          {/* ─── Report header bar ─── */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-6 py-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {eq.name.toUpperCase()} · {freq.label.toUpperCase()} ·{" "}
                  {eq.docRef}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <h2 className="text-xl font-bold text-[#143269] dark:text-blue-300">
                    Report {inspection.header.reportNo || inspection.id}
                  </h2>
                  <Badge className={catColor[freq.cat]}>CAT {freq.cat}</Badge>
                  <Badge
                    variant="outline"
                    className="text-xs uppercase font-semibold tracking-wider"
                  >
                    {inspection.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-[180px] sm:w-48">
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2B5597] to-[#24C26B] rounded-full transition-all"
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                  {stats.done}/{stats.total} · {stats.pct}%
                </span>
              </div>
            </div>
          </div>

          {stats.critOpen > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-lg text-sm mb-6">
              <AlertTriangle className="h-4 w-4 inline mr-1.5" />
              {stats.critOpen} critical item{stats.critOpen === 1 ? "" : "s"}{" "}
              flagged as observation or defect.
            </div>
          )}

          {/* ─── Horizontal step tabs ─── */}
          <div className="relative mb-8">
            <div
              ref={tabsRef}
              className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin"
            >
              {steps.map((s, i) => {
                const complete = isStepComplete(i);
                const active = i === step;
                const incomplete = stepItemCount(i);
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-all
                      ${
                        active
                          ? "bg-[#2B5597] text-white border-[#2B5597] shadow-md"
                          : complete
                            ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                            : "bg-white dark:bg-slate-800 text-muted-foreground border-gray-200 dark:border-slate-700 hover:border-[#2B5597]/50"
                      }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0
                        ${
                          active
                            ? "bg-white text-[#2B5597]"
                            : complete
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                        }`}
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="uppercase tracking-wide text-xs">
                      {s.label}
                    </span>
                    {!complete && incomplete > 0 && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold
                          ${active ? "bg-white/20 text-white" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"}`}
                      >
                        {incomplete}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Step content ─── */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {currentStep?.kind === "header" && (
              <HeaderStep inspection={inspection} eq={eq} onSave={onSave} />
            )}
            {currentStep?.kind === "section" && currentStep.secRef && (
              <SectionStep
                section={currentStep.secRef}
                inspection={inspection}
                onSave={onSave}
              />
            )}
            {currentStep?.kind === "signoff" && (
              <SignoffStep
                inspection={inspection}
                stats={stats}
                secs={secs}
                onSave={onSave}
              />
            )}
          </div>

          {/* ─── Bottom Navigation ─── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-[#143269] dark:text-blue-300 font-bold uppercase tracking-wider text-sm hover:bg-[#143269]/5"
                onClick={onExit}
              >
                Save & Exit
              </Button>
              <Button
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold uppercase tracking-wider text-sm"
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="font-medium text-sm"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {step < steps.length - 1 && (
                <Button
                  className="bg-[#2B8A8A] hover:bg-[#247777] text-white font-medium text-sm px-6"
                  onClick={() => setStep(step + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// HEADER STEP
// ────────────────────────────────────────────
function HeaderStep({
  inspection,
  eq,
  onSave,
}: {
  inspection: Inspection;
  eq: EquipmentDef;
  onSave: (ins: Inspection) => void;
}) {
  const set = (key: string, value: string) => {
    inspection.header[key] = value;
    onSave(inspection);
  };
  const h = inspection.header;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Report details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Report number *"
              value={h.reportNo}
              onChange={(v) => set("reportNo", v)}
            />
            <Field
              label="Inspection date *"
              value={h.date}
              onChange={(v) => set("date", v)}
              type="date"
            />
            <Field
              label="Work order"
              value={h.workOrder}
              onChange={(v) => set("workOrder", v)}
            />
            <Field
              label="Rig / Installation"
              value={h.rig}
              onChange={(v) => set("rig", v)}
            />
            <Field
              label="Location / Yard"
              value={h.location}
              onChange={(v) => set("location", v)}
            />
            <Field
              label="Client"
              value={h.clientName}
              onChange={(v) => set("clientName", v)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Inspector & supervisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Inspector name *"
              value={h.inspectorName}
              onChange={(v) => set("inspectorName", v)}
            />
            <Field
              label="Inspector certification"
              value={h.inspectorCert}
              onChange={(v) => set("inspectorCert", v)}
              placeholder="e.g. ASNT Level II"
            />
            <Field
              label="Supervisor / Toolpusher"
              value={h.supervisorName}
              onChange={(v) => set("supervisorName", v)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Equipment — {eq.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Manufacturer"
              value={h.manufacturer}
              onChange={(v) => set("manufacturer", v)}
            />
            <Field
              label="Model"
              value={h.model}
              onChange={(v) => set("model", v)}
            />
            <Field
              label="Serial number *"
              value={h.serialNo}
              onChange={(v) => set("serialNo", v)}
            />
            <Field
              label="Year of manufacture"
              value={h.yearOfMfg}
              onChange={(v) => set("yearOfMfg", v)}
            />
            <Field
              label="Last inspection"
              value={h.lastInspection}
              onChange={(v) => set("lastInspection", v)}
              type="date"
            />
            <Field
              label="Next due"
              value={h.nextDue}
              onChange={(v) => set("nextDue", v)}
              type="date"
            />
          </div>
          <div className="mt-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              General notes
            </Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={h.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Rig configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eq.config.map((c) => (
              <div key={c.key}>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </Label>
                <Input
                  className="mt-1 bg-muted"
                  value={inspection.rigConfig[c.key] || ""}
                  disabled
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Rig configuration is locked for this inspection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// SECTION STEP — checklist items
// ────────────────────────────────────────────
function SectionStep({
  section,
  inspection,
  onSave,
}: {
  section: ApplicableSection;
  inspection: Inspection;
  onSave: (ins: Inspection) => void;
}) {
  const setResult = (
    itemId: string,
    key: keyof ItemResult,
    value: string | null,
  ) => {
    const r = inspection.results[itemId];
    if (!r) return;
    (r as unknown as Record<string, unknown>)[key] = value;
    onSave(inspection);
  };

  return (
    <div className="p-6">
      <details open>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-5 w-5 text-[#2B5597]" />
            <h2 className="text-2xl font-bold text-[#143269] dark:text-blue-300">
              {section.name}
            </h2>
          </div>
        </summary>
        <p className="text-sm font-semibold text-[#2B5597] mt-1 ml-7">
          {section.freqLabel} · Cat {section.freqCat}
          {section.requires && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · Applies because:{" "}
              {Object.entries(section.requires)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
            </span>
          )}
        </p>
      </details>

      <div className="mt-6 divide-y divide-gray-100 dark:divide-slate-700">
        {section.items.map((item) => (
          <InspectionItemRow
            key={item.id}
            item={item}
            result={inspection.results[item.id]}
            onSetResult={(key, value) => setResult(item.id, key, value)}
          />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// SINGLE ITEM ROW
// ────────────────────────────────────────────
function InspectionItemRow({
  item,
  result,
  onSetResult,
}: {
  item: InspectionItemDef;
  result: ItemResult | undefined;
  onSetResult: (key: keyof ItemResult, value: string | null) => void;
}) {
  const [showComment, setShowComment] = useState(!!result?.comment);
  const [showPhotos, setShowPhotos] = useState(
    (result?.photos?.length || 0) > 0,
  );
  if (!result) return null;

  const statusButtons: {
    status: ItemStatus;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      status: "ok",
      label: "OK",
      icon: <Check className="h-5 w-5" />,
      activeClass: "bg-emerald-600 text-white border-emerald-600",
    },
    {
      status: "obs",
      label: "OBS",
      icon: <AlertTriangle className="h-5 w-5" />,
      activeClass: "bg-amber-500 text-white border-amber-500",
    },
    {
      status: "def",
      label: "DEFECT",
      icon: <X className="h-5 w-5" />,
      activeClass: "bg-red-600 text-white border-red-600",
    },
    {
      status: "na",
      label: "N/A",
      icon: <Minus className="h-5 w-5" />,
      activeClass: "bg-gray-500 text-white border-gray-500",
    },
  ];

  const tc = tolClass(result);
  const rowBg =
    result.status === "def"
      ? "bg-red-50/50 dark:bg-red-950/10"
      : result.status === "obs"
        ? "bg-amber-50/50 dark:bg-amber-950/10"
        : "";

  return (
    <div className={`py-6 px-1 ${rowBg}`}>
      <div className="flex items-start justify-between gap-6">
        {/* Left: description + tags */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {item.description}
            {item.critical && (
              <Badge className="ml-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-0.5">
                Critical
              </Badge>
            )}
            {item.ndt && (
              <Badge className="ml-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5">
                NDT
              </Badge>
            )}
          </p>
          {/* Method tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.methods.map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-[#2B5597] dark:text-blue-400 rounded font-medium border border-blue-100 dark:border-blue-900"
              >
                {m}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-3">
            <button
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all
                ${
                  showComment
                    ? "border-[#2B5597] text-[#2B5597] bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-slate-600 text-muted-foreground hover:border-[#2B5597] hover:text-[#2B5597]"
                }`}
              onClick={() => setShowComment(!showComment)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider font-semibold">
                {result.comment ? "Comment" : "Add Comment"}
              </span>
            </button>
            <button
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all
                ${
                  showPhotos
                    ? "border-[#2B5597] text-[#2B5597] bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-slate-600 text-muted-foreground hover:border-[#2B5597] hover:text-[#2B5597]"
                }`}
              onClick={() => setShowPhotos(!showPhotos)}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider font-semibold">
                Photos
                {result.photos.length > 0 ? ` (${result.photos.length})` : ""}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Status buttons — box layout */}
        <div className="flex shrink-0 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden divide-x divide-gray-200 dark:divide-slate-600">
          {statusButtons.map((sb) => {
            const isActive = result.status === sb.status;
            return (
              <button
                key={sb.status}
                onClick={() =>
                  onSetResult(
                    "status",
                    result.status === sb.status ? null : sb.status,
                  )
                }
                className={`flex flex-col items-center justify-center w-16 h-16 transition-all
                  ${
                    isActive
                      ? sb.activeClass
                      : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
              >
                {sb.icon}
                <span className="text-[10px] font-bold mt-0.5 tracking-wide">
                  {sb.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Measurement */}
      {item.measurement && (
        <div className="mt-4 flex items-center gap-2 flex-wrap ml-0">
          <Input
            className="w-24 h-8 text-xs"
            placeholder="Nominal"
            value={result.nominal}
            onChange={(e) => onSetResult("nominal", e.target.value)}
            type="number"
            step="any"
          />
          <Input
            className="w-28 h-8 text-xs"
            placeholder={`Actual (${result.unit || item.unit || ""})`}
            value={result.measurement}
            onChange={(e) => onSetResult("measurement", e.target.value)}
            type="number"
            step="any"
          />
          <Input
            className="w-20 h-8 text-xs"
            placeholder="Tol min"
            value={result.tolMin}
            onChange={(e) => onSetResult("tolMin", e.target.value)}
            type="number"
            step="any"
          />
          <Input
            className="w-20 h-8 text-xs"
            placeholder="Tol max"
            value={result.tolMax}
            onChange={(e) => onSetResult("tolMax", e.target.value)}
            type="number"
            step="any"
          />
          {tc.text && (
            <span
              className={`text-xs font-medium ${tc.klass === "pass" ? "text-emerald-600" : "text-red-600"}`}
            >
              {tc.text}
            </span>
          )}
        </div>
      )}

      {showComment && (
        <Textarea
          className="mt-3 text-sm"
          rows={2}
          placeholder="Comment, observation, recommendation…"
          value={result.comment}
          onChange={(e) => onSetResult("comment", e.target.value)}
        />
      )}

      {showPhotos && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {result.photos.map((p, i) => (
            <div key={i} className="relative group">
              <img
                src={p.data}
                alt=""
                className="h-16 w-16 object-cover rounded border"
              />
              <button
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-4 w-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  result.photos.splice(i, 1);
                  onSetResult("comment", result.comment); // trigger save
                }}
              >
                ×
              </button>
            </div>
          ))}
          <PhotoPicker
            onPhoto={(data) => {
              result.photos.push({ data, caption: "", ts: Date.now() });
              onSetResult("comment", result.comment); // trigger save
            }}
          />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// SIGN-OFF
// ────────────────────────────────────────────
function SignoffStep({
  inspection,
  stats,
  secs,
  onSave,
}: {
  inspection: Inspection;
  stats: ReturnType<typeof calcStats>;
  secs: ApplicableSection[];
  onSave: (ins: Inspection) => void;
}) {
  const { toast } = useToast();

  const findings = useMemo(() => {
    const list: {
      section: string;
      item: InspectionItemDef;
      result: ItemResult;
    }[] = [];
    secs.forEach((s) =>
      s.items.forEach((it) => {
        const r = inspection.results[it.id];
        if (r && (r.status === "def" || r.status === "obs")) {
          list.push({ section: s.name, item: it, result: r });
        }
      }),
    );
    return list;
  }, [secs, inspection]);

  const markComplete = () => {
    if (!inspection.signatures.inspector) {
      toast({ title: "Inspector signature required", variant: "destructive" });
      return;
    }
    inspection.status = "complete";
    inspection.completedAt = Date.now();
    onSave(inspection);
    toast({ title: "Inspection marked complete" });
  };

  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          inspection,
          (_, v) => {
            // Exclude large photo data from JSON export to keep file manageable
            if (
              typeof v === "string" &&
              v.startsWith("data:image/") &&
              v.length > 1000
            )
              return "[image data]";
            return v;
          },
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inspection.header.reportNo || inspection.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Inspection summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <StatBox
              label="Total"
              value={stats.total}
              color="text-[#143269] dark:text-blue-300"
            />
            <StatBox label="OK" value={stats.ok} color="text-emerald-600" />
            <StatBox
              label="Observations"
              value={stats.obs}
              color="text-amber-600"
            />
            <StatBox label="Defects" value={stats.def} color="text-red-600" />
            <StatBox
              label="N/A"
              value={stats.na}
              color="text-muted-foreground"
            />
            <StatBox
              label="Completion"
              value={`${stats.pct}%`}
              color="text-[#143269] dark:text-blue-300"
            />
          </div>

          {findings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">
                Findings ({findings.length})
              </h3>
              <div className="border rounded-md divide-y">
                {findings.map((f, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <Badge
                      className={
                        f.result.status === "def"
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-white"
                      }
                    >
                      {f.result.status === "def" ? "Defect" : "Obs"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {f.section}
                      </div>
                      <div className="text-sm">
                        {f.item.description}
                        {f.item.critical && (
                          <span className="ml-1 text-[10px] text-red-600 font-semibold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      {f.result.comment && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {f.result.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Overall recommendation / closing notes
            </Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={inspection.finalNotes}
              onChange={(e) => {
                inspection.finalNotes = e.target.value;
                onSave(inspection);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <SignatureField
              label="Inspector"
              name={inspection.header.inspectorName}
              value={inspection.signatures.inspector}
              onChange={(v) => {
                inspection.signatures.inspector = v;
                onSave(inspection);
              }}
            />
            <SignatureField
              label="Supervisor / Toolpusher"
              name={inspection.header.supervisorName}
              value={inspection.signatures.supervisor}
              onChange={(v) => {
                inspection.signatures.supervisor = v;
                onSave(inspection);
              }}
            />
            <SignatureField
              label="Client representative"
              name={inspection.header.clientName}
              value={inspection.signatures.client}
              onChange={(v) => {
                inspection.signatures.client = v;
                onSave(inspection);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#143269] dark:text-blue-300">
            Finalize & export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Mark the inspection as complete and export the report.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-gradient-to-r from-[#2B5597] to-[#24C26B] text-white"
              onClick={markComplete}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark complete
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// ARCHIVE
// ────────────────────────────────────────────
function ArchiveScreen({
  onBack,
  onOpen,
  onDelete,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [list, setList] = useState(() =>
    loadAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
  );

  const handleDelete = (id: string) => {
    onDelete(id);
    setList((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Equipment", onClick: onBack }, { label: "Archive" }]}
      />
      <h1 className="text-2xl font-medium text-[#143269] dark:text-blue-300 tracking-tight mb-6">
        Archive
      </h1>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="font-medium text-muted-foreground">
            No inspections yet
          </h3>
          <Button className="mt-4" variant="outline" onClick={onBack}>
            Browse equipment
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Report</th>
                <th className="text-left px-4 py-3 font-medium">Equipment</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Rig / SN</th>
                <th className="text-left px-4 py-3 font-medium">Inspector</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((ins) => {
                const eq = EQUIPMENT[ins.equipmentType];
                const freq = eq?.frequencies.find(
                  (f) => f.id === ins.frequency,
                );
                const stats = calcStats(ins);
                return (
                  <tr key={ins.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {ins.header.reportNo || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ins.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {eq?.name || ins.equipmentType}
                    </td>
                    <td className="px-4 py-3">
                      {freq && (
                        <Badge className={`${catColor[freq.cat]} text-[10px]`}>
                          CAT {freq.cat}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {freq?.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ins.header.rig || "—"}
                      <div className="text-xs text-muted-foreground">
                        SN {ins.header.serialNo || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ins.header.inspectorName || "—"}
                    </td>
                    <td className="px-4 py-3">{ins.header.date || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          ins.status === "complete" ? "default" : "outline"
                        }
                      >
                        {ins.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {stats.pct}% · {stats.def} defects
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpen(ins.id)}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ins.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// SHARED COMPONENTS
// ────────────────────────────────────────────
function Breadcrumbs({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.onClick ? (
            <button
              className="text-[#2B5597] hover:underline"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        className="mt-1"
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="text-center p-3 border rounded-md">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-2xl font-medium mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function SignatureField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const hasDataRef = useRef(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#143269";
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        hasDataRef.current = true;
      };
      img.src = value;
    }
  }, [value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = getPos(e);
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.moveTo(lastRef.current!.x, lastRef.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
    lastRef.current = p;
    hasDataRef.current = true;
  };
  const end = () => {
    drawingRef.current = false;
    if (hasDataRef.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDataRef.current = false;
    onChange("");
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <canvas
        ref={canvasRef}
        className="w-full h-24 border rounded-sm bg-white cursor-crosshair touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">{name || "—"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={clear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function PhotoPicker({ onPhoto }: { onPhoto: (data: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let w = img.width,
          h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h >= w && h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        onPhoto(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        className="h-16 w-16 border-2 border-dashed rounded-sm flex items-center justify-center text-muted-foreground hover:border-[#2B5597] hover:text-[#2B5597] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Plus className="h-5 w-5" />
      </button>
    </>
  );
}
