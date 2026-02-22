// Rig Configurator shared types

export interface ProjectRequirements {
  projectName: string;
  clientName: string;
  location: string;
  projectDuration: string;
  depth: string;
  hookLoad: string;
  footprint: "Klein" | "Mittel" | "Groß" | "";
  rotaryTorque: string;
  pumpPressure: string;
  mudWeight: string;
  casingSize: string;
  holeSize: string;
  formationPressure: string;
  additionalNotes: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  price: string;
  [key: string]: string | undefined;
}
