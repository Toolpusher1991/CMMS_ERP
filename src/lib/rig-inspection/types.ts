// ─── Rig Equipment Inspection Types ───
// Ported from HP_Rig_Equipment_Inspection.html

export interface ConfigOption {
  key: string;
  label: string;
  options: string[];
}

export interface FrequencyDef {
  id: string;
  label: string;
  cat: "I" | "II" | "III" | "IV";
  who: string;
  inherits: string[];
  desc: string;
  special?: "cativ";
}

export interface InspectionItemDef {
  id: string;
  description: string;
  methods: string[];
  critical?: boolean;
  measurement?: boolean;
  unit?: string;
  ndt?: boolean;
}

export interface SectionDef {
  id: string;
  name: string;
  requires?: Record<string, string>;
  items: InspectionItemDef[];
}

export interface EquipmentDef {
  id: string;
  name: string;
  docRef: string;
  equipmentCode?: string;
  kcadClass?: string;
  criticality?: string;
  standards?: string[];
  placeholder?: boolean;
  config: ConfigOption[];
  frequencies: FrequencyDef[];
  sections: Record<string, SectionDef[]>;
}

// ─── Runtime inspection data ───

export type ItemStatus = "ok" | "obs" | "def" | "na";
export type CumulativeMode = "standalone" | "cumulative";
export type InspectionStatus = "draft" | "complete";

export interface FollowUp {
  sapNumber: string;
  notifType: string;
  priority: number;
  workCenter: string;
  plannedDate: string;
  shortText: string;
  longText: string;
  status: "open" | "progress" | "closed";
  assignedTo: string;
  createdAt: number;
  updatedAt: number;
}

export interface ItemResult {
  status: ItemStatus | null;
  methods: string[];
  measurement: string;
  nominal: string;
  tolMin: string;
  tolMax: string;
  unit: string;
  comment: string;
  photos: { data: string; caption: string; ts: number }[];
  followUp?: FollowUp;
}

export interface LowerRef {
  frequency: string;
  reportNo: string;
  inspector: string;
  date: string;
  inspectionId?: string;
}

export interface InspectionHeader {
  reportNo: string;
  date: string;
  rig: string;
  location: string;
  inspectorName: string;
  inspectorCert: string;
  supervisorName: string;
  clientName: string;
  manufacturer: string;
  model: string;
  serialNo: string;
  yearOfMfg: string;
  workOrder: string;
  notes: string;
  lastInspection: string;
  nextDue: string;
  // Equipment-specific fields stored as generic record
  [key: string]: string;
}

export interface Inspection {
  id: string;
  equipmentType: string;
  frequency: string;
  cumulativeMode: CumulativeMode;
  lowerRefs: LowerRef[];
  status: InspectionStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  rigConfig: Record<string, string>;
  header: InspectionHeader;
  results: Record<string, ItemResult>;
  signatures: { inspector: string; supervisor: string; client: string };
  finalNotes: string;
}

export interface ApplicableSection extends SectionDef {
  freqId: string;
  freqLabel: string;
  freqCat: string;
}

export interface InspectionStats {
  total: number;
  ok: number;
  obs: number;
  def: number;
  na: number;
  done: number;
  critOpen: number;
  pct: number;
}
