import { useQuery } from "@tanstack/react-query";
import { drillsenseApi } from "@/services/drillsense-api";
import type { DrillSenseAlert } from "@/types/drillsense";

const LEVEL_STYLE: Record<string, { dot: string; bg: string }> = {
  critical: { dot: "#E53935", bg: "#FFF5F5" },
  warning:  { dot: "#FF9800", bg: "#FFF8F0" },
  suction:  { dot: "#5C6BC0", bg: "#F3F0FF" },
  info:     { dot: "#2B5597", bg: "#F0F4FF" },
};

export function DsAlertPanel() {
  const { data: alerts = [] } = useQuery<DrillSenseAlert[]>({
    queryKey: ["ds-alerts"],
    queryFn: () => drillsenseApi.getAlerts(),
    refetchInterval: 5000,
    staleTime: 2000,
  });

  return (
    <div className="bg-white border border-[#e0e0ea]">
      <div className="px-4 py-2 border-b border-[#e0e0ea] bg-[#F0F0FA]">
        <p className="text-[10px] font-medium text-[#64646E] uppercase tracking-[1.4px]">Aktive Alarme ({alerts.length})</p>
      </div>
      {alerts.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[#64646E]">Keine aktiven Alarme</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0f0f0] max-h-64 overflow-y-auto">
          {alerts.map((a) => {
            const s = LEVEL_STYLE[a.level] ?? LEVEL_STYLE.info;
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3" style={{ background: s.bg }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.dot }}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#000]">{a.message}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[10px] text-[#64646E] uppercase tracking-[1px]">
                      {a.equipment === "mudpump" ? `Pump #${a.equipment_id}` : "Drawworks"}
                    </span>
                    <span className="text-[10px] text-[#64646E]">KI {a.ai_confidence}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
