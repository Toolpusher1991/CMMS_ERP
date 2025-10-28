import { authService } from './auth.service';
import { captureError, startTransaction } from '../lib/sentry';

// Use environment-appropriate backend URL
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://cmms-erp-backend.onrender.com/api'  // Production: Render backend service
  : 'http://localhost:5137/api';  // Development: local backend

export interface TenderConfiguration {
  id: string;
  projectName: string;
  clientName?: string;
  location?: string;
  projectDuration?: string;
  selectedRig: any;
  selectedEquipment: { [key: string]: any[] };
  totalPrice: number;
  isUnderContract: boolean;
  contractStartDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenderRequest {
  projectName: string;
  clientName?: string;
  location?: string;
  projectDuration?: string;
  selectedRig: any;
  selectedEquipment: { [key: string]: any[] };
  totalPrice: number;
  isUnderContract?: boolean;
  contractStartDate?: string;
  notes?: string;
}

export interface UpdateTenderRequest extends Partial<CreateTenderRequest> {}

class TenderService {
  private async getAuthHeaders() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAllTenders(): Promise<TenderConfiguration[]> {
    const transaction = startTransaction('tender.getAllTenders', 'http');
    
    try {
      console.log('🔧 API Base URL:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/tender`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      console.log('📡 Tender API Response:', response.status, response.statusText);

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      transaction.setStatus('ok');
      return result.data; // Extract the data array from the response
    } catch (error) {
      console.error('Error fetching tenders:', error);
      captureError(error as Error, {
        api_url: API_BASE_URL,
        operation: 'getAllTenders',
      });
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async createTender(tender: CreateTenderRequest): Promise<TenderConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/tender`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(tender),
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating tender:', error);
      throw error;
    }
  }

  async updateTender(id: string, tender: UpdateTenderRequest): Promise<TenderConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/tender/${id}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(tender),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating tender:', error);
      throw error;
    }
  }

  async toggleContractStatus(id: string): Promise<TenderConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/tender/${id}/contract-status`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error toggling contract status:', error);
      throw error;
    }
  }

  async deleteTender(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tender/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw error;
    }
  }

  async getTender(id: string): Promise<TenderConfiguration> {
    try {
      const response = await fetch(`${API_BASE_URL}/tender/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching tender:', error);
      throw error;
    }
  }
}

export const tenderService = new TenderService();