import { apiClient } from './api';

export interface Equipment {
  id: string;
  category: string;
  name: string;
  price: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastEditedBy?: string;
}

export interface EquipmentCreateData {
  category: string;
  name: string;
  price: string;
  properties?: Record<string, string>;
}

export interface EquipmentUpdateData {
  category?: string;
  name?: string;
  price?: string;
  properties?: Record<string, string>;
}

export const equipmentService = {
  // GET all equipment (public)
  async getAllEquipment(category?: string): Promise<{ success: boolean; data: Equipment[] }> {
    const url = category ? `/equipment?category=${category}` : '/equipment';
    return apiClient.get<{ success: boolean; data: Equipment[] }>(url);
  },

  // GET single equipment by ID (public)
  async getEquipmentById(id: string): Promise<{ success: boolean; data: Equipment }> {
    return apiClient.get<{ success: boolean; data: Equipment }>(`/equipment/${id}`);
  },

  // POST create new equipment (Admin only)
  async createEquipment(data: EquipmentCreateData): Promise<{ success: boolean; data: Equipment; message: string }> {
    return apiClient.post<{ success: boolean; data: Equipment; message: string }>('/equipment', data);
  },

  // PUT update equipment (Admin only)
  async updateEquipment(id: string, data: EquipmentUpdateData): Promise<{ success: boolean; data: Equipment; message: string }> {
    return apiClient.put<{ success: boolean; data: Equipment; message: string }>(`/equipment/${id}`, data);
  },

  // DELETE equipment (Admin only)
  async deleteEquipment(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/equipment/${id}`);
  },
};
