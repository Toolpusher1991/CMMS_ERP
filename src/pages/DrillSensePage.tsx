import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MudPumpStation } from "@/components/drillsense/MudPumpStation";
import { DrawworksView } from "@/components/drillsense/DrawworksView";
import { DsAlertPanel } from "@/components/drillsense/DsAlertPanel";
import { DsThresholdPanel } from "@/components/drillsense/DsThresholdPanel";
import { Activity, WifiOff } from "lucide-react";
import { DRILLSENSE_ENABLED } from "@/services/drillsense-api";

// Separate QueryClient for DrillSense — short polling intervals
const dsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 2000,
      staleTime: 1000,
      retry: 1,
    },
  },
});

type Tab = "pumps" | "drawworks";

const TABS: { id: Tab; label: string }[] = [
  { id: "pumps", label: "Mud Pumps" },
  { id: "drawworks", label: "Drawworks" },
];

export default function DrillSensePage() {
  const [activeTab, setActiveTab] = useState<Tab>("pumps");

  return (
    <QueryClientProvider client={dsQueryClient}>
      {/* Page header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-[#2B5597]" />
          <h1 className="text-xl font-medium text-[#143269]">
            DrillSense — Predictive Maintenance
          </h1>
        </div>
        <p className="text-sm text-[#64646E]">
          Echtzeit-Überwachung · 3× Mud Pumps · Drawworks · ESP32
          Vibrationssensoren · KI-Verschleißprognose
        </p>
        {/* Gradient accent line */}
        <div className="h-[0.75px] w-full bg-gradient-to-r from-[#2B5597] to-[#24C26B] mt-3" />
      </div>

      {/* Offline banner — shown in production when VITE_DRILLSENSE_API_URL is not set */}
      {!DRILLSENSE_ENABLED && (
        <div className="flex items-start gap-3 bg-[#F0F0FA] border border-[#e0e0ea] px-4 py-4 mb-4">
          <WifiOff className="h-4 w-4 text-[#E37222] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-[#143269] mb-1">
              DrillSense backend nicht erreichbar
            </p>
            <p className="text-[#64646E] text-xs leading-relaxed">
              Das DrillSense-Backend läuft lokal auf dem Raspberry Pi /
              Rig-Netzwerk und ist in dieser Umgebung nicht verfügbar. Setze{" "}
              <code className="bg-white border border-[#e0e0ea] px-1 font-mono text-[10px]">
                VITE_DRILLSENSE_API_URL
              </code>{" "}
              in den Render-Umgebungsvariablen, um eine Verbindung herzustellen.
            </p>
          </div>
        </div>
      )}

      {/* Equipment tab navigation — only shown when backend is reachable */}
      {DRILLSENSE_ENABLED && (
        <>
          <div className="flex gap-0 mb-4 border-b border-[#e0e0ea]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-xs font-medium uppercase tracking-[1.4px] transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[#2B5597] text-[#2B5597]"
                    : "border-transparent text-[#64646E] hover:text-[#143269]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main layout: content + right sidebar */}
          <div className="flex gap-4 items-start">
            {/* Content area */}
            <div className="flex-1 min-w-0">
              {activeTab === "pumps" && <MudPumpStation />}
              {activeTab === "drawworks" && <DrawworksView />}
            </div>

            {/* Right sidebar: Alerts + Thresholds */}
            <div className="w-80 shrink-0 space-y-4">
              <DsAlertPanel />
              <DsThresholdPanel />
            </div>
          </div>
        </>
      )}

      {/* Connection info banner — dev only */}
      {import.meta.env.DEV && (
        <div className="mt-6 bg-[#F0F0FA] border border-[#e0e0ea] px-4 py-3 text-xs text-[#64646E] flex items-start gap-2">
          <span className="text-[#00B2E3] font-mono text-[10px] shrink-0 mt-0.5">
            ℹ
          </span>
          <div>
            <span className="font-medium text-[#143269]">
              DrillSense Backend starten:
            </span>{" "}
            Wechsle in{" "}
            <code className="bg-white border border-[#e0e0ea] px-1 py-0.5 font-mono text-[10px]">
              04_DrillSense/backend/
            </code>
            {" und führe aus: "}
            <code className="bg-white border border-[#e0e0ea] px-1 py-0.5 font-mono text-[10px]">
              uvicorn main:app --reload --port 8001
            </code>
            {" · MQTT: "}
            <code className="bg-white border border-[#e0e0ea] px-1 py-0.5 font-mono text-[10px]">
              docker-compose up -d mqtt
            </code>
            {" (oder "}
            <code className="bg-white border border-[#e0e0ea] px-1 py-0.5 font-mono text-[10px]">
              python mqtt_broker.py
            </code>
            )
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}
