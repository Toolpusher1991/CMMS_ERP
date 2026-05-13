import type { MudPump } from "@/types/drillsense";
import { statusColor, suctionColor, wearColor } from "@/types/drillsense";

interface Props { pump: MudPump }

export function PumpSVG({ pump }: Props) {
  const wt = pump.wasserteile;
  const wear = pump.wear;
  const sp = pump.suction_bar.value;
  const blocked = pump.suction_blocked;

  // Sensor-Dot-Farben
  const evColor  = statusColor(wt.valve_seat_in.value  / wt.valve_seat_in.threshold);
  const avColor  = statusColor(wt.valve_seat_out.value / wt.valve_seat_out.threshold);
  const prColor  = statusColor(wt.piston_rod.value     / wt.piston_rod.threshold);
  const suctCol  = suctionColor(sp);
  const disCol   = statusColor(pump.discharge_bar.value / pump.discharge_bar.threshold);
  const oilCol   = statusColor(pump.gear_oil_temp.value / pump.gear_oil_temp.threshold);
  const itCol    = statusColor(pump.inlet_temp.value    / pump.inlet_temp.threshold);

  // Animationsgeschwindigkeit Saugseite (stoppt wenn blockiert)
  const suctAnim = blocked ? "none" : "1.5s";
  const suctLineColor = blocked ? "#5C6BC0" : "#8B6B45";
  const discAnim = "1s";

  // Zylinderreihen
  const rows = [
    { y: 65,  ev: "EV1", av: "AV1", wear: wear.valve_seat_in },
    { y: 90,  ev: "EV2", av: "AV2", wear: wear.valve_seat_out },
    { y: 115, ev: "EV3", av: "AV3", wear: wear.piston },
  ];

  return (
    <svg viewBox="0 0 280 250" className="w-full h-auto" style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}>
      {/* Grid Background */}
      <defs>
        <pattern id={`grid-${pump.pump_id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#D0D4DE" strokeWidth="0.3" />
        </pattern>
        <pattern id={`dash-${pump.pump_id}`} x="0" y="0" width="18" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6"/>
        </pattern>
      </defs>
      <rect width="280" height="250" fill={`url(#grid-${pump.pump_id})`} />

      {/* ── SAUGSEITE (links, x:5-63) ───────────────────── */}
      <rect x="5" y="55" width="58" height="80" rx="0" fill="#E4E7F0" stroke="#2B5597" strokeWidth="0.75" opacity="0.6"/>
      <text x="34" y="50" textAnchor="middle" fontSize="8" fill="#64646E" fontWeight="500">SAUGSEITE</text>

      {/* Saugleitung animiert */}
      <line x1="5" y1="95" x2="65" y2="95" stroke={suctLineColor} strokeWidth="4"
            strokeDasharray="8 4" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="-18" to="0"
                 dur={suctAnim} repeatCount="indefinite"/>
      </line>

      {/* Saugdruck Badge */}
      <rect x="6" y="138" width="56" height="14" rx="2" fill={suctCol} opacity="0.85"/>
      <text x="34" y="148" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace" fontWeight="500">
        {sp.toFixed(2)} bar
      </text>

      {/* Inlet-Temp Badge */}
      <rect x="6" y="156" width="56" height="14" rx="2" fill={itCol} opacity="0.85"/>
      <text x="34" y="166" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace">
        {pump.inlet_temp.value.toFixed(1)} °C
      </text>

      {/* ── FLUID END (mitte, x:65-215) ──────────────────── */}
      <rect x="65" y="48" width="150" height="90" rx="0" fill="#E4E7F0" stroke="#2B5597" strokeWidth="1.2"/>
      <text x="140" y="44" textAnchor="middle" fontSize="8" fill="#2B5597" fontWeight="500" letterSpacing="1">FLUID END</text>

      {/* Drei Zylinderreihen */}
      {rows.map(({ y, ev, av, wear: wr }, idx) => {
        const wc = wearColor(wr);
        return (
          <g key={idx}>
            {/* EV — Einlassventil */}
            <rect x="67" y={y} width="20" height="16" fill="#D8DCE8" stroke={evColor} strokeWidth="1.5" rx="0"/>
            <text x="77" y={y+11} textAnchor="middle" fontSize="6.5" fill="#143269" fontWeight="500">{ev}</text>
            {/* Sensor-Dot Einlassventil */}
            <circle cx="93" cy={y+8} r="3.5" fill={evColor}/>

            {/* Zylinder mit Verschleiß-Füllung */}
            <rect x="97" y={y} width="50" height="16" fill="#D8DCE8" stroke="#2B5597" strokeWidth="0.75"/>
            <rect x="97" y={y} width={50 * (wr/100)} height="16" fill={wc} opacity="0.35"/>
            <text x="122" y={y+11} textAnchor="middle" fontSize="6" fill="#143269">{wr}%</text>

            {/* Sensor-Dot Kolbenstange */}
            <circle cx="152" cy={y+8} r="3.5" fill={prColor}/>

            {/* AV — Auslassventil */}
            <rect x="156" y={y} width="20" height="16" fill="#D8DCE8" stroke={avColor} strokeWidth="1.5" rx="0"/>
            <text x="166" y={y+11} textAnchor="middle" fontSize="6.5" fill="#143269" fontWeight="500">{av}</text>

            {/* Sensor-Dot Auslassventil */}
            <circle cx="181" cy={y+8} r="3.5" fill={avColor}/>
          </g>
        );
      })}

      {/* Suction-Blockiert Overlay */}
      {blocked && (
        <g>
          <rect x="65" y="48" width="150" height="90" fill="#5C6BC0" opacity="0.25" rx="0"/>
          <rect x="70" y="70" width="140" height="20" rx="2" fill="#5C6BC0"/>
          <text x="140" y="83" textAnchor="middle" fontSize="8" fill="white" fontWeight="500">
            ⚠ KLOPFEN — Saugseite prüfen!
          </text>
        </g>
      )}

      {/* ── DRUCKSEITE (rechts, x:215-275) ───────────────── */}
      <rect x="215" y="55" width="58" height="80" rx="0" fill="#E4E7F0" stroke="#2B5597" strokeWidth="0.75" opacity="0.6"/>
      <text x="244" y="50" textAnchor="middle" fontSize="8" fill="#64646E" fontWeight="500">DRUCK</text>

      {/* Druckleitung animiert */}
      <line x1="215" y1="95" x2="273" y2="95" stroke="#A0B0C8" strokeWidth="4"
            strokeDasharray="8 4" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-18"
                 dur={discAnim} repeatCount="indefinite"/>
      </line>

      {/* Discharge Badge */}
      <rect x="216" y="138" width="56" height="14" rx="2" fill={disCol} opacity="0.85"/>
      <text x="244" y="148" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace">
        {pump.discharge_bar.value.toFixed(0)} bar
      </text>

      {/* Standpipe Badge */}
      <rect x="216" y="156" width="56" height="14" rx="2" fill="#2B5597" opacity="0.85"/>
      <text x="244" y="166" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace">
        SP {pump.standpipe_bar.value.toFixed(0)} bar
      </text>

      {/* ── POWER END (unten, y:175-210) ─────────────────── */}
      <rect x="65" y="175" width="150" height="40" rx="0" fill="#D0D4DE" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="140" y="170" textAnchor="middle" fontSize="8" fill="#2B5597" fontWeight="500" letterSpacing="1">POWER END</text>

      {/* Crankshaft Ellipse */}
      <ellipse cx="140" cy="195" rx="35" ry="12" fill="none" stroke="#B8BCC8" strokeWidth="1.5"/>
      <ellipse cx="140" cy="195" rx="12" ry="5" fill="#B8BCC8" stroke="#2B5597" strokeWidth="0.75"/>

      {/* SPM Badge */}
      <rect x="70" y="182" width="38" height="13" rx="2" fill="#143269" opacity="0.9"/>
      <text x="89" y="192" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace">
        {pump.spm} SPM
      </text>

      {/* Getriebeöl Badge */}
      <rect x="172" y="182" width="38" height="13" rx="2" fill={oilCol} opacity="0.85"/>
      <text x="191" y="192" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="'IBM Plex Mono', monospace">
        {pump.gear_oil_temp.value.toFixed(0)}°C Öl
      </text>
    </svg>
  );
}
