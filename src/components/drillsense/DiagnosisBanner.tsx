import type { DiagnosisResult } from "@/types/drillsense";

interface Props { diagnoses: DiagnosisResult[] }

const TYPE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  suction_blocked: { bg: "#EDE7F6", border: "#5C6BC0", icon: "⚠" },
  gearbox_fault:   { bg: "#FFEBEE", border: "#E53935", icon: "🔧" },
  discharge_wear:  { bg: "#FFF3E0", border: "#FF9800", icon: "↑" },
};

export function DiagnosisBanner({ diagnoses }: Props) {
  if (diagnoses.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {diagnoses.map((d, i) => {
        const c = TYPE_COLORS[d.type] ?? { bg: "#F0F0FA", border: "#2B5597", icon: "ℹ" };
        return (
          <div key={i} className="border-l-4 px-4 py-3"
               style={{ background: c.bg, borderColor: c.border }}>
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[#143269]">{d.message}</p>
                  <span className="text-[10px] font-medium uppercase tracking-[1px] px-1.5 py-0.5 border"
                        style={{ color: c.border, borderColor: c.border }}>
                    KI {d.confidence}%
                  </span>
                </div>
                <p className="text-xs text-[#64646E] mt-0.5">→ {d.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
