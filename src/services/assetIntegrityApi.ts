/**
 * Asset Integrity Management API Service
 * 
 * Nutzt den gemeinsamen apiClient für Auth-Token, Timeout, Token-Refresh und Rate-Limit-Retry.
 */

import { apiClient } from './api';

// Types (synchronisiert mit Backend)
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

// Helper: Backend wraps responses in { success, data } — unwrap automatically
function unwrap<T>(response: { success?: boolean; data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

// ===== RIG MANAGEMENT =====

/**
 * Alle Anlagen abrufen
 */
export async function getAllRigs(): Promise<Rig[]> {
  const response = await apiClient.get<{ success: boolean; data: Rig[] }>('/asset-integrity/rigs');
  return unwrap(response);
}

/**
 * Einzelne Anlage abrufen
 */
export async function getRigById(rigId: string): Promise<Rig> {
  const response = await apiClient.get<{ success: boolean; data: Rig }>(`/asset-integrity/rigs/${rigId}`);
  return unwrap(response);
}

/**
 * Neue Anlage erstellen
 */
export async function createRig(rig: Omit<Rig, 'id'>): Promise<Rig> {
  const response = await apiClient.post<{ success: boolean; data: Rig }>('/asset-integrity/rigs', rig);
  return unwrap(response);
}

/**
 * Anlage aktualisieren
 */
export async function updateRig(rigId: string, updates: Partial<Rig>): Promise<Rig> {
  const response = await apiClient.put<{ success: boolean; data: Rig }>(`/asset-integrity/rigs/${rigId}`, updates);
  return unwrap(response);
}

/**
 * Anlage löschen
 */
export async function deleteRig(rigId: string): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${rigId}`);
}

// ===== GENERAL INFO MANAGEMENT =====

/**
 * Neue Notiz/Info hinzufügen
 */
export async function addGeneralInfo(
  rigId: string,
  info: Omit<GeneralInfo, 'id' | 'createdDate'>
): Promise<GeneralInfo> {
  const response = await apiClient.post<{ success: boolean; data: GeneralInfo }>(`/asset-integrity/rigs/${rigId}/general-info`, info);
  return unwrap(response);
}

/**
 * Notiz/Info aktualisieren
 */
export async function updateGeneralInfo(
  rigId: string,
  infoId: string,
  updates: Partial<GeneralInfo>
): Promise<GeneralInfo> {
  const response = await apiClient.put<{ success: boolean; data: GeneralInfo }>(`/asset-integrity/rigs/${rigId}/general-info/${infoId}`, updates);
  return unwrap(response);
}

/**
 * Notiz/Info löschen
 */
export async function deleteGeneralInfo(rigId: string, infoId: string): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${rigId}/general-info/${infoId}`);
}

// ===== INSPECTION MANAGEMENT =====

/**
 * Neue Inspektion hinzufügen
 */
export async function addInspection(
  rigId: string,
  inspection: Omit<Inspection, 'id' | 'status'>
): Promise<Inspection> {
  const response = await apiClient.post<{ success: boolean; data: Inspection }>(`/asset-integrity/rigs/${rigId}/inspections`, inspection);
  return unwrap(response);
}

/**
 * Inspektion aktualisieren
 */
export async function updateInspection(
  rigId: string,
  inspectionId: string,
  updates: Partial<Inspection>
): Promise<Inspection> {
  const response = await apiClient.put<{ success: boolean; data: Inspection }>(`/asset-integrity/rigs/${rigId}/inspections/${inspectionId}`, updates);
  return unwrap(response);
}

/**
 * Inspektion löschen
 */
export async function deleteInspection(rigId: string, inspectionId: string): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${rigId}/inspections/${inspectionId}`);
}

// ===== ISSUE MANAGEMENT =====

/**
 * Neues Risiko/Issue hinzufügen
 */
export async function addIssue(
  rigId: string,
  issue: Omit<Issue, 'id' | 'status' | 'createdDate'>
): Promise<Issue> {
  const response = await apiClient.post<{ success: boolean; data: Issue }>(`/asset-integrity/rigs/${rigId}/issues`, issue);
  return unwrap(response);
}

/**
 * Issue aktualisieren
 */
export async function updateIssue(
  rigId: string,
  issueId: string,
  updates: Partial<Issue>
): Promise<Issue> {
  const response = await apiClient.put<{ success: boolean; data: Issue }>(`/asset-integrity/rigs/${rigId}/issues/${issueId}`, updates);
  return unwrap(response);
}

/**
 * Issue löschen
 */
export async function deleteIssue(rigId: string, issueId: string): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${rigId}/issues/${issueId}`);
}

// ===== IMPROVEMENT MANAGEMENT =====

/**
 * Neue Verbesserung/Upgrade hinzufügen
 */
export async function addImprovement(
  rigId: string,
  improvement: Omit<Improvement, 'id' | 'status'>
): Promise<Improvement> {
  const response = await apiClient.post<{ success: boolean; data: Improvement }>(`/asset-integrity/rigs/${rigId}/improvements`, improvement);
  return unwrap(response);
}

/**
 * Improvement aktualisieren
 */
export async function updateImprovement(
  rigId: string,
  improvementId: string,
  updates: Partial<Improvement>
): Promise<Improvement> {
  const response = await apiClient.put<{ success: boolean; data: Improvement }>(`/asset-integrity/rigs/${rigId}/improvements/${improvementId}`, updates);
  return unwrap(response);
}

/**
 * Improvement löschen
 */
export async function deleteImprovement(rigId: string, improvementId: string): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${rigId}/improvements/${improvementId}`);
}

// ===== REPORTING =====

/**
 * Meeting-Übersicht generieren
 */
export async function generateMeetingOverview(rigIds?: string[]): Promise<{ overview: string }> {
  const response = await apiClient.post<{ success: boolean; data: { overview: string } }>('/asset-integrity/meeting-overview', { rigIds });
  return unwrap(response);
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
