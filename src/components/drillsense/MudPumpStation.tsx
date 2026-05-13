import { useQuery } from "@tanstack/react-query";
import { drillsenseApi } from "@/services/drillsense-api";
import type { MudPump } from "@/types/drillsense";
import { PumpCard } from "./PumpCard";
import { DiagnosisBanner } from "./DiagnosisBanner";
import { diagnoseAll } from "@/hooks/useDiagnosis";
import { Loader2, WifiOff } from "lucide-react";

export function MudPumpStation() {
  const { data: pumps, isLoading, error } = useQuery<MudPump[]>({
    queryKey: ["ds-pumps"],
    queryFn: () => drillsenseApi.getPumps(),
    refetchInterval: 3000,
    staleTime: 1500,
  });

  const diagnoses = pumps ? diagnoseAll(pumps) : [];
  const standpipe = pumps?.[0]?.standpipe_bar;
  const avgSpm = pumps?.length ? Math.round(pumps.reduce((s, p) => s + p.spm, 0) / pumps.length) : 0;

  return (
    <div>
      {/* Station Header */}
      <div className="bg-white border border-[#e0e0ea] px-6 py-4 mb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-medium text-[#143269]">Mud pump station — 3-unit monitoring</h2>
            <p className="text-xs text-[#64646E] mt-0.5">Continental Emsco F-1600 Triplex · Wasserteile-Vibration · Saugdruck · KI-Verschleißprognose</p>
          </div>
          {standpipe && (
            <div className="text-right">
              <p className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px]">Standpipe-Druck (gemeinsam)</p>
              <p className="text-xl font-medium text-[#143269]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {standpipe.value.toFixed(1)} bar
              </p>
            </div>
          )}
        </div>
        {/* KPI-Leiste */}
        {pumps && (
          <div className="flex gap-8 mt-3 pt-3 border-t border-[#f0f0f0]">
            {[
              { k: "Avg. SPM", v: String(avgSpm) },
              { k: "Volumenstrom", v: `${Math.round(avgSpm * 7.65)} l/min` },
              { k: "KI-Modell", v: "LSTM v2.4" },
              { k: "Rig", v: "247" },
            ].map(({ k, v }) => (
              <div key={k}>
                <p className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1px]">{k}</p>
                <p className="text-xs text-[#2B5597] font-medium">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KI-Diagnose Banner */}
      <DiagnosisBanner diagnoses={diagnoses} />

      {/* Ladezustand */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-[#64646E]">
          <Loader2 className="h-5 w-5 animate-spin"/>
          <span className="text-sm">Verbinde mit DrillSense Backend...</span>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex items-center gap-3 bg-[#FFEBEE] border border-[#C8102E] px-4 py-3 mb-3">
          <WifiOff className="h-4 w-4 text-[#C8102E]"/>
          <div>
            <p className="text-sm font-medium text-[#C8102E]">DrillSense Backend nicht erreichbar</p>
            <p className="text-xs text-[#64646E]">VITE_DRILLSENSE_API_URL in Render prüfen · Relay online?</p>
          </div>
        </div>
      )}

      {/* Pump Cards */}
      {pumps && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {pumps.map((pump) => <PumpCard key={pump.pump_id} pump={pump}/>)}
        </div>
      )}
    </div>
  );
}
