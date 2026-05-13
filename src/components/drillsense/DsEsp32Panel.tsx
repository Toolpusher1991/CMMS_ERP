/**
 * DsEsp32Panel — zeigt verbundene MPU-6050 / ESP32 Geräte live.
 * Nutzt /api/v1/esp32/ (alle 3s pollt).
 */
import { useQuery } from "@tanstack/react-query";
import { drillsenseApi } from "@/services/drillsense-api";
import type { Esp32Device } from "@/types/drillsense";

function RssiBar({ rssi }: { rssi: number | null }) {
  if (rssi === null) return <span style={{ color: "var(--ds-gray)" }}>—</span>;
  const q = rssi > -60 ? 3 : rssi > -75 ? 2 : 1;
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "flex-end" }}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          style={{
            display: "inline-block",
            width: 5,
            height: 4 + b * 4,
            background: b <= q ? "var(--ds-green)" : "#d0d0d8",
          }}
        />
      ))}
      <span style={{ fontSize: 11, marginLeft: 4, color: "var(--ds-gray)" }}>
        {rssi} dBm
      </span>
    </span>
  );
}

function DeviceRow({ dev }: { dev: Esp32Device }) {
  const rms = dev.vibration?.rms_mms ?? null;
  const hz = dev.vibration?.dominant_hz ?? null;
  const cf = dev.vibration?.crest_factor ?? null;

  const statusColor = dev.online ? "#24C26B" : "#C8102E";
  const statusLabel = dev.online ? "ONLINE" : "OFFLINE";

  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "0.75px solid #e0e0ea",
        display: "grid",
        gridTemplateColumns: "10px 1fr auto",
        gap: 12,
        alignItems: "start",
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: statusColor,
          marginTop: 5,
          flexShrink: 0,
        }}
      />

      {/* Info */}
      <div>
        <div style={{ fontWeight: 500, fontSize: 13, color: "#143269", marginBottom: 2 }}>
          {dev.device_id}
        </div>
        <div style={{ fontSize: 11, color: "#64646E", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 }}>
          → {dev.assigned_to || "—"}
          {dev.firmware ? ` · fw ${dev.firmware}` : ""}
          {dev.sample_rate ? ` · ${dev.sample_rate} Hz` : ""}
        </div>

        {/* Vibration metrics */}
        {dev.online && rms !== null && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <MetricChip label="RMS" value={rms} unit="mm/s" warn={4.0} crit={6.0} />
            {hz !== null && (
              <MetricChip label="Dom. Hz" value={hz} unit="Hz" />
            )}
            {cf !== null && (
              <MetricChip label="Crest" value={cf} unit="" />
            )}
            {dev.accel?.x_rms_g !== undefined && (
              <>
                <MetricChip label="X" value={dev.accel.x_rms_g * 1000} unit="mg" />
                <MetricChip label="Y" value={dev.accel.y_rms_g! * 1000} unit="mg" />
                <MetricChip label="Z" value={dev.accel.z_rms_g! * 1000} unit="mg" />
              </>
            )}
          </div>
        )}

        {!dev.online && dev.last_seen_s !== null && (
          <div style={{ fontSize: 11, color: "#C8102E" }}>
            Letztes Signal vor {Math.round(dev.last_seen_s)}s
          </div>
        )}
      </div>

      {/* RSSI + status badge */}
      <div style={{ textAlign: "right" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            letterSpacing: "1px",
            padding: "2px 7px",
            background: statusColor,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          {statusLabel}
        </span>
        <div>
          <RssiBar rssi={dev.wifi_rssi} />
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  unit,
  warn,
  crit,
}: {
  label: string;
  value: number;
  unit: string;
  warn?: number;
  crit?: number;
}) {
  const color =
    crit !== undefined && value >= crit
      ? "#C8102E"
      : warn !== undefined && value >= warn
      ? "#E37222"
      : "#143269";

  return (
    <div style={{ minWidth: 48 }}>
      <div style={{ fontSize: 9, letterSpacing: "1px", color: "#64646E", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color }}>
        {value.toFixed(unit === "Hz" ? 1 : unit === "mg" ? 0 : 2)}
        <span style={{ fontSize: 10, color: "#64646E", marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

export function DsEsp32Panel() {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["esp32-devices"],
    queryFn: drillsenseApi.getEsp32Devices,
    refetchInterval: 3000,
    retry: false,
  });

  const onlineCount = devices.filter((d) => d.online).length;

  return (
    <div
      style={{
        background: "#fff",
        border: "0.75px solid #d0d0d8",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          background: "#F0F0FA",
          borderBottom: "0.75px solid #d0d0d8",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "#64646E",
          }}
        >
          › Live Sensoren (MPU-6050)
        </span>
        {devices.length > 0 && (
          <span
            style={{
              fontSize: 10,
              letterSpacing: "1px",
              padding: "2px 8px",
              background: onlineCount > 0 ? "#24C26B" : "#64646E",
              color: "#fff",
            }}
          >
            {onlineCount}/{devices.length} ONLINE
          </span>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: 16, fontSize: 12, color: "#64646E" }}>
          Lade Gerätedaten…
        </div>
      )}

      {!isLoading && devices.length === 0 && (
        <div style={{ padding: "16px", fontSize: 12, color: "#64646E" }}>
          Kein MPU-6050 verbunden.
          <br />
          <span style={{ fontSize: 11 }}>
            Starte <code>mpu6050_bridge.py</code> auf dem Pi.
          </span>
        </div>
      )}

      {devices.map((dev) => (
        <DeviceRow key={dev.device_id} dev={dev} />
      ))}
    </div>
  );
}
