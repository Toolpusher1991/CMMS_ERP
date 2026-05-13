import type { MudPump, DiagnosisResult } from "@/types/drillsense";

/** Differentialdiagnose per Spec — Saugseite vs. Getriebeschaden */
export function diagnose(pump: MudPump): DiagnosisResult {
  const wt = pump.wasserteile;
  const avgVib = (wt.valve_seat_in.value + wt.valve_seat_out.value + wt.piston_rod.value) / 3;
  const suctionLow  = pump.suction_bar.value < 0.8;
  const vibHigh     = avgVib > 3.5;
  const oilNormal   = pump.gear_oil_temp.value < pump.gear_oil_temp.threshold * 0.75;
  const oilHigh     = pump.gear_oil_temp.value > pump.gear_oil_temp.threshold * 0.85;

  // SAUGSEITE VERSTOPFT: hohe Vib + niedriger Saugdruck + normales Öl
  if (suctionLow && vibHigh && oilNormal) {
    return {
      type: "suction_blocked",
      pump_id: pump.pump_id,
      confidence: 92,
      message: `${pump.name}: Saugseitige Verstopfung erkannt. Klopfgeräusche (Ø ${avgVib.toFixed(1)} mm/s) bei Saugdruck ${pump.suction_bar.value.toFixed(2)} bar.`,
      action: "Saugleitung, Saugsieb und Ventile prüfen — KEIN Getriebeschaden!",
    };
  }

  // ECHTER GETRIEBESCHADEN: hohe Vib + hohes Öl + normaler Saugdruck
  if (vibHigh && oilHigh && !suctionLow) {
    return {
      type: "gearbox_fault",
      pump_id: pump.pump_id,
      confidence: 85,
      message: `${pump.name}: Getriebe-Anomalie erkannt. Öl: ${pump.gear_oil_temp.value.toFixed(0)}°C, Vib: ${avgVib.toFixed(1)} mm/s.`,
      action: "Getriebe inspizieren, Ölanalyse durchführen.",
    };
  }

  // DRUCKSEITIGER VERSCHLEISS
  if (wt.valve_seat_out.value > wt.valve_seat_out.threshold * 0.85) {
    return {
      type: "discharge_wear",
      pump_id: pump.pump_id,
      confidence: 88,
      message: `${pump.name}: Auslassventil-Verschleiß kritisch (${wt.valve_seat_out.value.toFixed(2)} mm/s).`,
      action: "Wasserteile-Wechsel planen.",
    };
  }

  return { type: "none", pump_id: pump.pump_id, confidence: 0, message: "", action: "" };
}

export function diagnoseAll(pumps: MudPump[]): DiagnosisResult[] {
  return pumps.map(diagnose).filter((d) => d.type !== "none");
}
