import type { EquipmentItem } from "@/components/rig-configurator/types";

export interface EquipmentCategory {
  name: string;
  items: EquipmentItem[];
}

export type EquipmentCatalog = Record<string, EquipmentCategory>;

export const DEFAULT_EQUIPMENT_CATALOG: EquipmentCatalog = {
  drillPipe: {
    name: "Bohrgestänge & Drill String",
    items: [
      {
        id: "dp1",
        name: '5" Bohrgestänge (Drill Pipe)',
        spec: "API 5DP S-135, 19.5 lb/ft",
        connection: "NC50",
        quantity: "300 Stangen",
        price: "450",
      },
      {
        id: "dp2",
        name: '5½" Bohrgestänge',
        spec: "API 5DP G-105, 21.9 lb/ft",
        connection: "NC56",
        quantity: "250 Stangen",
        price: "520",
      },
      {
        id: "hwdp1",
        name: '5" Schwerstangen (HWDP)',
        spec: "API 7-1 S-135, 49.3 lb/ft",
        connection: "NC50",
        quantity: "30 Stangen",
        price: "850",
      },
      {
        id: "dc1",
        name: '8" Drill Collars',
        spec: '2 13/16" ID',
        weight: "234 lb/ft",
        quantity: "20 Stück",
        price: "1200",
      },
      {
        id: "dp3",
        name: '3½" Bohrgestänge',
        spec: "API 5DP S-135, 13.3 lb/ft",
        connection: "NC38",
        quantity: "200 Stangen",
        price: "380",
      },
      {
        id: "dc2",
        name: '6½" Drill Collars',
        spec: '2 13/16" ID',
        weight: "139 lb/ft",
        quantity: "15 Stück",
        price: "950",
      },
    ],
  },
  tanks: {
    name: "Tanks & Silos",
    items: [
      { id: "tank1", name: "Spülungstank 500 bbl", capacity: "79.5 m³", type: "Aktiv-Tank", agitator: "2x 50 HP", price: "1800" },
      { id: "tank2", name: "Frischwassertank 300 bbl", capacity: "47.7 m³", material: "Edelstahl", price: "1200" },
      { id: "tank3", name: "Reserve-Spülungstank 300 bbl", capacity: "47.7 m³", type: "Reserve", agitator: "1x 30 HP", price: "1400" },
      { id: "tank4", name: "Dieseltank 20.000 L", capacity: "20 m³", material: "Doppelwandig", type: "Kraftstoff", price: "2800" },
      { id: "silo1", name: "Barite Silo", capacity: "150 m³", system: "Pneumatisch", price: "2500" },
      { id: "silo2", name: "Bentonit Silo", capacity: "100 m³", system: "Druckluft", price: "2200" },
      { id: "silo3", name: "Zement Silo", capacity: "80 m³", system: "Druckluft", price: "2000" },
    ],
  },
  power: {
    name: "Stromversorgung",
    items: [
      { id: "pow1", name: "Netzcontainer 1000 kVA", voltage: "690V/400V", protection: "IP54", price: "4500" },
      { id: "gen1", name: "Caterpillar C32 Generator 1000 kW", fuel: "2000L Tank", runtime: "24h", manufacturer: "Caterpillar", price: "8500" },
      { id: "gen2", name: "Caterpillar C18 Generator 500 kW", fuel: "1000L Tank", runtime: "24h", manufacturer: "Caterpillar", price: "5500" },
      { id: "gen3", name: "Cummins QSK60 Generator 2000 kW", fuel: "3000L Tank", runtime: "18h", manufacturer: "Cummins", price: "12000" },
      { id: "gen4", name: "Cummins QSK38 Generator 1200 kW", fuel: "2000L Tank", runtime: "20h", manufacturer: "Cummins", price: "9500" },
      { id: "scr1", name: "SCR House (Silicon Controlled Rectifier)", voltage: "600V DC", power: "3000 HP", manufacturer: "IEC / Siemens", price: "15000" },
    ],
  },
  camps: {
    name: "Unterkünfte & Büros",
    items: [
      { id: "camp1", name: "Wohncontainer 20ft", capacity: "4 Personen", features: "4 Einzelzimmer", price: "850" },
      { id: "camp2", name: "Wohncontainer 40ft Komfort", capacity: "8 Personen", features: "Klima, TV", price: "1600" },
      { id: "camp3", name: "Bürocontainer 20ft", capacity: "6 Arbeitsplätze", price: "750" },
      { id: "camp4", name: "Sanitärcontainer", capacity: "4 Duschen, 4 WCs", water: "200L Boiler", price: "1200" },
      { id: "camp5", name: "Küchen-Container 40ft", capacity: "30 Personen", features: "Vollküche", price: "2200" },
      { id: "camp6", name: "Toolpusher-Office", capacity: "2 Arbeitsplätze", features: "AC, Funk, Monitor", price: "950" },
      { id: "camp7", name: "Medic-Container", capacity: "Krankenstation", features: "AED, O2, Trage", price: "1800" },
    ],
  },
  safety: {
    name: "Sicherheit & Gas-Detektion",
    items: [
      { id: "gas1", name: "Dräger REGARD 7000 Festgas-Warnsystem", sensors: "12 Sensoren (H₂S, CO, CH₄, O₂)", certification: "ATEX Zone 1", manufacturer: "Dräger", price: "8500" },
      { id: "gas2", name: "Dräger X-am 8000 Tragbare Gaswarngeräte", quantity: "10 Stück", type: "5-Gas Detektor", manufacturer: "Dräger", price: "650" },
      { id: "misc7", name: "Feuerlöscher Set", quantity: "20x 12kg", type: "ABC Pulver", price: "1200" },
      { id: "misc8", name: "Erste-Hilfe Container", capacity: "50 Personen", features: "AED, Defi", price: "4500" },
      { id: "safe1", name: "SCBA Atemschutzgeräte (Dräger PSS 7000)", quantity: "8 Stück", runtime: "30 min", manufacturer: "Dräger", price: "3200" },
      { id: "safe2", name: "Windsack & Wetterstationen", quantity: "4 Stück", type: "Digitale Anzeige", price: "850" },
    ],
  },
  mud: {
    name: "Spülungssysteme",
    items: [
      { id: "mud1", name: "NOV Mud Mixing System", capacity: "100 bbl/h", pumps: "2x 150 HP", manufacturer: "NOV", price: "18500" },
      { id: "mud2", name: "Derrick FLC 2000 Shale Shaker", capacity: "1200 GPM", screens: "4 Siebe", manufacturer: "Derrick Equipment", price: "15000" },
      { id: "mud3", name: "NOV Brandt Desander", capacity: "800 GPM", cones: '12x 10"', manufacturer: "NOV Brandt", price: "8500" },
      { id: "mud4", name: "NOV Brandt Desilter", capacity: "600 GPM", cones: '16x 4"', manufacturer: "NOV Brandt", price: "7500" },
      { id: "mud5", name: "NOV Brandt Mud Cleaner", capacity: "1000 GPM", efficiency: "15-75 Mikron", manufacturer: "NOV Brandt", price: "22000" },
      { id: "mud6", name: "Alfa Laval LYNX 400 Zentrifuge", capacity: "400 GPM", gForce: "3000G", manufacturer: "Alfa Laval", price: "35000" },
      { id: "mud7", name: "Mi-Swaco Degasser (Vacuum)", capacity: "800 GPM", type: "Vakuum", manufacturer: "Schlumberger", price: "12000" },
    ],
  },
  bop: {
    name: "BOP & Well Control",
    items: [
      { id: "bop1", name: 'Cameron Type U BOP Stack 10.000 psi', size: '13 5/8"', config: "Doppel-Ram + Annular", manufacturer: "Cameron (SLB)", price: "125000" },
      { id: "bop2", name: 'Cameron TL BOP Stack 5.000 psi', size: '13 5/8"', config: "Single-Ram + Annular", manufacturer: "Cameron (SLB)", price: "75000" },
      { id: "bop3", name: 'Shaffer LWS BOP Stack 10.000 psi', size: '13 5/8"', config: "Doppel-Ram + Annular", manufacturer: "NOV Shaffer", price: "120000" },
      { id: "bop4", name: "Cameron BOP Kontrollsystem Koomey", pressure: "3.000 psi", features: "Redundante Pumpen, Akkumulator", manufacturer: "Cameron (SLB)", price: "28000" },
      { id: "bop5", name: "Hydril GK Annular BOP 10K", size: '13 5/8"', pressure: "10.000 psi", manufacturer: "NOV Hydril", price: "45000" },
      { id: "bop6", name: "Cameron Choke Manifold 10K", valves: "6x Needle Ventile", manufacturer: "Cameron (SLB)", price: "22000" },
      { id: "bop7", name: 'Cameron Gate Valve 13 5/8" 10K', type: "FC Gate Valve", manufacturer: "Cameron (SLB)", price: "8500" },
    ],
  },
  cranes: {
    name: "Krane & Hebetechnik",
    items: [
      { id: "crane1", name: "Liebherr LTM 1050 Mobilkran 50t", boom: "36m + 12m Wippspitze", operator: "Inkl. Bediener", manufacturer: "Liebherr", price: "2800" },
      { id: "crane2", name: "Liebherr LTR 1100 Raupenkran 100t", boom: "48m + 24m Wippspitze", operator: "Inkl. Bediener", manufacturer: "Liebherr", price: "4500" },
      { id: "crane3", name: "Tadano GR-250N Truck Crane 25t", boom: "28m Teleskop", operator: "Inkl. Bediener", manufacturer: "Tadano", price: "1800" },
      { id: "crane4", name: "Linde H50D Gabelstapler 5t", lift: "4.5m", type: "Diesel Allrad", manufacturer: "Linde", price: "450" },
      { id: "crane5", name: "Liebherr LTM 1220 (220t)", boom: "60m + 30m Wippspitze", operator: "Inkl. 2 Bediener", manufacturer: "Liebherr", price: "8500" },
    ],
  },
  misc: {
    name: "Sonstiges",
    items: [
      { id: "misc1", name: "Atlas Copco XRHS 1150 Kompressor", flow: "30 m³/min", pressure: "24 bar", manufacturer: "Atlas Copco", price: "2800" },
      { id: "misc2", name: "Werkstatt-Container 40ft", equipment: "Drehbank, Schweißgerät, Bohrmaschine", price: "3500" },
      { id: "misc3", name: "Lager-Container 20ft", features: "Regalsystem", price: "450" },
      { id: "misc4", name: "Beleuchtungsturm LED 4x500W", height: "9m", power: "5 kVA Generator", price: "420" },
      { id: "misc5", name: "Atlas Copco XAS 185 Kompressor 10 bar", flow: "10 m³/min", drive: "Diesel", manufacturer: "Atlas Copco", price: "1800" },
      { id: "misc6", name: "Casing Tong (Eckel)", type: "Hydraulisch", torque: "120.000 ft-lbs", manufacturer: "Eckel", price: "12000" },
      { id: "misc9", name: "Catwalk / Pipe Handling System", type: "Hydraulisch", capacity: "10 t", price: "18000" },
    ],
  },
};

export const EQUIPMENT_CATEGORY_KEYS = Object.keys(DEFAULT_EQUIPMENT_CATALOG);

export const EMPTY_EQUIPMENT_SELECTION: Record<string, EquipmentItem[]> = {
  drillPipe: [],
  tanks: [],
  power: [],
  camps: [],
  safety: [],
  mud: [],
  bop: [],
  cranes: [],
  misc: [],
};
