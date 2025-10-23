import type { Comment } from '../components/CommentSection';
import { apiClient } from './api';

// Action Comments
export const getActionComments = async (actionId: string): Promise<Comment[]> => {
  return await apiClient.get<Comment[]>(`/comments/actions/${actionId}`);
};

export const createActionComment = async (actionId: string, text: string): Promise<Comment> => {
  return await apiClient.post<Comment>(`/comments/actions/${actionId}`, { text });
};

export const updateActionComment = async (
  actionId: string,
  commentId: string,
  text: string
): Promise<Comment> => {
  return await apiClient.put<Comment>(
    `/comments/actions/${actionId}/comments/${commentId}`,
    { text }
  );
};

export const deleteActionComment = async (
  actionId: string,
  commentId: string
): Promise<void> => {
  await apiClient.delete(`/comments/actions/${actionId}/comments/${commentId}`);
};

// Project Comments
export const getProjectComments = async (projectId: string): Promise<Comment[]> => {
  return await apiClient.get<Comment[]>(`/comments/projects/${projectId}`);
};

export const createProjectComment = async (projectId: string, text: string): Promise<Comment> => {
  return await apiClient.post<Comment>(`/comments/projects/${projectId}`, { text });
};

export const updateProjectComment = async (
  projectId: string,
  commentId: string,
  text: string
): Promise<Comment> => {
  return await apiClient.put<Comment>(
    `/comments/projects/${projectId}/comments/${commentId}`,
    { text }
  );
};

export const deleteProjectComment = async (
  projectId: string,
  commentId: string
): Promise<void> => {
  await apiClient.delete(`/comments/projects/${projectId}/comments/${commentId}`);
};
