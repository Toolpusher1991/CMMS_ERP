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
    ],
  },
  tanks: {
    name: "Tanks & Silos",
    items: [
      { id: "tank1", name: "Spülungstank 500 bbl", capacity: "79.5 m³", type: "Aktiv-Tank", agitator: "2x 50 HP", price: "1800" },
      { id: "tank2", name: "Frischwassertank 300 bbl", capacity: "47.7 m³", material: "Edelstahl", price: "1200" },
      { id: "silo1", name: "Barite Silo", capacity: "150 m³", system: "Pneumatisch", price: "2500" },
      { id: "silo2", name: "Bentonit Silo", capacity: "100 m³", system: "Druckluft", price: "2200" },
    ],
  },
  power: {
    name: "Stromversorgung",
    items: [
      { id: "pow1", name: "Netzcontainer 1000 kVA", voltage: "690V/400V", protection: "IP54", price: "4500" },
      { id: "gen1", name: "Generator 500 kW", fuel: "1000L Tank", runtime: "24h", price: "5500" },
      { id: "gen2", name: "Generator 800 kW", fuel: "1500L Tank", runtime: "20h", price: "7800" },
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
    ],
  },
  safety: {
    name: "Sicherheit & Gas-Detektion",
    items: [
      { id: "gas1", name: "Festgas-Warnsystem", sensors: "12 Sensoren (H2S, CO, CH4, O2)", certification: "ATEX Zone 1", price: "8500" },
      { id: "gas2", name: "Tragbare Gaswarngeräte", quantity: "10 Stück", type: "4-Gas Detektor", price: "450" },
      { id: "misc7", name: "Feuerlöscher Set", quantity: "20x 12kg", type: "ABC Pulver", price: "1200" },
      { id: "misc8", name: "Erste-Hilfe Container", capacity: "50 Personen", features: "AED", price: "4500" },
    ],
  },
  mud: {
    name: "Spülungssysteme",
    items: [
      { id: "mud1", name: "Mud Mixing System", capacity: "100 bbl/h", pumps: "2x 150 HP", price: "18500" },
      { id: "mud2", name: "Shale Shaker Doppeldeck", capacity: "1200 GPM", screens: "4 Siebe", price: "15000" },
      { id: "mud3", name: "Desander", capacity: "800 GPM", cones: '12x 10"', price: "8500" },
      { id: "mud5", name: "Mud Cleaner", capacity: "1000 GPM", efficiency: "15-75 Mikron", price: "22000" },
      { id: "mud6", name: "Zentrifuge", capacity: "400 GPM", gForce: "3000G", price: "35000" },
    ],
  },
  bop: {
    name: "BOP & Well Control",
    items: [
      { id: "bop1", name: "BOP Stack 10.000 psi", size: '13 5/8"', config: "Doppel-Ram + Annular", price: "125000" },
      { id: "bop2", name: "BOP Stack 5.000 psi", size: '13 5/8"', config: "Single-Ram + Annular", price: "75000" },
      { id: "bop3", name: "BOP Kontrollsystem", pressure: "3.000 psi", features: "Redundante Pumpen", price: "28000" },
      { id: "bop4", name: "Choke Manifold 10K", valves: "6x Needle Ventile", price: "22000" },
    ],
  },
  cranes: {
    name: "Krane & Hebetechnik",
    items: [
      { id: "crane1", name: "Mobilkran 50t", boom: "36m + 12m Wippspitze", operator: "Inkl. Bediener", price: "2800" },
      { id: "crane2", name: "Raupenkran 100t", boom: "48m + 24m Wippspitze", operator: "Inkl. Bediener", price: "4500" },
      { id: "crane3", name: "Truck Crane 25t", boom: "28m Teleskop", operator: "Inkl. Bediener", price: "1800" },
      { id: "crane4", name: "Gabelstapler 5t", lift: "4.5m", type: "Diesel Allrad", price: "450" },
    ],
  },
  misc: {
    name: "Sonstiges",
    items: [
      { id: "misc1", name: "Beleuchtungsturm 4x1000W", height: "9m", power: "5 kVA Generator", price: "320" },
      { id: "misc2", name: "Werkstatt-Container 40ft", equipment: "Drehbank, Schweißgerät", price: "3500" },
      { id: "misc3", name: "Lager-Container 20ft", features: "Regalsystem", price: "450" },
      { id: "misc5", name: "Kompressor 10 bar", flow: "20 m³/min", drive: "Diesel", price: "1800" },
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
