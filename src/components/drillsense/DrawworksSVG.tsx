import type { Drawworks } from "@/types/drillsense";
import { statusColor } from "@/types/drillsense";

interface Props { dw: Drawworks }

export function DrawworksSVG({ dw }: Props) {
  const b1c = statusColor(dw.brake1_temp.value / dw.brake1_temp.threshold);
  const b2c = statusColor(dw.brake2_temp.value / dw.brake2_temp.threshold);
  const oilc = statusColor(dw.gear_oil_temp.value / dw.gear_oil_temp.threshold);
  const m1tc = statusColor(dw.motor1_temp.value / dw.motor1_temp.threshold);
  const m2tc = statusColor(dw.motor2_temp.value / dw.motor2_temp.threshold);
  const vibc = statusColor(dw.vibration.value / dw.vibration.threshold);
  const hlc  = statusColor(dw.hook_load.value / dw.hook_load.threshold);

  const badge = (x: number, y: number, w: number, color: string, text: string) => (
    <g>
      <rect x={x} y={y} width={w} height={14} rx="2" fill={color} opacity="0.9"/>
      <text x={x + w/2} y={y + 10} textAnchor="middle" fontSize="7.5" fill="white"
            fontFamily="'IBM Plex Mono', monospace">{text}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 580 340" className="w-full h-auto" style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}>
      {/* Grid */}
      <defs>
        <pattern id="dw-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D0D4DE" strokeWidth="0.3"/>
        </pattern>
      </defs>
      <rect width="580" height="340" fill="url(#dw-grid)"/>

      {/* ── Crown Block (oben mitte) ─── */}
      <rect x="230" y="28" width="120" height="28" fill="#C8CCD8" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="290" y="45" textAnchor="middle" fontSize="9" fill="#143269" fontWeight="500">Crown Block</text>

      {/* Derrick Lines */}
      <line x1="290" y1="56" x2="290" y2="85" stroke="#64646E" strokeWidth="1.5" strokeDasharray="4 2"/>

      {/* ── Traveling Block ─── */}
      <rect x="255" y="85" width="70" height="22" fill="#D8DCE8" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="290" y="99" textAnchor="middle" fontSize="8.5" fill="#143269" fontWeight="500">Traveling Block</text>
      {/* Hook Load Badge */}
      {badge(332, 90, 62, hlc, `${dw.hook_load.value.toFixed(0)} t`)}

      {/* Hook line */}
      <line x1="290" y1="107" x2="290" y2="120" stroke="#64646E" strokeWidth="2"/>

      {/* ── Bremsscheibe links ─── */}
      <rect x="90" y="120" width="28" height="80" fill="#E0D0D0" stroke="#C8102E" strokeWidth="0.75"/>
      <rect x="90" y="120" width="28" height={80 * (dw.brake_wear_percent/100)} fill={b1c} opacity="0.5"/>
      {badge(78, 205, 52, b1c, `${dw.brake1_temp.value.toFixed(0)}°C`)}
      <text x="104" y="116" textAnchor="middle" fontSize="7" fill="#64646E">Brake #1</text>

      {/* ── Haupttrommel ─── */}
      <rect x="120" y="120" width="340" height="80" fill="#E4E7F0" stroke="#2B5597" strokeWidth="1"/>
      <ellipse cx="290" cy="160" rx="140" ry="35" fill="none" stroke="#B8BCC8" strokeWidth="1"/>
      <ellipse cx="290" cy="160" rx="55" ry="14" fill="#D0D4DE" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="290" y="155" textAnchor="middle" fontSize="9" fill="#143269" fontWeight="500">Haupttrommel</text>
      <text x="290" y="168" textAnchor="middle" fontSize="8" fill="#64646E" fontFamily="'IBM Plex Mono', monospace">
        {dw.drum_rpm.value.toFixed(0)} RPM
      </text>
      <text x="290" y="184" textAnchor="middle" fontSize="7" fill="#64646E">
        Drilling Line Wear: {dw.drilling_line_wear}%
      </text>

      {/* ── Bremsscheibe rechts ─── */}
      <rect x="462" y="120" width="28" height="80" fill="#E0D0D0" stroke="#C8102E" strokeWidth="0.75"/>
      <rect x="462" y="120" width="28" height={80 * (dw.brake_wear_percent/100)} fill={b2c} opacity="0.5"/>
      {badge(450, 205, 52, b2c, `${dw.brake2_temp.value.toFixed(0)}°C`)}
      <text x="476" y="116" textAnchor="middle" fontSize="7" fill="#64646E">Brake #2</text>

      {/* ── Getriebe (mitte-unten) ─── */}
      <rect x="190" y="215" width="200" height="50" fill="#D0D4DE" stroke="#2B5597" strokeWidth="0.75"/>
      <ellipse cx="290" cy="240" rx="45" ry="12" fill="none" stroke="#B8BCC8" strokeWidth="1.5"/>
      <ellipse cx="290" cy="240" rx="18" ry="6" fill="#B8BCC8" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="290" y="228" textAnchor="middle" fontSize="9" fill="#143269" fontWeight="500">Getriebe</text>

      {/* Getriebe Badges */}
      {badge(192, 220, 52, oilc, `${dw.gear_oil_temp.value.toFixed(0)}°C Öl`)}
      {/* Vibrations-Sensor Dot */}
      <circle cx="370" cy="240" r="7" fill={vibc} stroke="white" strokeWidth="1"/>
      <text x="370" y="244" textAnchor="middle" fontSize="6" fill="white" fontWeight="500">VIB</text>
      {badge(340, 225, 58, vibc, `${dw.vibration.value.toFixed(2)} mm/s`)}

      {/* ── Motor #1 (links-unten) ─── */}
      <rect x="60" y="275" width="110" height="40" fill="#D8DCE8" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="115" y="291" textAnchor="middle" fontSize="8.5" fill="#143269" fontWeight="500">Motor #1</text>
      {badge(63, 298, 52, m1tc, `${dw.motor1_temp.value.toFixed(0)}°C`)}
      {badge(118, 298, 48, statusColor(dw.motor1_power.value/dw.motor1_power.threshold), `${dw.motor1_power.value.toFixed(0)} kW`)}

      {/* ── Motor #2 (rechts-unten) ─── */}
      <rect x="410" y="275" width="110" height="40" fill="#D8DCE8" stroke="#2B5597" strokeWidth="0.75"/>
      <text x="465" y="291" textAnchor="middle" fontSize="8.5" fill="#143269" fontWeight="500">Motor #2</text>
      {badge(413, 298, 52, m2tc, `${dw.motor2_temp.value.toFixed(0)}°C`)}
      {badge(468, 298, 48, statusColor(dw.motor2_power.value/dw.motor2_power.threshold), `${dw.motor2_power.value.toFixed(0)} kW`)}

      {/* Labels */}
      <text x="10" y="340" fontSize="7" fill="#64646E" opacity="0.7">H&P DrillSense — Drawworks Monitor</text>
    </svg>
  );
}
