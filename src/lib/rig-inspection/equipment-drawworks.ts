import type { EquipmentDef } from "./types";

// ============================================================
// DRAWWORKS — per K-CW-EM-GU-015 (Rev 13, 04/09/2023)
// Equipment Code HOIS-312, KCAD Class 5301, Criticality: Category A
// ============================================================
export const DRAWWORKS: EquipmentDef = {
  id: "drawworks",
  name: "Drawworks",
  docRef: "K-CW-EM-GU-015",
  equipmentCode: "HOIS-312",
  kcadClass: "5301",
  criticality: "Category A",
  standards: ["API Spec 7K", "API RP 7L", "API RP 54", "API RP 8B"],
  config: [
    { key: "manufacturer", label: "Manufacturer", options: ["Bentec", "Wirth", "NOV", "LeTourneau", "IDECO", "Other"] },
    { key: "drive", label: "Drive type", options: ["AC Electric", "DC Electric"] },
    { key: "brake", label: "Main brake", options: ["Band brake", "Disc brake"] },
    { key: "auxBrake", label: "Auxiliary brake", options: ["Eddy current / Elmagco", "Hydromatic", "AC motor (regenerative)", "None"] },
    { key: "transmission", label: "Transmission", options: ["Chain driven", "Gear driven"] },
    { key: "coolingUnit", label: "Cooling unit present", options: ["Yes", "No"] },
  ],
  frequencies: [
    { id: "daily", label: "Daily", cat: "I", who: "Rig personnel", inherits: [], desc: "Pre-tour function test, visual checks, greasing, anti-collision verification." },
    { id: "weekly", label: "Weekly", cat: "I", who: "Rig maintenance personnel", inherits: [], desc: "Drilling line, main brake mechanism and drum clamp checks." },
    { id: "monthly", label: "Monthly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "Close visual, brake rim thickness, clutch inspection, panel tests." },
    { id: "quarterly", label: "Quarterly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "Lebus grooving, clutch friction measurement, motor insulation resistance." },
    { id: "halfyear", label: "Half-yearly", cat: "II", who: "Maintenance supervisor", inherits: [], desc: "Oil change (chain drive), disc brake visual, Bentec/Wirth-specific items." },
    { id: "yearly", label: "Yearly", cat: "III", who: "OEM / 3rd party / authorized KCAD personnel", inherits: [], desc: "Full assessment of condition; dismantling, NDT on brake system, cooling water change." },
    { id: "cativ", label: "10-yearly", cat: "IV", who: "OEM / qualified 3rd party on GSM approved list", inherits: [], desc: "Major overhaul / re-manufacture. Scope determined by condition in consultation with Technical Authority.", special: "cativ" },
  ],
  sections: {
    daily: [
      { id: "d_main", name: "Daily — Drawworks", items: [
        { id: "d1", description: "Full function test at the drawworks brake system, incl. emergency brake", methods: ["Func"], critical: true },
        { id: "d2", description: "Visually check brake pads for correct installation and thickness and the equalizer for correct adjustment (clean if required)", methods: ["VT"], critical: true },
        { id: "d3", description: "Visually check the entire Drawworks unit for proper function, leakage, damage, abnormal noise or overheating", methods: ["VT"] },
        { id: "d4", description: "Visually check all protective covers and spaces between rotating parts", methods: ["VT"] },
        { id: "d5", description: "Visually check condition of the drilling line", methods: ["VT"], critical: true },
        { id: "d6", description: "Grease all lubrication fittings per manufacturer instructions (incl. cooling water rotor seals)", methods: ["Lube"] },
        { id: "d7", description: "Visually check all pressure indicators, flow meters etc. for correct readings", methods: ["VT"] },
        { id: "d8", description: "Visually check pneumatic / hydraulic systems as applicable for proper function", methods: ["VT"] },
        { id: "d9", description: "Visually check all hoses and lines for leakage", methods: ["VT"] },
        { id: "d10", description: "Check function of the anti-collision system / crown-o-matic", methods: ["Func"], critical: true },
        { id: "d11", description: "Drain condensate from air-vessel as applicable", methods: ["Func"] },
        { id: "d12", description: "Visually check the entire electrical installation of the Drawworks for proper function and installation, damage, abnormal noise, traces of overheating", methods: ["VT"] },
      ]},
      { id: "d_cool", name: "Daily — Cooling unit", requires: { coolingUnit: "Yes" }, items: [
        { id: "dc1", description: "Visually check cooling water flow rate (water temperature must not exceed 165F / 74C); brake discharge water unrestricted at all times", methods: ["VT"], measurement: true, unit: "°C", critical: true },
        { id: "dc2", description: "Visually check entire cooling unit for proper function, leakage, damage, abnormal noise or overheating", methods: ["VT"] },
        { id: "dc3", description: "Check all water lines for leakage and damage", methods: ["VT"] },
        { id: "dc4", description: "Check cooling water level — adjust as necessary", methods: ["VT"] },
      ]},
    ],
    weekly: [
      { id: "w_main", name: "Weekly — Drilling line & main brake", items: [
        { id: "w1", description: "Visually check drilling line kickback support rollers for condition and correct adjustment", methods: ["VT"] },
        { id: "w2", description: "Check drilling line clamp at the Drawworks drum for correct installation and torque", methods: ["VT"], critical: true },
        { id: "w3", description: "Visual check of main brake and operating mechanism — proper adjustment and worn or damaged components", methods: ["VT"], critical: true },
        { id: "w4", description: "Visually check the drilling line for obvious signs of damage or lack of lubrication", methods: ["VT"], critical: true },
      ]},
      { id: "w_band", name: "Weekly — Band brake linkage", requires: { brake: "Band brake" }, items: [
        { id: "wb1", description: "Visually check all band brake linkage pins; ensure all snap rings and cotter pins are properly installed", methods: ["VT"], critical: true },
      ]},
      { id: "w_cool", name: "Weekly — Cooling unit", requires: { coolingUnit: "Yes" }, items: [
        { id: "wc1", description: "Visually check radiators for leakage and condition — adjust as necessary", methods: ["VT"] },
        { id: "wc2", description: "Clean all water filters", methods: ["Clean"] },
        { id: "wc3", description: "Grease all fittings as required", methods: ["Lube"] },
      ]},
    ],
    monthly: [
      { id: "m_main", name: "Monthly — Drawworks close-visual & brake", items: [
        { id: "m1", description: "Close visual check of entire Drawworks for proper function, leakage, damage, abnormal noise or overheating (clean if required)", methods: ["VT"] },
        { id: "m2", description: "Close visual check of brake pads for correct installation and thickness", methods: ["VT"], critical: true },
        { id: "m3", description: "Close visual check of brake equalizer system for correct adjustment, as applicable", methods: ["VT"], critical: true },
        { id: "m4", description: "Measure and record brake rim / disc thickness", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "m5", description: "Visual check of brake rim / disc condition and surface colour", methods: ["VT"], critical: true },
        { id: "m7", description: "Visual check Low- and High-clutch for wear and condition", methods: ["VT", "Dim"] },
        { id: "m8", description: "Clean oil pump suction strainer / filter as required", methods: ["Clean"] },
        { id: "m9", description: "Visually check the gear box for proper function", methods: ["VT", "Func"] },
        { id: "m10", description: "Visually check Drawworks for proper greasing and correct oil level — adjust as necessary", methods: ["VT", "Lube"] },
        { id: "m11", description: "Visually check pneumatic / hydraulic systems for proper function", methods: ["VT"] },
        { id: "m12", description: "Visually check all hoses and lines for leakage, damage or blockage", methods: ["VT"] },
        { id: "m13", description: "Visually check all pressure indicators, flow meters etc. for correct readings", methods: ["VT"] },
        { id: "m14", description: "Check holding down bolts of Drawworks for tightness", methods: ["Dim"], critical: true },
        { id: "m15", description: "Visually check Drawworks control unit, instrument panel & associated components for leakage, damage & corrosion", methods: ["VT"] },
        { id: "m16", description: "Carry out an emergency stop function test", methods: ["Func"], critical: true },
        { id: "m17", description: "Check pressure switch / sensors and cable for damage", methods: ["VT", "Elec"] },
        { id: "m18", description: "Check inside and outside of all cabinets for cleanliness", methods: ["VT", "Clean"] },
        { id: "m19", description: "Check function of gearbox oil heaters", methods: ["Func"] },
        { id: "m20", description: "Check function of drive motors heater and flap control", methods: ["Func"] },
        { id: "m21", description: "Check function of all cabinet heaters", methods: ["Func"] },
      ]},
      { id: "m_chain", name: "Monthly — Chain drive", requires: { transmission: "Chain driven" }, items: [
        { id: "m6", description: "Close visual check of chains, sprockets, bearings for signs of wear or damage, and correct chain tension", methods: ["VT", "Dim"], critical: true },
      ]},
      { id: "m_cool", name: "Monthly — Cooling unit", requires: { coolingUnit: "Yes" }, items: [
        { id: "mc1", description: "Inspect temperature regulator (thermostat) for correct function", methods: ["Func"] },
        { id: "mc2", description: "Check and record concentration of inhibitors / antifreeze and pH levels of cooling water; add corrosion inhibitor / antifreeze as required", methods: ["Lab"], measurement: true, unit: "pH" },
      ]},
    ],
    quarterly: [
      { id: "q_main", name: "Quarterly — Drum, clutches & motors", items: [
        { id: "q1", description: "Visually check wear of the Lebus grooving", methods: ["VT", "Dim"], critical: true },
        { id: "q2", description: "Visually check wear of kicker plates (correct if necessary)", methods: ["VT", "Dim"] },
        { id: "q3", description: "Check function of the overrunning clutch (if applicable)", methods: ["Func"] },
        { id: "q4", description: "Change or clean pressure oil filter of the lubrication system (if applicable)", methods: ["Clean"] },
        { id: "q5", description: "Clean breathers", methods: ["Clean"] },
        { id: "q6", description: "Close visual inspection of all Drawworks clutches for correct lubrication, signs of wear (backlash) or damage and correct function", methods: ["VT", "Func"], critical: true },
        { id: "q7", description: "Measure and record friction plate clearances / thickness as applicable", methods: ["Dim"], measurement: true, unit: "mm" },
        { id: "q8", description: "Carry out insulation resistance testing of motors", methods: ["Elec"], measurement: true, unit: "MΩ", critical: true },
      ]},
      { id: "q_bentec", name: "Quarterly — Bentec Wichita brake", requires: { manufacturer: "Bentec" }, items: [
        { id: "qb1", description: "Visual inspection of the brake springs for alignment and cracks", methods: ["VT"], critical: true },
      ]},
      { id: "q_cool", name: "Quarterly — Cooling unit", requires: { coolingUnit: "Yes" }, items: [
        { id: "qc1", description: "Clean all radiators", methods: ["Clean"] },
        { id: "qc2", description: "All valves in cooling system must be lubricated and free to move (returned to correct operating position)", methods: ["Lube", "Func"] },
      ]},
    ],
    halfyear: [
      { id: "h_chain", name: "Half-yearly — Chain driven drawworks", requires: { transmission: "Chain driven" }, items: [
        { id: "h1", description: "Change oil, clean oil sump and clean or replace oil filter", methods: ["Lube", "Clean"] },
        { id: "h2", description: "Check and clean spray nozzles and oil flow control valves", methods: ["VT", "Clean"] },
      ]},
      { id: "h_disc", name: "Half-yearly — Disc brake", requires: { brake: "Disc brake" }, items: [
        { id: "h3", description: "Close visual inspection of Drawworks brake disc for signs of wear (formation of marks or grooves) or any damage", methods: ["VT"], critical: true },
      ]},
      { id: "h_bentec", name: "Half-yearly — Bentec specific", requires: { manufacturer: "Bentec" }, items: [
        { id: "hb1", description: "Check all mounting screws for condition and tightness (see manufacturer manual for torque)", methods: ["Dim"], critical: true },
        { id: "hb2", description: "Change oil filter cartridges", methods: ["Lube"] },
      ]},
      { id: "h_wirth", name: "Half-yearly — Wirth disc brake HPU", requires: { manufacturer: "Wirth", brake: "Disc brake" }, items: [
        { id: "hw1", description: "Change filters on disc brake HPU", methods: ["Lube"] },
      ]},
    ],
    yearly: [
      { id: "y_gear", name: "Yearly — Gear driven drawworks", requires: { transmission: "Gear driven" }, items: [
        { id: "yg1", description: "Change oil, clean oil sump and clean or replace oil filter", methods: ["Lube", "Clean"] },
      ]},
      { id: "y_main", name: "Yearly — General assessment of condition", items: [
        { id: "y2", description: "Inspect all main bearings and retainers for wear or overheating", methods: ["VT"], critical: true },
        { id: "y3", description: "Check and record bearing clearances", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "y4", description: "Check all fasteners for tightness", methods: ["Dim"], critical: true },
        { id: "y5", description: "Inspect all sprocket teeth and chains for wear and missing parts; renew as necessary", methods: ["VT", "Dim"] },
        { id: "y6", description: "Check all internal and external bolts for tightness and missing or broken safety wires (manufacturer torque spec)", methods: ["Dim"], critical: true },
        { id: "y7", description: "Disassemble auxiliary drive spline clutch shifter mechanism; remove old grease, clean splines and re-lubricate; check shifting mechanism for worn parts", methods: ["VT", "Lube"] },
        { id: "y8", description: "Disassemble main drive couplings as necessary; clean out old grease, inspect and reassemble with correct quantity of grease", methods: ["VT", "Lube"] },
        { id: "y9", description: "Close visual inspection of the air-water-spear as applicable", methods: ["VT"] },
      ]},
      { id: "y_band", name: "Yearly — Band brake system", requires: { brake: "Band brake" }, items: [
        { id: "yb1", description: "Clean brake system", methods: ["Clean"] },
        { id: "yb2", description: "Dismantle brake system as required", methods: ["VT"] },
        { id: "yb3", description: "Visually check brake system for damage, wear, corrosion, loose or missing parts", methods: ["VT"], critical: true },
        { id: "yb4", description: "Measure and record clearances for brake system as well as for brake rims and brake disk", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "yb5", description: "Perform NDT on brake system (bolts of brake- and equalizer linkage, eye bolts, turn buckles) as necessary", methods: ["NDT", "MPI", "PT"], critical: true, ndt: true },
        { id: "yb6", description: "Change worn parts, reassemble and adjust brake system per OEM instructions", methods: ["VT"] },
        { id: "yb7", description: "Function test", methods: ["Func"], critical: true },
        { id: "yb8", description: "Inspection certificate issued", methods: ["Doc"] },
        { id: "yb9", description: "Repair report issued", methods: ["Doc"] },
      ]},
      { id: "y_disc", name: "Yearly — Disc brake system", requires: { brake: "Disc brake" }, items: [
        { id: "yd1", description: "Clean disc brake and HPU", methods: ["Clean"] },
        { id: "yd2", description: "Dismantle and clean caliper assembly levers and pins as required", methods: ["VT", "Clean"] },
        { id: "yd3", description: "Change oil and filters of HPU; clean and flush the hydraulic system", methods: ["Lube", "Clean"] },
        { id: "yd4", description: "Check relief valve and compensators for integrity and correct settings", methods: ["Func"] },
        { id: "yd5", description: "Visually check for damage, wear, cracks, loose parts and corrosion of the brake system", methods: ["VT"], critical: true },
        { id: "yd6", description: "Check or replace emergency brake springs per OEM manual", methods: ["VT"] },
      ]},
      { id: "y_cool", name: "Yearly — Cooling unit", requires: { coolingUnit: "Yes" }, items: [
        { id: "yc1", description: "Check all mounting bolts for tightness", methods: ["Dim"] },
        { id: "yc2", description: "Service all cooling water pumps", methods: ["VT", "Lube"] },
        { id: "yc3", description: "Check the alignment of the centrifugal pump units", methods: ["Dim"] },
        { id: "yc4", description: "Clean the heat exchanger water tubes (internal)", methods: ["Clean"] },
        { id: "yc5", description: "Check the fan drive for proper function", methods: ["Func"] },
        { id: "yc6", description: "Change cooling water and refill with water / glycol mixture as applicable", methods: ["Lube"] },
      ]},
    ],
    cativ: [
      { id: "civ_pre", name: "Pre-overhaul handover", items: [
        { id: "civ1", description: "Trigger reason documented (age, condition, incident, suspected overload)", methods: ["Doc"], critical: true },
        { id: "civ2", description: "Technical Authority consulted (Land: Head of Asset Integrity; Offshore: E&M Manager Offshore)", methods: ["Doc"], critical: true },
        { id: "civ3", description: "Maintenance history and running hours / cycles compiled", methods: ["Doc"] },
        { id: "civ4", description: "Previous inspection reports attached (Cat I–III history)", methods: ["Doc"] },
        { id: "civ5", description: "Load-path walk-down completed (photos / findings)", methods: ["VT", "Doc"] },
        { id: "civ6", description: "OEM manuals and bulletins current on file", methods: ["Doc"] },
      ]},
      { id: "civ_vendor", name: "Vendor engagement", items: [
        { id: "civ10", description: "Vendor on GSM SAP-based approved supplier list (OEM / KCAD approved / qualified 3rd party)", methods: ["Doc"], critical: true },
        { id: "civ11", description: "Vendor API 8C / 7-1 / 7-2 licence verified", methods: ["Doc"], critical: true },
        { id: "civ12", description: "NDT personnel ASNT Level II (or equivalent) confirmed", methods: ["Doc"], critical: true },
        { id: "civ13", description: "Scope of work agreed & documented (inspection / repair / re-manufacture / modification)", methods: ["Doc"], critical: true },
      ]},
      { id: "civ_post", name: "Post-overhaul acceptance", items: [
        { id: "civ20", description: "Certificate of conformance received", methods: ["Doc"], critical: true },
        { id: "civ21", description: "Inspection / repair / re-manufacture reports received and filed (CMMS)", methods: ["Doc"], critical: true },
        { id: "civ22", description: "Load test report received (where applicable)", methods: ["Doc", "Func"], critical: true },
        { id: "civ23", description: "Re-installation and commissioning performed and documented", methods: ["Func"] },
        { id: "civ24", description: "Equipment Master Data updated in CMMS", methods: ["Doc"] },
      ]},
    ],
  },
};
