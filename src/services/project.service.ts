import { apiClient } from './api';

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  progress: number;
  totalBudget: number;
  spentBudget: number;
  startDate?: string;
  endDate?: string;
  plant?: string; // Add plant field
  category?: 'MECHANICAL' | 'ELECTRICAL' | 'FACILITY'; // Add category field
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members?: ProjectMember[];
  tasks?: ProjectTask[];
  budgetEntries?: ProjectBudget[];
  _count?: {
    tasks: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category?: string;
  date: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface ProjectStats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  totalBudget: number;
  spentBudget: number;
  totalSpent: number;
}

export const projectService = {
  async getProjects(filters?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ projects: Project[]; stats: ProjectStats }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.request<{
      data: { projects: Project[]; stats: ProjectStats };
    }>(`/projects?${params.toString()}`);
    return response.data;
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.request<{ data: Project }>(
      `/projects/${id}`
    );
    return response.data;
  },

  async createProject(data: {
    projectNumber: string;
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    totalBudget?: number;
    startDate?: string;
    endDate?: string;
    managerId?: string;
    plant?: string; // Add plant field
  }): Promise<Project> {
    const response = await apiClient.request<{ data: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.request<{ data: Project }>(
      `/projects/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  async createTask(
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedTo?: string;
      dueDate?: string;
    }
  ): Promise<ProjectTask> {
    const response = await apiClient.request<{ data: ProjectTask }>(
      `/projects/${projectId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  async updateTask(
    projectId: string,
    taskId: string,
    data: Partial<ProjectTask>
  ): Promise<ProjectTask> {
    const response = await apiClient.request<{ data: ProjectTask }>(
      `/projects/${projectId}/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  // Budget
  async addBudgetEntry(
    projectId: string,
    data: {
      description: string;
      amount: number;
      type: 'EXPENSE' | 'INCOME';
      category?: string;
      date?: string;
    }
  ): Promise<ProjectBudget> {
    const response = await apiClient.request<{ data: ProjectBudget }>(
      `/projects/${projectId}/budget`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  // Members
  async addProjectMember(
    projectId: string,
    userId: string,
    role?: string
  ): Promise<ProjectMember> {
    const response = await apiClient.request<{ data: ProjectMember }>(
      `/projects/${projectId}/members`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      }
    );
    return response.data;
  },

  async removeProjectMember(
    projectId: string,
    memberId: string
  ): Promise<void> {
    await apiClient.request(`/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Files
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const response = await apiClient.request<{ data: ProjectFile[] }>(
      `/projects/${projectId}/files`
    );
    return response.data;
  },

  async createFileRecord(
    projectId: string,
    data: {
      filename: string;
      originalName: string;
      fileType: string;
      fileSize: number;
      filePath: string;
      uploadedBy?: string;
    }
  ): Promise<ProjectFile> {
    const response = await apiClient.request<{ data: ProjectFile }>(
      `/projects/${projectId}/files`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    await apiClient.request(`/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
    });
  },
};
