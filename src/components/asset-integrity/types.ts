// Asset Integrity shared types

export interface Inspection {
  id: string;
  type: "statutory" | "internal" | "client" | "certification";
  description: string;
  dueDate: string;
  completedDate?: string;
  status: "upcoming" | "due" | "overdue" | "completed";
  responsible: string;
}

export interface Issue {
  id: string;
  category: "safety" | "technical" | "compliance" | "commercial";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  dueDate?: string;
  status: "open" | "in-progress" | "closed";
  createdDate: string;
}

export interface Improvement {
  id: string;
  description: string;
  category: "equipment" | "certification" | "compliance" | "efficiency";
  priority: "low" | "medium" | "high";
  estimatedCost: number;
  potentialRevenue: string;
  status: "planned" | "in-progress" | "completed";
}

export interface GeneralInfo {
  id: string;
  description: string;
  deadline?: string;
  createdDate: string;
}

export interface AssetDocument {
  id: string;
  name: string;
  type: "contract" | "certificate" | "photo" | "report" | "drawing";
  size: number;
  uploadDate: string;
  uploadedBy: string;
  version: number;
  url?: string;
}

export interface AssetRig {
  id: string;
  name: string;
  region: "Oman" | "Pakistan";
  contractStatus: "active" | "idle" | "standby" | "maintenance";
  contractEndDate?: string;
  operator?: string;
  location: string;
  dayRate?: number;
  certifications: string[];
  generalInfo?: GeneralInfo[];
  documents?: AssetDocument[];
  inspections: Inspection[];
  issues: Issue[];
  improvements: Improvement[];
}
