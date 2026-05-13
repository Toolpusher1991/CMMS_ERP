// ──────────────────────────────────────────────────────
//  H&P DrillSense — TypeScript Datenmodell (snake_case,
//  entspricht Python-API-Output direkt)
// ──────────────────────────────────────────────────────

export type SensorStatus = 'ok' | 'warning' | 'critical' | 'suction';

export interface SensorReading {
  value: number;
  threshold: number;
  unit: string;
  timestamp?: string;
}

// WICHTIG: standpipe_bar ist EINER für alle 3 Pumpen (Manifold)
export interface MudPump {
  pump_id: number;
  name: string;
  status: SensorStatus;
  suction_blocked: boolean;

  inlet_temp: SensorReading;       // °C, thresh: 65
  gear_oil_temp: SensorReading;    // °C, thresh: 95
  suction_bar: SensorReading;      // bar, normal 1.5-2.5, krit <0.3
  discharge_bar: SensorReading;    // bar, vor Manifold
  standpipe_bar: SensorReading;    // bar, GEMEINSAM für alle Pumpen!
  spm: number;

  wasserteile: {
    valve_seat_in: SensorReading;  // mm/s, thresh 6.0 — Einlassventil
    valve_seat_out: SensorReading; // mm/s, thresh 6.0 — Auslassventil
    piston_rod: SensorReading;     // mm/s, thresh 7.0 — Kolbenstange
  };

  wear: {
    valve_seat_in: number;  // 0-100 %
    valve_seat_out: number;
    piston: number;
    liner: number;
  };
}

export interface Drawworks {
  status: SensorStatus;
  brake1_temp: SensorReading;      // °C, thresh 350
  brake2_temp: SensorReading;
  brake_wear_percent: number;
  gear_oil_temp: SensorReading;    // °C, thresh 95
  motor1_temp: SensorReading;      // °C, thresh 130
  motor2_temp: SensorReading;
  motor1_power: SensorReading;     // kW, max 1150
  motor2_power: SensorReading;
  hook_load: SensorReading;        // t, max 500
  drum_rpm: SensorReading;         // RPM, max 120
  vibration: SensorReading;        // mm/s, thresh 6.0
  drilling_line_wear: number;      // %
}

export interface DrillSenseAlert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'suction';
  equipment: 'mudpump' | 'drawworks';
  equipment_id?: number;
  message: string;
  ai_confidence: number;
  timestamp: string;
  acknowledged: boolean;
}

// ── Differentialdiagnose-Ergebnis ─────────────────────
export type DiagnosisType =
  | 'suction_blocked'
  | 'discharge_wear'
  | 'gearbox_fault'
  | 'none';

export interface DiagnosisResult {
  type: DiagnosisType;
  pump_id: number;
  confidence: number;
  message: string;
  action: string;
}

// ── Status-Farb-Helfer ────────────────────────────────

/** Schwellenwert-basiert (höher = schlechter) */
export function statusColor(ratio: number): string {
  if (ratio > 0.9) return '#E53935';
  if (ratio > 0.7) return '#FF9800';
  return '#24C26B';
}

/** Saugdruck INVERTIERT (niedriger = schlechter) */
export function suctionColor(bar: number): string {
  if (bar < 0.3) return '#5C6BC0';
  if (bar < 0.8) return '#FF9800';
  return '#24C26B';
}

/** Verschleiß-Farbe */
export function wearColor(pct: number): string {
  if (pct > 85) return '#E53935';
  if (pct > 60) return '#FF9800';
  return '#24C26B';
}

export function pumpStatusColor(status: SensorStatus): string {
  switch (status) {
    case 'critical': return '#E53935';
    case 'warning':  return '#FF9800';
    case 'suction':  return '#5C6BC0';
    default:         return '#24C26B';
  }
}
