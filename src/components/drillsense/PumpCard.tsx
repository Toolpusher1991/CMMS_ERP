import type { MudPump } from "@/types/drillsense";
import { pumpStatusColor, wearColor } from "@/types/drillsense";
import { PumpSVG } from "./PumpSVG";

interface Props { pump: MudPump }

export function PumpCard({ pump }: Props) {
  const stColor = pumpStatusColor(pump.status);

  const kpi = (label: string, val: string, color = "#143269") => (
    <div key={label} className="flex flex-col">
      <span className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px]">{label}</span>
      <span className="text-sm font-medium" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</span>
    </div>
  );

  const wearBar = (label: string, pct: number) => (
    <div key={label}>
      <div className="flex justify-between mb-0.5">
        <span className="text-[10px] text-[#64646E] uppercase tracking-[1px]">{label}</span>
        <span className="text-[10px] font-medium" style={{ color: wearColor(pct), fontFamily: "'IBM Plex Mono', monospace" }}>{pct}%</span>
      </div>
      <div className="h-[3px] bg-[#F0F0FA] w-full">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: wearColor(pct) }}/>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-[#e0e0ea] overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(20,50,105,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#e0e0ea]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: stColor }}/>
          <span className="text-sm font-medium text-[#143269]">{pump.name}</span>
        </div>
        <span className="text-[10px] uppercase tracking-[1.4px] font-medium px-2 py-0.5"
              style={{ color: stColor, border: `1px solid ${stColor}` }}>
          {pump.status === "suction" ? "⚠ Saugseite" : pump.status}
        </span>
      </div>

      {/* SVG */}
      <div className="px-2 py-1">
        <PumpSVG pump={pump}/>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 px-4 py-2 border-t border-[#e0e0ea] bg-[#F0F0FA]">
        {kpi("Saugdruck", `${pump.suction_bar.value.toFixed(2)} bar`,
             pump.suction_bar.value < 0.8 ? "#5C6BC0" : "#24C26B")}
        {kpi("Discharge", `${pump.discharge_bar.value.toFixed(0)} bar`)}
        {kpi("Standpipe", `${pump.standpipe_bar.value.toFixed(0)} bar`)}
        {kpi("Inlet-Temp", `${pump.inlet_temp.value.toFixed(1)} °C`)}
        {kpi("Getriebeöl", `${pump.gear_oil_temp.value.toFixed(1)} °C`)}
        {kpi("SPM", String(pump.spm))}
      </div>

      {/* Vibrations-Werte */}
      <div className="grid grid-cols-3 gap-x-4 px-4 py-2 border-t border-[#e0e0ea]">
        {kpi("EV Vib.", `${pump.wasserteile.valve_seat_in.value.toFixed(2)} mm/s`)}
        {kpi("Kolbe Vib.", `${pump.wasserteile.piston_rod.value.toFixed(2)} mm/s`)}
        {kpi("AV Vib.", `${pump.wasserteile.valve_seat_out.value.toFixed(2)} mm/s`)}
      </div>

      {/* Verschleiß-Bars */}
      <div className="px-4 py-2 border-t border-[#e0e0ea] space-y-1.5">
        <p className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px] mb-1">Verschleiß</p>
        {wearBar("Einlassventil", pump.wear.valve_seat_in)}
        {wearBar("Auslassventil", pump.wear.valve_seat_out)}
        {wearBar("Kolben", pump.wear.piston)}
        {wearBar("Liner", pump.wear.liner)}
      </div>
    </div>
  );
}
