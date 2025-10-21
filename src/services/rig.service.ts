import { apiClient } from './api';

export interface Rig {
  id: string;
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  footprint: string;
  rotaryTorque: number;
  pumpPressure: number;
  drawworks: string;
  mudPumps: string;
  topDrive: string;
  derrickCapacity: string;
  crewSize: string;
  mobilizationTime: string;
  dayRate: string;
  description: string;
  applications: string[];
  technicalSpecs: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
}

export interface RigCreateData {
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  footprint: string;
  rotaryTorque: number;
  pumpPressure: number;
  drawworks: string;
  mudPumps: string;
  topDrive: string;
  derrickCapacity: string;
  crewSize: string;
  mobilizationTime: string;
  dayRate: string;
  description: string;
  applications: string[];
  technicalSpecs: string;
}

export interface RigUpdateData {
  name?: string;
  category?: string;
  maxDepth?: number;
  maxHookLoad?: number;
  footprint?: string;
  rotaryTorque?: number;
  pumpPressure?: number;
  drawworks?: string;
  mudPumps?: string;
  topDrive?: string;
  derrickCapacity?: string;
  crewSize?: string;
  mobilizationTime?: string;
  dayRate?: string;
  description?: string;
  applications?: string[];
  technicalSpecs?: string;
}

export const rigService = {
  // GET all rigs (public)
  async getAllRigs(): Promise<{ success: boolean; data: Rig[] }> {
    return apiClient.get<{ success: boolean; data: Rig[] }>('/rigs');
  },

  // GET single rig by ID (public)
  async getRigById(id: string): Promise<{ success: boolean; data: Rig }> {
    return apiClient.get<{ success: boolean; data: Rig }>(`/rigs/${id}`);
  },

  // POST create new rig (Admin only)
  async createRig(data: RigCreateData): Promise<{ success: boolean; data: Rig; message: string }> {
    return apiClient.post<{ success: boolean; data: Rig; message: string }>('/rigs', data);
  },

  // PUT update rig (Admin only)
  async updateRig(id: string, data: RigUpdateData): Promise<{ success: boolean; data: Rig; message: string }> {
    return apiClient.put<{ success: boolean; data: Rig; message: string }>(`/rigs/${id}`, data);
  },

  // DELETE rig (Admin only)
  async deleteRig(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/rigs/${id}`);
  },
};
