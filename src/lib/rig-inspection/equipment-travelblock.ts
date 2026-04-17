import type { EquipmentDef } from "./types";

// ============================================================
// TRAVELLING BLOCK / RAISING YOKE — per K-CW-EM-GU-025
// Equipment Code HOIS-303 / DSSE-489, KCAD Class 5302, Criticality: Category A
// ============================================================
export const TRAVELBLOCK: EquipmentDef = {
  id: "travelblock",
  name: "Travelling Block / Raising Yoke",
  docRef: "K-CW-EM-GU-025",
  equipmentCode: "HOIS-303 / DSSE-489",
  kcadClass: "5302",
  criticality: "Category A",
  standards: ["API RP 8B", "API Spec 8C", "API RP 9B"],
  config: [
    { key: "manufacturer", label: "Manufacturer", options: ["NOV", "Bentec", "Cameron", "Baylor", "Other"] },
    { key: "connectionType", label: "Connection type", options: ["Hook", "Top Drive", "Compensator"] },
    { key: "guideDolly", label: "Guide dolly fitted", options: ["Yes", "No"] },
    { key: "sheaveType", label: "Sheave construction", options: ["Welded", "Cast"] },
  ],
  frequencies: [
    { id: "tb_daily", label: "Daily", cat: "I", who: "Rig personnel", inherits: [], desc: "Grease all grease points, visual check for damage or wear." },
    { id: "tb_weekly", label: "Weekly", cat: "I", who: "Rig maintenance personnel", inherits: [], desc: "Clean mud/dirt, check sheave bearings, grease points, corrosion, clevis lubrication, guide dolly." },
    { id: "tb_monthly", label: "Monthly", cat: "II", who: "Senior maintenance / Toolpusher", inherits: [], desc: "Close visual inspection, sheave gauge check, wobble test on bearings, guide dolly rollers." },
    { id: "tb_yearly", label: "Yearly", cat: "III", who: "OEM / 3rd party / authorized KCAD personnel", inherits: [], desc: "General assessment of condition, sheave groove depth measurement per K-CW-EM-FO-035, NDT as required." },
    { id: "tb_5yearly", label: "5-yearly", cat: "IV", who: "OEM / qualified 3rd party on approved list", inherits: [], desc: "Major inspection and recertification / overhaul per API RP 8B. Full sheave and shaft measurement per K-CW-EM-FO-035/036.", special: "cativ" },
  ],
  sections: {
    tb_daily: [
      { id: "tbd_main", name: "Daily — Greasing & visual", items: [
        { id: "tbd1", description: "Grease all grease points — ensure that grease flows through each nipple", methods: ["Lube"], critical: true },
        { id: "tbd2", description: "Visual check the Travelling Block / Raising Yoke for signs of damage or wear", methods: ["VT"] },
      ]},
    ],
    tb_weekly: [
      { id: "tbw_main", name: "Weekly — Cleaning & visual", items: [
        { id: "tbw1", description: "Clean all mud and dirt from Travelling Block / Raising Yoke", methods: ["Clean"] },
        { id: "tbw2", description: "Remove any excessive buildup of grease / tar deposits, particularly in the rope grooves", methods: ["Clean"], critical: true },
        { id: "tbw3", description: "Visual check sheave bearings for proper greasing", methods: ["VT"] },
        { id: "tbw4", description: "Visual check all grease points for damage", methods: ["VT"] },
        { id: "tbw5", description: "Visual check for corrosion, damage, missing parts, cracks, signs of wear and general deterioration", methods: ["VT"], critical: true },
        { id: "tbw6", description: "Lubricate the clevis at the suspension contact point", methods: ["Lube"] },
      ]},
      { id: "tbw_dolly", name: "Weekly — Guide dolly", requires: { guideDolly: "Yes" }, items: [
        { id: "tbw7", description: "Visually check the Travelling Block guide dolly thoroughly for worn or damaged rollers, cracks, damages, loose bolts and fits", methods: ["VT"] },
      ]},
    ],
    tb_monthly: [
      { id: "tbm_main", name: "Monthly — Close visual & sheave check", items: [
        { id: "tbm1", description: "Visual inspect for corrosion, damage, loose bolts, missing parts, cracks, deformation, signs of wear and general deterioration", methods: ["VT"], critical: true },
        { id: "tbm2", description: "Remove any excessive buildup of grease / tar deposits, particularly in the rope grooves", methods: ["Clean"] },
        { id: "tbm3", description: "Visual inspect all grease points for damage — ensure grease is being pumped through all grease nipples", methods: ["VT"] },
        { id: "tbm4", description: "Visual check sheave bearings for proper greasing", methods: ["VT"] },
        { id: "tbm5", description: "Using a sheave gauge, inspect sheave grooves for wear and correct profile in several places — visually inspect surface for deformation, corrugations, scoring (wire line imprints) or damage", methods: ["VT", "Dim"], critical: true },
        { id: "tbm6", description: "Using a pry bar, carry out a wobble test on each sheave — also check the bearing grease seal / shield for displacement as indication of sheave lateral movement", methods: ["VT", "Dim"], measurement: true, unit: "mm", critical: true },
      ]},
      { id: "tbm_dolly", name: "Monthly — Guide dolly", requires: { guideDolly: "Yes" }, items: [
        { id: "tbm7", description: "Check rollers of guide dolly for wear, cracks, or excessive radial or axial play", methods: ["VT", "Dim"] },
      ]},
    ],
    tb_yearly: [
      { id: "tby_main", name: "Yearly — Assessment of condition", items: [
        { id: "tby1", description: "Carry out a general assessment of condition including a function test", methods: ["VT", "Func"], critical: true },
        { id: "tby2", description: "Visual check entire equipment for signs of wear, cracks, deformation, damage or loose fasteners and retainers", methods: ["VT"], critical: true },
        { id: "tby3", description: "Perform close visual inspection of sheave groove surface for signs of deformation, damage, excessive wear or wire line imprints", methods: ["VT"], critical: true },
        { id: "tby4", description: "Measure the sheave groove depth \"G\" of all sheaves per K-CW-EM-FO-035 — document measurement for each sheave — compare with previous measurements and OEM wear limits", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "tby5", description: "Using a pry bar, carry out wobble test on each sheave — check bearing grease seal / shield for displacement", methods: ["VT", "Dim"], measurement: true, unit: "mm", critical: true },
      ]},
      { id: "tby_dolly", name: "Yearly — Guide dolly", requires: { guideDolly: "Yes" }, items: [
        { id: "tby6", description: "Inspect rollers of Travelling Block guide dolly for wear, cracks, or excessive radial or axial play", methods: ["VT", "Dim"] },
        { id: "tby7", description: "Inspect bearings of Travelling Block guide dolly rollers for correct greasing", methods: ["VT"] },
      ]},
      { id: "tby_ndt", name: "Yearly — NDT (if required)", items: [
        { id: "tby8", description: "If deemed necessary after visual inspection, or if required by local law or contract: carry out NDT inspection of main load bearing components in the main load path per OEM manual", methods: ["NDT", "MPI", "UT"], ndt: true, critical: true },
      ]},
    ],
    tb_5yearly: [
      { id: "tb5_main", name: "5-yearly — Major inspection & recertification (Cat IV)", items: [
        { id: "tb5y1", description: "Equipment due for major inspection and recertification", methods: ["Doc"], critical: true },
        { id: "tb5y2", description: "Scope of work for recertification / exchange determined by condition and inspection results in consultation with Technical Authority", methods: ["Doc"], critical: true },
        { id: "tb5y3", description: "Recertification / overhaul performed per §9 — repair, remanufacture, exchange of components", methods: ["Doc", "VT"] },
        { id: "tb5y4", description: "Measure all sheaves per sheave measuring form K-CW-EM-FO-035 — document groove depth \"G\", groove radius, rim wall thickness per Figure 3 (min 50% of original)", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "tb5y5", description: "Measure all sheave shafts per shaft measuring form K-CW-EM-FO-036", methods: ["Dim"], measurement: true, unit: "mm", critical: true },
        { id: "tb5y6", description: "NDT examination of critical load-bearing components — side plates, clevis, sheave shafts", methods: ["NDT", "MPI", "UT"], ndt: true, critical: true },
        { id: "tb5y7", description: "Inspect all bearings — replace double row taper roller bearings as required per OEM recommendation", methods: ["VT"] },
        { id: "tb5y8", description: "Inspect sheave groove profile per API specification — minimum worn groove radius = nominal rope radius + 2.5%, reject if corrugations or scoring present", methods: ["VT", "Dim"], critical: true },
        { id: "tb5y9", description: "Hard-stamp each sheave with unique identification number — cross-reference on all certificates and reports", methods: ["Doc"], critical: true },
        { id: "tb5y10", description: "Document all measurements per K-CW-EM-FO-035 and K-CW-EM-FO-036, upload to CMMS under equipment number", methods: ["Doc"] },
      ]},
    ],
  },
};
