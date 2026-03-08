import type { EquipmentItem } from "@/components/rig-configurator/types";

export interface EquipmentCategory {
  name: string;
  items: EquipmentItem[];
}

export type EquipmentCatalog = Record<string, EquipmentCategory>;

export const DEFAULT_EQUIPMENT_CATALOG: EquipmentCatalog = {
  mast: {
    name: "Mast / Derrick",
    items: [
      { id: "mast1", name: "Bentec Euro-Mast 1500 HP", spec: "Tubular, 43m", capacity: "500 t Hakenlast", manufacturer: "Bentec", price: "0" },
      { id: "mast2", name: "NOV IDEAL Mast 2000 HP", spec: "Teleskop, 47m", capacity: "750 t Hakenlast", manufacturer: "NOV", price: "0" },
    ],
  },
  substructure: {
    name: "Unterbau / Substructure",
    items: [
      { id: "sub1", name: "Bentec Euro-Unterbau Box-on-Box", spec: "Sling-Shot, 7.5m Kellerhöhe", capacity: "500 t Setback", manufacturer: "Bentec", price: "0" },
      { id: "sub2", name: "NOV Rapid Rig Substructure", spec: "Self-elevating, 9m Kellerhöhe", capacity: "750 t Setback", manufacturer: "NOV", price: "0" },
    ],
  },
  drawworks: {
    name: "Hebewerk / Drawworks",
    items: [
      { id: "dw1", name: "Bentec EuroDW 2000", spec: "2000 HP, AC-Antrieb", manufacturer: "Bentec", price: "0" },
      { id: "dw2", name: "Continental Emsco C-3 (3000 HP)", spec: "3000 HP, Compound AC", manufacturer: "Continental Emsco", price: "0" },
      { id: "dw3", name: "NOV ADS-10T (2000 HP)", spec: "2000 HP, Top Drive Ready", manufacturer: "NOV", price: "0" },
      { id: "dw4", name: "National 1625-DE (1500 HP)", spec: "1500 HP, DC-Antrieb", manufacturer: "National Oilwell", price: "0" },
    ],
  },
  mudPumps: {
    name: "Mud Pumps / Spülungspumpen",
    items: [
      { id: "mp1", name: "Wirth TPK-1600", spec: "1600 HP Triplex", pressure: "7.500 psi", manufacturer: "Wirth (Aker Solutions)", price: "0" },
      { id: "mp2", name: "Continental Emsco F-1600", spec: "1600 HP Triplex", pressure: "7.500 psi", manufacturer: "Continental Emsco", price: "0" },
      { id: "mp3", name: "NOV 14-P-220", spec: "2200 HP Triplex", pressure: "7.500 psi", manufacturer: "NOV", price: "0" },
      { id: "mp4", name: "NOV 14-P-160", spec: "1600 HP Triplex", pressure: "5.500 psi", manufacturer: "NOV", price: "0" },
      { id: "mp5", name: "Wirth TPK-800", spec: "800 HP Triplex", pressure: "5.000 psi", manufacturer: "Wirth", price: "0" },
    ],
  },
  rigFloor: {
    name: "Rig Floor / Bohrtisch",
    items: [
      { id: "rf1", name: 'Rotary Table 27½"', spec: "API 7K, 500 t", manufacturer: "NOV", price: "0" },
      { id: "rf2", name: "Iron Roughneck ST-80", spec: "Torque 80.000 ft-lbs", manufacturer: "NOV (BV)", price: "0" },
      { id: "rf3", name: "Automated Pipe Handling (Catwalk)", spec: "Hydraulisch, 10 t", manufacturer: "Forum/NOV", price: "0" },
      { id: "rf4", name: "Power Slips", spec: "Pneumatisch/Hydraulisch", manufacturer: "BJ / NOV", price: "0" },
    ],
  },
  bop: {
    name: "BOP Stack / Well Control",
    items: [
      { id: "bop1", name: 'Cameron Type U BOP 10.000 psi', size: '13 5/8"', config: "Doppel-Ram + Annular", manufacturer: "Cameron (SLB)", price: "0" },
      { id: "bop2", name: 'Cameron TL BOP 5.000 psi', size: '13 5/8"', config: "Single-Ram + Annular", manufacturer: "Cameron (SLB)", price: "0" },
      { id: "bop3", name: 'Shaffer LWS BOP 10.000 psi', size: '13 5/8"', config: "Doppel-Ram + Annular", manufacturer: "NOV Shaffer", price: "0" },
      { id: "bop4", name: "Hydril GK Annular BOP 10K", size: '13 5/8"', pressure: "10.000 psi", manufacturer: "NOV Hydril", price: "0" },
      { id: "bop5", name: "Cameron Choke Manifold 10K", valves: "6x Needle Ventile", manufacturer: "Cameron (SLB)", price: "0" },
    ],
  },
  accumulator: {
    name: "Accumulator Unit / BOP Steuerung",
    items: [
      { id: "acc1", name: "Cameron Koomey BOP Kontrollsystem", pressure: "3.000 psi", features: "Redundante Pumpen, 80 gal Akkumulator", manufacturer: "Cameron (SLB)", price: "0" },
      { id: "acc2", name: "NOV Shaffer Accumulator Unit", pressure: "3.000 psi", features: "11 Funktionen, Remote Panel", manufacturer: "NOV Shaffer", price: "0" },
    ],
  },
  tanks: {
    name: "Tankanlagen",
    items: [
      { id: "tank1", name: "Spülungstank 500 bbl", capacity: "79.5 m³", type: "Aktiv-Tank", agitator: "2x 50 HP", price: "0" },
      { id: "tank2", name: "Frischwassertank 300 bbl", capacity: "47.7 m³", material: "Edelstahl", price: "0" },
      { id: "tank3", name: "Reserve-Spülungstank 300 bbl", capacity: "47.7 m³", type: "Reserve", agitator: "1x 30 HP", price: "0" },
      { id: "tank4", name: "Dieseltank 20.000 L", capacity: "20 m³", material: "Doppelwandig", type: "Kraftstoff", price: "0" },
      { id: "silo1", name: "Barite Silo", capacity: "150 m³", system: "Pneumatisch", price: "0" },
      { id: "silo2", name: "Bentonit Silo", capacity: "100 m³", system: "Druckluft", price: "0" },
      { id: "silo3", name: "Zement Silo", capacity: "80 m³", system: "Druckluft", price: "0" },
    ],
  },
  pcr: {
    name: "PCR / Antriebssystem (VFD / SCR)",
    items: [
      { id: "vfd1", name: "Siemens VFD AC Drive System", voltage: "690V AC", power: "3× 1500 HP", manufacturer: "Siemens", price: "0" },
      { id: "scr1", name: "SCR House (Silicon Controlled Rectifier)", voltage: "600V DC", power: "3000 HP", manufacturer: "IEC / Siemens", price: "0" },
      { id: "vfd2", name: "ABB ACS880 VFD System", voltage: "690V AC", power: "3× 1200 HP", manufacturer: "ABB", price: "0" },
      { id: "mcc1", name: "MCC (Motor Control Center)", voltage: "480V/690V", features: "Switchgear, Trafo", manufacturer: "Siemens / ABB", price: "0" },
    ],
  },
};

export const EQUIPMENT_CATEGORY_KEYS = Object.keys(DEFAULT_EQUIPMENT_CATALOG);

export const EMPTY_EQUIPMENT_SELECTION: Record<string, EquipmentItem[]> = {
  mast: [],
  substructure: [],
  drawworks: [],
  mudPumps: [],
  rigFloor: [],
  bop: [],
  accumulator: [],
  tanks: [],
  pcr: [],
};
