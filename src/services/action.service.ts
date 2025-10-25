import { apiClient } from './api';

export type Plant = "T208" | "T207" | "T700" | "T46";
export type ActionStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";
export type ActionPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ActionCategory = "ALLGEMEIN" | "RIGMOVE";

export interface Action {
  id: string;
  plant: Plant;
  category?: ActionCategory;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: ActionPriority;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

class ActionService {
  private endpoint = '/actions';

  async getAll(): Promise<Action[]> {
    return apiClient.get<Action[]>(this.endpoint);
  }

  async getById(id: string): Promise<Action> {
    return apiClient.get<Action>(`${this.endpoint}/${id}`);
  }

  async getByPlant(plant: Plant): Promise<Action[]> {
    return apiClient.get<Action[]>(`${this.endpoint}?plant=${plant}`);
  }

  async getByStatus(status: ActionStatus): Promise<Action[]> {
    return apiClient.get<Action[]>(`${this.endpoint}?status=${status}`);
  }

  async getStats(): Promise<ActionStats> {
    const actions = await this.getAll();
    const now = new Date();

    const stats: ActionStats = {
      total: actions.length,
      open: actions.filter((a) => a.status === "OPEN").length,
      inProgress: actions.filter((a) => a.status === "IN_PROGRESS").length,
      completed: actions.filter((a) => a.status === "COMPLETED").length,
      overdue: actions.filter((a) => {
        if (a.status === "COMPLETED") return false;
        if (!a.dueDate) return false;
        return new Date(a.dueDate) < now;
      }).length,
      byPriority: {
        low: actions.filter((a) => a.priority === "LOW").length,
        medium: actions.filter((a) => a.priority === "MEDIUM").length,
        high: actions.filter((a) => a.priority === "HIGH").length,
        urgent: actions.filter((a) => a.priority === "URGENT").length,
      },
    };

    return stats;
  }

  async getStatsByPlant(plant: Plant): Promise<ActionStats> {
    const actions = await this.getByPlant(plant);
    const now = new Date();

    const stats: ActionStats = {
      total: actions.length,
      open: actions.filter((a) => a.status === "OPEN").length,
      inProgress: actions.filter((a) => a.status === "IN_PROGRESS").length,
      completed: actions.filter((a) => a.status === "COMPLETED").length,
      overdue: actions.filter((a) => {
        if (a.status === "COMPLETED") return false;
        if (!a.dueDate) return false;
        return new Date(a.dueDate) < now;
      }).length,
      byPriority: {
        low: actions.filter((a) => a.priority === "LOW").length,
        medium: actions.filter((a) => a.priority === "MEDIUM").length,
        high: actions.filter((a) => a.priority === "HIGH").length,
        urgent: actions.filter((a) => a.priority === "URGENT").length,
      },
    };

    return stats;
  }
}

export const actionService = new ActionService();
