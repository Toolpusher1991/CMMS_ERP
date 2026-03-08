import { authService } from './auth.service';
import { captureError, startTransaction } from '../lib/sentry';

// Use environment-appropriate backend URL
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://cmms-erp-backend.onrender.com/api'  // Production: Render backend service
  : 'http://localhost:5137/api';  // Development: local backend

// ── Tender Statuses ───────────────────────────────────────
export const TENDER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'TECHNICAL_REVIEW',
  'APPROVED',
  'QUOTED',
  'CONTRACTED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  TECHNICAL_REVIEW: 'Technische Prüfung',
  APPROVED: 'Genehmigt',
  QUOTED: 'Angebot erstellt',
  CONTRACTED: 'Unter Vertrag',
  COMPLETED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Storniert',
};

export const TENDER_STATUS_COLORS: Record<TenderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-300',
  TECHNICAL_REVIEW: 'bg-purple-100 text-purple-700 border-purple-300',
  APPROVED: 'bg-green-100 text-green-700 border-green-300',
  QUOTED: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  CONTRACTED: 'bg-emerald-100 text-emerald-800 border-emerald-400',
  COMPLETED: 'bg-teal-100 text-teal-700 border-teal-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
  CANCELLED: 'bg-orange-100 text-orange-700 border-orange-300',
};

// Kanban columns (ordered pipeline)
export const KANBAN_COLUMNS: TenderStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'TECHNICAL_REVIEW',
  'APPROVED',
  'QUOTED',
  'CONTRACTED',
];

// ── Interfaces ────────────────────────────────────────────

export interface TenderCommentUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TenderComment {
  id: string;
  tenderId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: TenderCommentUser;
}

export interface TenderStatusHistoryEntry {
  id: string;
  tenderId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

export interface TenderCreator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TenderConfiguration {
  id: string;
  tenderNumber?: string;
  projectName: string;
  clientName?: string;
  location?: string;
  projectDuration?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedRig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedEquipment: { [key: string]: any[] };
  totalPrice: number;
  isUnderContract: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Workflow
  status: TenderStatus;
  validUntil?: string;
  submittedAt?: string;
  submittedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;

  // Risk & Opportunity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technicalRisks?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commercialNotes?: any;
  assetScore?: string;

  // Relations (populated by backend)
  createdByUser?: TenderCreator;
  comments?: TenderComment[];
  statusHistory?: TenderStatusHistoryEntry[];
}

export interface CreateTenderRequest {
  projectName: string;
  clientName?: string;
  location?: string;
  projectDuration?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedRig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedEquipment: { [key: string]: any[] };
  totalPrice: number;
  isUnderContract?: boolean;
  contractStartDate?: string;
  notes?: string;
  validUntil?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technicalRisks?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commercialNotes?: any;
}

export type UpdateTenderRequest = Partial<CreateTenderRequest>;

export interface TransitionRequest {
  toStatus: TenderStatus;
  reason?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

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

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: await this.getAuthHeaders(),
    });
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${response.status}`);
    }
    if (response.status === 204 || options?.method === 'DELETE') {
      return {} as T;
    }
    const result = await response.json();
    return result.data ?? result;
  }

  // ── CRUD ────────────────────────────────────────────────

  async getAllTenders(): Promise<TenderConfiguration[]> {
    const transaction = startTransaction('tender.getAllTenders', 'http');
    try {
      const data = await this.request<TenderConfiguration[]>('/tender');
      transaction.setStatus('ok');
      return data;
    } catch (error) {
      console.error('Error fetching tenders:', error);
      captureError(error as Error, { api_url: API_BASE_URL, operation: 'getAllTenders' });
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async getTender(id: string): Promise<TenderConfiguration> {
    return this.request<TenderConfiguration>(`/tender/${id}`);
  }

  async createTender(tender: CreateTenderRequest): Promise<TenderConfiguration> {
    return this.request<TenderConfiguration>('/tender', {
      method: 'POST',
      body: JSON.stringify(tender),
    });
  }

  async updateTender(id: string, tender: UpdateTenderRequest): Promise<TenderConfiguration> {
    return this.request<TenderConfiguration>(`/tender/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tender),
    });
  }

  async deleteTender(id: string): Promise<void> {
    await this.request<void>(`/tender/${id}`, { method: 'DELETE' });
  }

  // ── Workflow ────────────────────────────────────────────

  async transitionStatus(id: string, transition: TransitionRequest): Promise<TenderConfiguration> {
    return this.request<TenderConfiguration>(`/tender/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(transition),
    });
  }

  /** @deprecated Use transitionStatus instead */
  async toggleContractStatus(id: string): Promise<TenderConfiguration> {
    return this.request<TenderConfiguration>(`/tender/${id}/contract-status`, {
      method: 'PATCH',
    });
  }

  // ── Comments ────────────────────────────────────────────

  async addComment(tenderId: string, text: string): Promise<TenderComment> {
    return this.request<TenderComment>(`/tender/${tenderId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getComments(tenderId: string): Promise<TenderComment[]> {
    return this.request<TenderComment[]>(`/tender/${tenderId}/comments`);
  }

  // ── History ─────────────────────────────────────────────

  async getHistory(tenderId: string): Promise<TenderStatusHistoryEntry[]> {
    return this.request<TenderStatusHistoryEntry[]>(`/tender/${tenderId}/history`);
  }
}

export const tenderService = new TenderService();