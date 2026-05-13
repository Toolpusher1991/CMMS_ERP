import { useQuery } from "@tanstack/react-query";
import { drillsenseApi } from "@/services/drillsense-api";
import type { Drawworks } from "@/types/drillsense";
import { statusColor } from "@/types/drillsense";
import { DrawworksSVG } from "./DrawworksSVG";
import { Loader2, WifiOff } from "lucide-react";

export function DrawworksView() {
  const { data: dw, isLoading, error } = useQuery<Drawworks>({
    queryKey: ["ds-drawworks"],
    queryFn: () => drillsenseApi.getDrawworks(),
    refetchInterval: 3000,
    staleTime: 1500,
  });

  const kpi = (label: string, val: string, color = "#143269") => (
    <div key={label}>
      <p className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px]">{label}</p>
      <p className="text-sm font-medium" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</p>
    </div>
  );

  return (
    <div>
      <div className="bg-white border border-[#e0e0ea] px-6 py-4 mb-3">
        <h2 className="text-base font-medium text-[#143269]">Drawworks — Motor, Bremse, Trommel, Getriebe</h2>
        <p className="text-xs text-[#64646E] mt-0.5">Hook Load · Drum RPM · Bremsentemperatur · Motorleistung · Getriebeöl · Vibration</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-[#64646E]">
          <Loader2 className="h-5 w-5 animate-spin"/>
          <span className="text-sm">Lade Drawworks-Daten...</span>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex items-center gap-3 bg-[#FFEBEE] border border-[#C8102E] px-4 py-3">
          <WifiOff className="h-4 w-4 text-[#C8102E]"/>
          <p className="text-sm text-[#C8102E]">Drawworks-Daten nicht verfügbar</p>
        </div>
      )}
      {dw && (
        <div className="bg-white border border-[#e0e0ea]">
          {/* SVG */}
          <div className="p-4 border-b border-[#f0f0f0]">
            <DrawworksSVG dw={dw}/>
          </div>
          {/* KPI-Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-3 px-6 py-4 bg-[#F0F0FA]">
            {kpi("Hook Load",  `${dw.hook_load.value.toFixed(1)} t`,   statusColor(dw.hook_load.value/dw.hook_load.threshold))}
            {kpi("Drum RPM",   `${dw.drum_rpm.value.toFixed(0)} RPM`)}
            {kpi("Brake 1",    `${dw.brake1_temp.value.toFixed(0)} °C`, statusColor(dw.brake1_temp.value/dw.brake1_temp.threshold))}
            {kpi("Brake 2",    `${dw.brake2_temp.value.toFixed(0)} °C`, statusColor(dw.brake2_temp.value/dw.brake2_temp.threshold))}
            {kpi("Getriebeöl", `${dw.gear_oil_temp.value.toFixed(0)} °C`, statusColor(dw.gear_oil_temp.value/dw.gear_oil_temp.threshold))}
            {kpi("Vibration",  `${dw.vibration.value.toFixed(2)} mm/s`, statusColor(dw.vibration.value/dw.vibration.threshold))}
            {kpi("Motor 1",    `${dw.motor1_temp.value.toFixed(0)}°C / ${dw.motor1_power.value.toFixed(0)} kW`)}
            {kpi("Motor 2",    `${dw.motor2_temp.value.toFixed(0)}°C / ${dw.motor2_power.value.toFixed(0)} kW`)}
            {kpi("Bremsverschleiß", `${dw.brake_wear_percent}%`, dw.brake_wear_percent > 70 ? "#E53935" : "#24C26B")}
            {kpi("Drilling Line", `${dw.drilling_line_wear}%`, dw.drilling_line_wear > 70 ? "#E53935" : "#24C26B")}
          </div>
        </div>
      )}
    </div>
  );
}
