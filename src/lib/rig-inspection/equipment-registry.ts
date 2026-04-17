import type { EquipmentDef } from "./types";
import { DRAWWORKS } from "./equipment-drawworks";
import { TOPDRIVE } from "./equipment-topdrive";
import { MUDPUMPS } from "./equipment-mudpumps";
import { TRAVELBLOCK } from "./equipment-travelblock";

// Placeholder equipment (not yet implemented)
const placeholder = (id: string, name: string): EquipmentDef => ({
  id, name, docRef: "—", placeholder: true,
  config: [], frequencies: [], sections: {},
});

export const EQUIPMENT: Record<string, EquipmentDef> = {
  drawworks: DRAWWORKS,
  topdrive: TOPDRIVE,
  mudpumps: MUDPUMPS,
  travelblock: TRAVELBLOCK,
  tanks: placeholder("tanks", "Tank System"),
  mast: placeholder("mast", "Mast / Derrick"),
  bop: placeholder("bop", "BOP Stack"),
  crownblock: placeholder("crownblock", "Crown Block"),
  rotarytable: placeholder("rotarytable", "Rotary Table"),
  ironroughneck: placeholder("ironroughneck", "Iron Roughneck"),
};

export { DRAWWORKS, TOPDRIVE, MUDPUMPS, TRAVELBLOCK };
