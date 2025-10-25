import { apiClient } from './api';

export type Plant = "T208" | "T207" | "T700" | "T46";
export type FailureReportStatus = "REPORTED" | "IN_REVIEW" | "CONVERTED_TO_ACTION" | "RESOLVED";
export type FailureReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FailureReport {
  id: string;
  reportNumber?: string;
  title: string;
  description: string;
  plant: Plant;
  equipment?: string;
  location?: string;
  status: FailureReportStatus;
  severity: FailureReportSeverity;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedByName?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedAt?: string;
  resolvedAt?: string;
  estimatedDowntime?: number;
  actualDowntime?: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFailureReportDto {
  title: string;
  description: string;
  plant: Plant;
  equipment?: string;
  location?: string;
  severity: FailureReportSeverity;
  images?: File[];
}

export interface UpdateFailureReportDto {
  title?: string;
  description?: string;
  plant?: Plant;
  equipment?: string;
  location?: string;
  status?: FailureReportStatus;
  severity?: FailureReportSeverity;
  assignedToId?: string;
  estimatedDowntime?: number;
  actualDowntime?: number;
}

class FailureReportService {
  private endpoint = '/failure-reports';

  async getAll(): Promise<FailureReport[]> {
    return apiClient.get<FailureReport[]>(this.endpoint);
  }

  async getById(id: string): Promise<FailureReport> {
    return apiClient.get<FailureReport>(`${this.endpoint}/${id}`);
  }

  async getByPlant(plant: Plant): Promise<FailureReport[]> {
    return apiClient.get<FailureReport[]>(`${this.endpoint}?plant=${plant}`);
  }

  async getByStatus(status: FailureReportStatus): Promise<FailureReport[]> {
    return apiClient.get<FailureReport[]>(`${this.endpoint}?status=${status}`);
  }

  async create(data: CreateFailureReportDto): Promise<FailureReport> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('plant', data.plant);
    formData.append('severity', data.severity);
    
    if (data.equipment) formData.append('equipment', data.equipment);
    if (data.location) formData.append('location', data.location);
    
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return apiClient.post<FailureReport>(this.endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async update(id: string, data: UpdateFailureReportDto): Promise<FailureReport> {
    return apiClient.put<FailureReport>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  async assignTo(id: string, userId: string): Promise<FailureReport> {
    return apiClient.put<FailureReport>(`${this.endpoint}/${id}/assign`, { userId });
  }

  async updateStatus(id: string, status: FailureReportStatus): Promise<FailureReport> {
    return apiClient.put<FailureReport>(`${this.endpoint}/${id}/status`, { status });
  }

  async resolve(id: string, actualDowntime?: number): Promise<FailureReport> {
    return apiClient.put<FailureReport>(`${this.endpoint}/${id}/resolve`, { actualDowntime });
  }
}

export const failureReportService = new FailureReportService();
