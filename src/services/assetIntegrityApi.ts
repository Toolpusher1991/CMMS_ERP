/**
 * Asset Integrity Management API Service
 * 
 * Dieser Service handled alle API-Calls für das Asset Integrity Management System.
 * Backend-Endpunkte müssen in backend/src/routes/ angelegt werden.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5137';

// Types (sollten mit Backend synchronisiert werden)
export interface GeneralInfo {
  id: string;
  description: string;
  deadline?: string;
  createdDate: string;
}

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

export interface Rig {
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
  inspections: Inspection[];
  issues: Issue[];
  improvements: Improvement[];
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  const json = await response.json();
  // Backend wraps responses in { success, data, message } — unwrap automatically
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ===== RIG MANAGEMENT =====

/**
 * Alle Anlagen abrufen
 */
export async function getAllRigs(): Promise<Rig[]> {
  return apiCall<Rig[]>('/api/asset-integrity/rigs');
}

/**
 * Einzelne Anlage abrufen
 */
export async function getRigById(rigId: string): Promise<Rig> {
  return apiCall<Rig>(`/api/asset-integrity/rigs/${rigId}`);
}

/**
 * Neue Anlage erstellen
 */
export async function createRig(rig: Omit<Rig, 'id'>): Promise<Rig> {
  return apiCall<Rig>('/api/asset-integrity/rigs', {
    method: 'POST',
    body: JSON.stringify(rig),
  });
}

/**
 * Anlage aktualisieren
 */
export async function updateRig(rigId: string, updates: Partial<Rig>): Promise<Rig> {
  return apiCall<Rig>(`/api/asset-integrity/rigs/${rigId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Anlage löschen
 */
export async function deleteRig(rigId: string): Promise<void> {
  return apiCall<void>(`/api/asset-integrity/rigs/${rigId}`, {
    method: 'DELETE',
  });
}

// ===== GENERAL INFO MANAGEMENT =====

/**
 * Neue Notiz/Info hinzufügen
 */
export async function addGeneralInfo(
  rigId: string,
  info: Omit<GeneralInfo, 'id' | 'createdDate'>
): Promise<GeneralInfo> {
  return apiCall<GeneralInfo>(`/api/asset-integrity/rigs/${rigId}/general-info`, {
    method: 'POST',
    body: JSON.stringify(info),
  });
}

/**
 * Notiz/Info aktualisieren
 */
export async function updateGeneralInfo(
  rigId: string,
  infoId: string,
  updates: Partial<GeneralInfo>
): Promise<GeneralInfo> {
  return apiCall<GeneralInfo>(`/api/asset-integrity/rigs/${rigId}/general-info/${infoId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Notiz/Info löschen
 */
export async function deleteGeneralInfo(rigId: string, infoId: string): Promise<void> {
  return apiCall<void>(`/api/asset-integrity/rigs/${rigId}/general-info/${infoId}`, {
    method: 'DELETE',
  });
}

// ===== INSPECTION MANAGEMENT =====

/**
 * Neue Inspektion hinzufügen
 */
export async function addInspection(
  rigId: string,
  inspection: Omit<Inspection, 'id' | 'status'>
): Promise<Inspection> {
  return apiCall<Inspection>(`/api/asset-integrity/rigs/${rigId}/inspections`, {
    method: 'POST',
    body: JSON.stringify(inspection),
  });
}

/**
 * Inspektion aktualisieren
 */
export async function updateInspection(
  rigId: string,
  inspectionId: string,
  updates: Partial<Inspection>
): Promise<Inspection> {
  return apiCall<Inspection>(`/api/asset-integrity/rigs/${rigId}/inspections/${inspectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Inspektion löschen
 */
export async function deleteInspection(rigId: string, inspectionId: string): Promise<void> {
  return apiCall<void>(`/api/asset-integrity/rigs/${rigId}/inspections/${inspectionId}`, {
    method: 'DELETE',
  });
}

// ===== ISSUE MANAGEMENT =====

/**
 * Neues Risiko/Issue hinzufügen
 */
export async function addIssue(
  rigId: string,
  issue: Omit<Issue, 'id' | 'status' | 'createdDate'>
): Promise<Issue> {
  return apiCall<Issue>(`/api/asset-integrity/rigs/${rigId}/issues`, {
    method: 'POST',
    body: JSON.stringify(issue),
  });
}

/**
 * Issue aktualisieren
 */
export async function updateIssue(
  rigId: string,
  issueId: string,
  updates: Partial<Issue>
): Promise<Issue> {
  return apiCall<Issue>(`/api/asset-integrity/rigs/${rigId}/issues/${issueId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Issue löschen
 */
export async function deleteIssue(rigId: string, issueId: string): Promise<void> {
  return apiCall<void>(`/api/asset-integrity/rigs/${rigId}/issues/${issueId}`, {
    method: 'DELETE',
  });
}

// ===== IMPROVEMENT MANAGEMENT =====

/**
 * Neue Verbesserung/Upgrade hinzufügen
 */
export async function addImprovement(
  rigId: string,
  improvement: Omit<Improvement, 'id' | 'status'>
): Promise<Improvement> {
  return apiCall<Improvement>(`/api/asset-integrity/rigs/${rigId}/improvements`, {
    method: 'POST',
    body: JSON.stringify(improvement),
  });
}

/**
 * Improvement aktualisieren
 */
export async function updateImprovement(
  rigId: string,
  improvementId: string,
  updates: Partial<Improvement>
): Promise<Improvement> {
  return apiCall<Improvement>(`/api/asset-integrity/rigs/${rigId}/improvements/${improvementId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Improvement löschen
 */
export async function deleteImprovement(rigId: string, improvementId: string): Promise<void> {
  return apiCall<void>(`/api/asset-integrity/rigs/${rigId}/improvements/${improvementId}`, {
    method: 'DELETE',
  });
}

// ===== REPORTING =====

/**
 * Meeting-Übersicht generieren
 */
export async function generateMeetingOverview(rigIds?: string[]): Promise<{ overview: string }> {
  return apiCall<{ overview: string }>('/api/asset-integrity/meeting-overview', {
    method: 'POST',
    body: JSON.stringify({ rigIds }),
  });
}

// Export all functions
export default {
  getAllRigs,
  getRigById,
  createRig,
  updateRig,
  deleteRig,
  addGeneralInfo,
  updateGeneralInfo,
  deleteGeneralInfo,
  addInspection,
  updateInspection,
  deleteInspection,
  addIssue,
  updateIssue,
  deleteIssue,
  addImprovement,
  updateImprovement,
  deleteImprovement,
  generateMeetingOverview,
};
