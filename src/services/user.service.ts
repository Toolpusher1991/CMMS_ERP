import { apiClient } from './api';
import type { User } from './auth.service';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export const userService = {
  async getAllUsers(): Promise<UsersResponse> {
    return apiClient.get<UsersResponse>('/users');
  },

  async getUserById(id: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${id}`);
  },

  async createUser(data: CreateUserData): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users', data);
  },

  async updateUser(id: string, data: UpdateUserData): Promise<UserResponse> {
    return apiClient.put<UserResponse>(`/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/users/${id}`);
  },
};
