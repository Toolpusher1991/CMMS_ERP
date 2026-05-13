import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { drillsenseApi } from "@/services/drillsense-api";
import type { ESP32Device, AccelReading } from "@/types/drillsense";
import { AccelChart } from "./AccelChart";
import { FFTSpectrum } from "./FFTSpectrum";
import { CalibrationPanel } from "./CalibrationPanel";
import { DsKpiCard } from "./DsKpiCard";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export function Esp32Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const { data: devices = [], isLoading } = useQuery<ESP32Device[]>({
    queryKey: ["ds-esp32-devices"],
    queryFn: () => drillsenseApi.getEsp32Devices(),
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Prefer Pi device, then fall back to first available, then user selection
  const activeDevice =
    selectedDevice ??
    devices.find((d) => d.device_id.startsWith("pi-"))?.device_id ??
    devices[0]?.device_id ??
    null;

  const { data: readings = [] } = useQuery<AccelReading[]>({
    queryKey: ["ds-esp32-data", activeDevice],
    queryFn: () => drillsenseApi.getEsp32Data(activeDevice!, 60),
    enabled: !!activeDevice,
    refetchInterval: 1000,
    staleTime: 500,
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B5597]" />
      </div>
    );

  const latest = readings[readings.length - 1];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#e0e0ea] overflow-hidden">
        <div className="bg-[#143269] px-5 py-3 flex items-center justify-between">
          <span className="text-white font-medium text-base">
            📡 Vibration Sensors — Pi MPU-6050 / ESP32
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[1px] rounded ${
              devices.length > 0
                ? "bg-[#24C26B]/20 text-[#24C26B] border border-[#24C26B]/30"
                : "bg-white/10 text-white/60"
            }`}
          >
            {devices.length > 0 ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {devices.length} device(s) connected
          </span>
        </div>

        {/* Device list */}
        {devices.map((d) => {
          const isPi =
            d.device_id.startsWith("pi-") ||
            d.firmware_version.startsWith("pi-");
          const isActive = d.device_id === activeDevice;
          return (
            <div
              key={d.device_id}
              className={`px-5 py-3 border-b border-[#F0F0FA] flex items-center justify-between cursor-pointer transition-colors ${
                isActive
                  ? "bg-[#2B5597]/5 border-l-4 border-l-[#2B5597]"
                  : "hover:bg-[#F0F0FA]"
              }`}
              onClick={() => setSelectedDevice(d.device_id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-[#143269]">
                    {d.device_id}
                  </p>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.8px] rounded ${
                      isPi
                        ? "bg-[#2B5597]/15 text-[#2B5597]"
                        : "bg-[#64646E]/10 text-[#64646E]"
                    }`}
                  >
                    {isPi ? "Raspberry Pi" : "ESP32"}
                  </span>
                </div>
                <p className="text-xs text-[#64646E]">
                  Assigned: {d.assigned_to}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#64646E]">
                <span>FW {d.firmware_version}</span>
                <span>RSSI: {d.wifi_rssi} dBm</span>
                <span>{d.sample_rate} Hz</span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                    d.is_connected
                      ? "bg-[#24C26B]/15 text-[#24C26B]"
                      : "bg-[#C8102E]/15 text-[#C8102E]"
                  }`}
                >
                  {d.is_connected ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI cards for latest reading */}
      {latest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <DsKpiCard
              label="RMS Velocity"
              value={latest.rms_mms.toFixed(2)}
              unit="mm/s"
              status={
                latest.rms_mms > 6.3
                  ? "critical"
                  : latest.rms_mms > 4.9
                    ? "warning"
                    : "ok"
              }
            />
            <DsKpiCard
              label="Peak"
              value={latest.peak_mms.toFixed(2)}
              unit="mm/s"
            />
            <DsKpiCard
              label="Crest Factor"
              value={latest.crest_factor.toFixed(2)}
              unit=""
            />
            <DsKpiCard
              label="Dominant Freq"
              value={latest.dominant_freq_hz.toFixed(1)}
              unit="Hz"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e0e0ea] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0F0FA]">
                <span className="text-sm font-medium text-[#143269]">
                  Acceleration XYZ (g)
                </span>
              </div>
              <div className="p-4">
                <AccelChart readings={readings.slice(-60)} />
              </div>
            </div>

            <div className="bg-white border border-[#e0e0ea] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0F0FA]">
                <span className="text-sm font-medium text-[#143269]">
                  Velocity RMS Trend (mm/s)
                </span>
              </div>
              <div className="p-4">
                <FFTSpectrum readings={readings.slice(-60)} />
              </div>
            </div>
          </div>
        </>
      )}

      {!latest && !isLoading && (
        <div className="bg-[#00B2E3]/10 border border-[#00B2E3]/30 text-[#143269] px-4 py-3 text-sm">
          Warte auf Sensordaten… Stelle sicher, dass der Pi läuft und{" "}
          <code className="bg-[#F0F0FA] px-1 rounded">mpu6050_bridge.py</code>{" "}
          aktiv ist. Falls kein MPU-6050 angeschlossen ist, setze{" "}
          <code className="bg-[#F0F0FA] px-1 rounded">MOCK_SENSOR=true</code> in
          der Pi-Bridge <code className="bg-[#F0F0FA] px-1 rounded">.env</code>.
        </div>
      )}

      {/* Calibration panel for first device */}
      {devices.length > 0 && (
        <CalibrationPanel deviceId={devices[0].device_id} />
      )}
    </div>
  );
}
