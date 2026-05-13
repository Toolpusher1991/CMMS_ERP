const THRESHOLDS = [
  { equipment: "Mud Pump", sensor: "Inlet-Temperatur",    unit: "°C",    thresh: 65,  warn: 46,  crit: 59 },
  { equipment: "Mud Pump", sensor: "Getriebeöl-Temp.",   unit: "°C",    thresh: 95,  warn: 67,  crit: 86 },
  { equipment: "Mud Pump", sensor: "Standpipe (gemeinsam)", unit: "bar", thresh: 345, warn: 242, crit: 311 },
  { equipment: "Mud Pump", sensor: "Saugdruck (invertiert!)", unit: "bar", thresh: 3.0, warn: 0.8, crit: 0.3, inverted: true },
  { equipment: "Mud Pump", sensor: "Einlassventil Vib.", unit: "mm/s",  thresh: 6.0, warn: 4.2, crit: 5.4 },
  { equipment: "Mud Pump", sensor: "Auslassventil Vib.", unit: "mm/s",  thresh: 6.0, warn: 4.2, crit: 5.4 },
  { equipment: "Mud Pump", sensor: "Kolbenstange Vib.",  unit: "mm/s",  thresh: 7.0, warn: 4.9, crit: 6.3 },
  { equipment: "Drawworks", sensor: "Bremsen-Temp.",     unit: "°C",    thresh: 350, warn: 245, crit: 315 },
  { equipment: "Drawworks", sensor: "Getriebeöl-Temp.",  unit: "°C",    thresh: 95,  warn: 67,  crit: 86 },
  { equipment: "Drawworks", sensor: "Motor-Temp.",       unit: "°C",    thresh: 130, warn: 91,  crit: 117 },
  { equipment: "Drawworks", sensor: "Vibration",         unit: "mm/s",  thresh: 6.0, warn: 4.2, crit: 5.4 },
  { equipment: "Drawworks", sensor: "Hook Load",         unit: "t",     thresh: 500, warn: 350, crit: 450 },
] as const;

export function DsThresholdPanel() {
  return (
    <div className="bg-white border border-[#e0e0ea] overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#F0F0FA] border-b border-[#e0e0ea]">
            {["Equipment", "Sensor", "Einheit", "Schwelle", "Warnung", "Kritisch"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {THRESHOLDS.map((row, i) => (
            <tr key={i} className="hover:bg-[#FAFBFE]">
              <td className="px-3 py-1.5 text-[#143269] font-medium">{row.equipment}</td>
              <td className="px-3 py-1.5 text-[#000]">{row.sensor}</td>
              <td className="px-3 py-1.5 text-[#64646E]">{row.unit}</td>
              <td className="px-3 py-1.5 font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{row.thresh}</td>
              <td className="px-3 py-1.5" style={{ color: "#FF9800", fontFamily: "'IBM Plex Mono', monospace" }}>{row.warn}</td>
              <td className="px-3 py-1.5" style={{ color: "#E53935", fontFamily: "'IBM Plex Mono', monospace" }}>{row.crit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
