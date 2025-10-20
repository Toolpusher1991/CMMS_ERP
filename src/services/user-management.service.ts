import { apiClient } from './api';
import type { User } from './auth.service';

// ============================================
// INTERFACES
// ============================================

export interface PendingUser extends User {
  approvalStatus: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  rejectedUsers: number;
  lockedUsers: number;
  usersByRole: {
    role: string;
    count: number;
  }[];
}

export interface ApproveUserData {
  approvalStatus: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface ChangePasswordData {
  newPassword: string;
}

export interface ChangeOwnPasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface PendingUsersResponse {
  success: boolean;
  data: PendingUser[];
}

export interface UserStatisticsResponse {
  success: boolean;
  data: UserStatistics;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// ============================================
// USER MANAGEMENT SERVICE
// ============================================

export const userManagementService = {
  // Get all pending users (Admin only)
  async getPendingUsers(): Promise<PendingUsersResponse> {
    return apiClient.get<PendingUsersResponse>('/user-management/pending');
  },

  // Get user statistics (Admin only)
  async getUserStatistics(): Promise<UserStatisticsResponse> {
    return apiClient.get<UserStatisticsResponse>('/user-management/statistics');
  },

  // Approve or reject a user (Admin only)
  async approveUser(userId: string, data: ApproveUserData): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/user-management/${userId}/approve`, data);
  },

  // Change password for any user (Admin only)
  async changeUserPassword(userId: string, data: ChangePasswordData): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/user-management/${userId}/change-password`, data);
  },

  // Change own password (User self-service)
  async changeOwnPassword(data: ChangeOwnPasswordData): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/user-management/change-password', data);
  },

  // Unlock user account (Admin only)
  async unlockUserAccount(userId: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/user-management/${userId}/unlock`);
  },
};
