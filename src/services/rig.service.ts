import { apiClient } from './api';

// Default rigs - matching AssetIntegrityManagement initialRigs
const DEFAULT_RIG_NAMES = [
  { id: "1", name: "T700" },
  { id: "2", name: "T46" },
  { id: "3", name: "T350" },
];

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
  // GET all rigs - tries backend API first, falls back to localStorage (shared with AssetIntegrityManagement)
  async getAllRigs(): Promise<{ success: boolean; data: Rig[] }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Rig[] }>('/asset-integrity/rigs');
      if (response.success && response.data && response.data.length > 0) {
        return response;
      }
    } catch (error) {
      console.warn('Rig API nicht erreichbar, nutze localStorage-Fallback:', error);
    }

    // Fallback: Read from localStorage (shared with AssetIntegrityManagement)
    const backup = localStorage.getItem("asset-integrity-backup");
    if (backup) {
      try {
        const parsedRigs = JSON.parse(backup);
        if (Array.isArray(parsedRigs) && parsedRigs.length > 0) {
          return {
            success: true,
            data: parsedRigs.map((rig: Record<string, unknown>) => ({
              id: String(rig.id || ''),
              name: String(rig.name || ''),
              category: String(rig.category || ''),
              maxDepth: Number(rig.maxDepth || 0),
              maxHookLoad: Number(rig.maxHookLoad || 0),
              footprint: String(rig.footprint || ''),
              rotaryTorque: Number(rig.rotaryTorque || 0),
              pumpPressure: Number(rig.pumpPressure || 0),
              drawworks: String(rig.drawworks || ''),
              mudPumps: String(rig.mudPumps || ''),
              topDrive: String(rig.topDrive || ''),
              derrickCapacity: String(rig.derrickCapacity || ''),
              crewSize: String(rig.crewSize || ''),
              mobilizationTime: String(rig.mobilizationTime || ''),
              dayRate: String(rig.dayRate || ''),
              description: String(rig.description || ''),
              applications: Array.isArray(rig.applications) ? rig.applications as string[] : [],
              technicalSpecs: String(rig.technicalSpecs || ''),
              createdAt: String(rig.createdAt || new Date().toISOString()),
              updatedAt: String(rig.updatedAt || new Date().toISOString()),
            })),
          };
        }
      } catch (e) {
        console.error('Fehler beim Parsen der localStorage-Backup-Daten:', e);
      }
    }

    // Last fallback: use default rig names from AssetIntegrityManagement
    const now = new Date().toISOString();
    return {
      success: true,
      data: DEFAULT_RIG_NAMES.map(r => ({
        id: r.id,
        name: r.name,
        category: '',
        maxDepth: 0,
        maxHookLoad: 0,
        footprint: '',
        rotaryTorque: 0,
        pumpPressure: 0,
        drawworks: '',
        mudPumps: '',
        topDrive: '',
        derrickCapacity: '',
        crewSize: '',
        mobilizationTime: '',
        dayRate: '',
        description: '',
        applications: [],
        technicalSpecs: '',
        createdAt: now,
        updatedAt: now,
      })),
    };
  },

  // GET single rig by ID (public)
  async getRigById(id: string): Promise<{ success: boolean; data: Rig }> {
    return apiClient.get<{ success: boolean; data: Rig }>(`/asset-integrity/rigs/${id}`);
  },

  // POST create new rig (Admin only)
  async createRig(data: RigCreateData): Promise<{ success: boolean; data: Rig; message: string }> {
    return apiClient.post<{ success: boolean; data: Rig; message: string }>('/asset-integrity/rigs', data);
  },

  // PUT update rig (Admin only)
  async updateRig(id: string, data: RigUpdateData): Promise<{ success: boolean; data: Rig; message: string }> {
    return apiClient.put<{ success: boolean; data: Rig; message: string }>(`/asset-integrity/rigs/${id}`, data);
  },

  // DELETE rig (Admin only)
  async deleteRig(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/asset-integrity/rigs/${id}`);
  },
};
