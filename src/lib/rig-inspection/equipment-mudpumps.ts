import type { EquipmentDef } from "./types";

// ============================================================
// MUD PUMPS — per K-CW-EM-GU-065
// Equipment Code HPMS-325, KCAD Class 5401, Criticality: Category B
// ============================================================
export const MUDPUMPS: EquipmentDef = {
  id: "mudpumps",
  name: "Mud Pumps",
  docRef: "K-CW-EM-GU-065",
  equipmentCode: "HPMS-325",
  kcadClass: "5401",
  criticality: "Category B",
  standards: ["API Spec 7K", "API RP 7L"],
  config: [
    { key: "manufacturer", label: "Manufacturer", options: ["Bomco", "Emsco", "Honghua", "Lanzhou", "National", "mhWirth", "Bentec", "Other"] },
    { key: "rigType", label: "Rig type", options: ["Land", "Offshore / MODU"] },
    { key: "drive", label: "Main drive type", options: ["AC Electric", "DC Electric", "Mechanical"] },
    { key: "lubeSystem", label: "Lubrication system", options: ["Splash-gravity flow", "Forced lubrication", "Combined"] },
    { key: "stationary", label: "Stationary setup (MODU / platform)", options: ["Yes", "No"] },
  ],
  frequencies: [
    { id: "mp_daily", label: "Daily", cat: "I", who: "Rig personnel", inherits: [], desc: "Visual check, oil level & pressure, abnormal noise / vibration, leakage check." },
    { id: "mp_weekly", label: "Weekly", cat: "I", who: "Rig maintenance personnel", inherits: [], desc: "Dampener pressure check, reset relief valve function test." },
    { id: "mp_3month", label: "3-monthly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "Close visual check of fluid end parts, valve seats, crosshead, drive chains." },
    { id: "mp_6month", label: "6-monthly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "Fluid end bolt torques, lube oil and auxiliary pumps check." },
    { id: "mp_yearly", label: "Yearly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "General assessment of condition incl. function test, oil change, CAT IV on reset relief valve." },
    { id: "mp_2yearly", label: "2-yearly", cat: "III", who: "OEM / 3rd party / authorized H&P personnel", inherits: [], desc: "Mud pump condition check — full in-field assessment of gear end, drives, and pump end. Land rigs only." },
    { id: "mp_5yearly", label: "5-yearly", cat: "IV", who: "OEM / qualified 3rd party on approved list", inherits: [], desc: "CAT IV visual inspection on pulsation dampener. NDT of critical areas per OEM." },
    { id: "mp_10yearly", label: "10-yearly", cat: "IV", who: "OEM / qualified 3rd party on approved list", inherits: [], desc: "Major inspection and recertification / overhaul of mud pump and pulsation dampener.", special: "cativ" },
  ],
  sections: {
    mp_daily: [
      { id: "mpd_main", name: "Daily — Mud pump visual check", items: [
        { id: "mpd1", description: "Visual check of discharge dampener for correct operation", methods: ["VT"] },
        { id: "mpd2", description: "Visual check of piston / liner spray system", methods: ["VT"], critical: true },
        { id: "mpd3", description: "Check settling chamber for sludge / water", methods: ["VT"] },
        { id: "mpd4", description: "Check oil pressure and oil level", methods: ["VT"], critical: true },
        { id: "mpd5", description: "Listen carefully for abnormal noise or vibration", methods: ["VT", "Vib"] },
        { id: "mpd6", description: "Check for leakages", methods: ["VT"] },
      ]},
    ],
    mp_weekly: [
      { id: "mpw_main", name: "Weekly — Dampeners & relief valve", items: [
        { id: "mpw1", description: "Check pulsation dampener pressure and adjust as necessary", methods: ["VT"], measurement: true, unit: "bar", critical: true },
        { id: "mpw2", description: "Check suction dampener pressure and adjust as necessary", methods: ["VT"], measurement: true, unit: "bar" },
        { id: "mpw3", description: "Perform function test on reset relief valve", methods: ["Func"], critical: true },
      ]},
    ],
    mp_3month: [
      { id: "mp3_main", name: "3-monthly — Fluid end & power end visual", items: [
        { id: "mp3m1", description: "Check valve seats and springs for wear / damage", methods: ["VT", "Dim"], critical: true },
        { id: "mp3m2", description: "Clean oil filters from drive chain and clean air breather as applicable", methods: ["Clean"] },
        { id: "mp3m3", description: "Check crosshead extension clamping area", methods: ["VT"], critical: true },
        { id: "mp3m4", description: "Visual inspect drive chains and sprockets / drive belts and pulleys", methods: ["VT", "Dim"] },
      ]},
      { id: "mp3_land", name: "3-monthly — Land rig additional", requires: { rigType: "Land" }, items: [
        { id: "mp3l1", description: "Check crosshead guide clearance", methods: ["Dim"], measurement: true, unit: "mm" },
      ]},
      { id: "mp3_offshore", name: "3-monthly — Offshore / MODU additional", requires: { stationary: "Yes" }, items: [
        { id: "mp3o1", description: "Perform oil sampling of gearbox oil (stationary mud pump setup at MODU / platform)", methods: ["Lab"] },
      ]},
    ],
    mp_6month: [
      { id: "mp6_main", name: "6-monthly — Fluid end & lube system", items: [
        { id: "mp6m1", description: "Check fluid end bolt torques", methods: ["Dim"], critical: true },
        { id: "mp6m2", description: "Check lube oil and auxiliary pumps", methods: ["VT", "Func"] },
      ]},
      { id: "mp6_offshore", name: "6-monthly — Offshore additional", requires: { rigType: "Offshore / MODU" }, items: [
        { id: "mp6o1", description: "Check crosshead guide clearance", methods: ["Dim"], measurement: true, unit: "mm" },
      ]},
    ],
    mp_yearly: [
      { id: "mpy_main", name: "Yearly — General assessment & oil change", items: [
        { id: "mpy1", description: "Carry out a general assessment of condition including a function test", methods: ["VT", "Func"], critical: true },
        { id: "mpy2", description: "Change transmission lube oil (or perform oil analysis and change per results)", methods: ["Lube", "Lab"] },
        { id: "mpy3", description: "Clean transmission oil filter and air breather", methods: ["Clean"] },
      ]},
      { id: "mpy_offshore", name: "Yearly — Offshore additional (Cat III scope)", requires: { rigType: "Offshore / MODU" }, items: [
        { id: "mpyo1", description: "Measure bearing wear on pinion and main bearings — compare against OEM guidance and previous recorded readings", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "mpyo2", description: "Inspect gear tooth for wear and pitting", methods: ["VT"], critical: true },
      ]},
      { id: "mpy_rrv", name: "Yearly — Reset relief valve (Cat IV scope)", items: [
        { id: "mpyr1", description: "Reset relief valve due for major inspection and recertification", methods: ["Doc"], critical: true },
        { id: "mpyr2", description: "Scope of work for recertification / exchange determined by condition and inspection results in consultation with Technical Authority", methods: ["Doc"], critical: true },
        { id: "mpyr3", description: "Recertification / overhaul performed per §9 (repair, remanufacture, exchange)", methods: ["Doc", "Func"] },
      ]},
    ],
    mp_2yearly: [
      { id: "mp2y_main", name: "2-yearly — Mud pump condition check", requires: { rigType: "Land" }, items: [
        { id: "mp2y1", description: "Perform thorough in-field condition check of entire pump — gear end, drives, and pump end", methods: ["VT", "Dim"], critical: true },
        { id: "mp2y2", description: "Based on condition check results, consult Technical Authority and E&M Manager for necessary repairs", methods: ["Doc"], critical: true },
        { id: "mp2y3", description: "Determine remaining pump lifetime prior to major overhaul or replacement", methods: ["Doc"] },
        { id: "mp2y4", description: "Condition check performed per §9 by appointed H&P personnel, OEM technicians, or equivalent following H&P and OEM requirements", methods: ["Doc"], critical: true },
        { id: "mp2y5", description: "Condition check report completed using referenced templates (K-LD-EM-FO-019/018/028 as applicable)", methods: ["Doc"] },
      ]},
    ],
    mp_5yearly: [
      { id: "mp5y_damp", name: "5-yearly — Pulsation dampener (Cat IV)", items: [
        { id: "mp5y1", description: "Pulsation dampener due for major inspection and recertification", methods: ["Doc"], critical: true },
        { id: "mp5y2", description: "Scope of work determined by condition and inspection results in consultation with Technical Authority", methods: ["Doc"], critical: true },
        { id: "mp5y3", description: "Remove top and bottom cover of pulsation dampener as well as all studs", methods: ["VT"] },
        { id: "mp5y4", description: "Check all bolts / studs and nuts for condition and damage — replace as required", methods: ["VT", "Dim"], critical: true },
        { id: "mp5y5", description: "Perform visual internal inspection on pulsation dampener", methods: ["VT"], critical: true },
        { id: "mp5y6", description: "Carry out NDT examination of critical areas as necessary per OEM recommendations", methods: ["NDT", "MPI", "UT"], ndt: true, critical: true },
      ]},
    ],
    mp_10yearly: [
      { id: "mp10_pump", name: "10-yearly — Mud pump major overhaul (Cat IV)", items: [
        { id: "mp10p1", description: "Mud pump due for major inspection and overhaul", methods: ["Doc"], critical: true },
        { id: "mp10p2", description: "Scope of work for overhaul / exchange determined by condition and in-field inspection results in consultation with Technical Authority", methods: ["Doc"], critical: true },
        { id: "mp10p3", description: "Overhaul performed per §9 — repair, remanufacture, exchange of components", methods: ["Doc", "VT"] },
      ]},
      { id: "mp10_damp", name: "10-yearly — Pulsation dampener overhaul (Cat IV)", items: [
        { id: "mp10d1", description: "Pulsation dampener due for major inspection and overhaul", methods: ["Doc"], critical: true },
        { id: "mp10d2", description: "Scope of work determined in consultation with Technical Authority", methods: ["Doc"], critical: true },
        { id: "mp10d3", description: "Perform visual internal inspection on pulsation dampener", methods: ["VT"], critical: true },
        { id: "mp10d4", description: "Remove top and bottom cover as well as all studs", methods: ["VT"] },
        { id: "mp10d5", description: "Check all bolts / studs and nuts for condition and damage — replace as required", methods: ["VT", "Dim"], critical: true },
        { id: "mp10d6", description: "Carry out NDT examination of critical areas as necessary per OEM recommendations", methods: ["NDT", "MPI", "UT"], ndt: true, critical: true },
        { id: "mp10d7", description: "Perform pressure test (with water) at 1.5x working pressure", methods: ["Hydro"], measurement: true, unit: "bar", critical: true },
      ]},
    ],
  },
};
