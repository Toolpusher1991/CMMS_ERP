/**
 * React Query hooks for server-state management.
 *
 * Replaces manual useEffect+useState fetching patterns with
 * automatic caching, deduplication, and background refresh.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { actionService, type Action } from '@/services/action.service';
import { projectService, type Project } from '@/services/project.service';
import { apiClient } from '@/services/api';
import { rigService } from '@/services/rig.service';
import { tenderService } from '@/services/tender.service';
import type { FailureReport } from '@/types';

// ═══════════════════════════════════════════════════════
// User list (shared across many pages)
// ═══════════════════════════════════════════════════════

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedPlant?: string;
  role?: string;
}

export function useUserList() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => apiClient.get<UserListItem[]>('/users/list'),
    staleTime: 5 * 60 * 1000, // Users change rarely → 5 min stale
  });
}

// ═══════════════════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════════════════

export function useActions() {
  return useQuery({
    queryKey: queryKeys.actions.list(),
    queryFn: () => actionService.getAll(),
  });
}

export function useActionMutations() {
  const qc = useQueryClient();

  const invalidateActions = () =>
    qc.invalidateQueries({ queryKey: queryKeys.actions.all });

  const createAction = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<Action>('/actions', data),
    onSuccess: () => invalidateActions(),
  });

  const updateAction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.put<Action>(`/actions/${id}`, data),
    onSuccess: () => invalidateActions(),
  });

  const deleteAction = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/actions/${id}`),
    onSuccess: () => invalidateActions(),
  });

  return { createAction, updateAction, deleteAction };
}

// ═══════════════════════════════════════════════════════
// Projects
// ═══════════════════════════════════════════════════════

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const res = await projectService.getProjects();
      return res.projects;
    },
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();

  const invalidateProjects = () =>
    qc.invalidateQueries({ queryKey: queryKeys.projects.all });

  const createProject = useMutation({
    mutationFn: (data: Parameters<typeof projectService.createProject>[0]) =>
      projectService.createProject(data),
    onSuccess: () => invalidateProjects(),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectService.updateProject(id, data),
    onSuccess: () => invalidateProjects(),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => invalidateProjects(),
  });

  return { createProject, updateProject, deleteProject };
}

// ═══════════════════════════════════════════════════════
// Failure Reports
// ═══════════════════════════════════════════════════════

export function useFailureReports() {
  return useQuery({
    queryKey: queryKeys.failureReports.list(),
    queryFn: () => apiClient.request<FailureReport[]>('/failure-reports'),
  });
}

export function useFailureReportMutations() {
  const qc = useQueryClient();

  const invalidateReports = () =>
    qc.invalidateQueries({ queryKey: queryKeys.failureReports.all });

  const createReport = useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) =>
      apiClient.post('/failure-reports', data),
    onSuccess: () => invalidateReports(),
  });

  const deleteReport = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/failure-reports/${id}`),
    onSuccess: () => invalidateReports(),
  });

  return { createReport, deleteReport, invalidateReports };
}

// ═══════════════════════════════════════════════════════
// Rigs
// ═══════════════════════════════════════════════════════

export function useRigList() {
  return useQuery({
    queryKey: queryKeys.rigs.list(),
    queryFn: () => rigService.getAllRigs(),
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════
// Tenders
// ═══════════════════════════════════════════════════════

export function useTenders() {
  return useQuery({
    queryKey: queryKeys.tenders.list(),
    queryFn: () => tenderService.getAllTenders(),
  });
}

export function useTenderMutations() {
  const qc = useQueryClient();

  const invalidateTenders = () =>
    qc.invalidateQueries({ queryKey: queryKeys.tenders.all });

  const createTender = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      tenderService.createTender(data as unknown as Parameters<typeof tenderService.createTender>[0]),
    onSuccess: () => invalidateTenders(),
  });

  const updateTender = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      tenderService.updateTender(id, data as unknown as Parameters<typeof tenderService.updateTender>[1]),
    onSuccess: () => invalidateTenders(),
  });

  const deleteTender = useMutation({
    mutationFn: (id: string) => tenderService.deleteTender(id),
    onSuccess: () => invalidateTenders(),
  });

  return { createTender, updateTender, deleteTender, invalidateTenders };
}

// ═══════════════════════════════════════════════════════
// Inspection Reports
// ═══════════════════════════════════════════════════════

export function useInspectionReports() {
  return useQuery({
    queryKey: queryKeys.inspections.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: unknown[] }>('/inspection-reports');
      return res.data;
    },
  });
}

export function useInspectionMutations() {
  const qc = useQueryClient();

  const invalidateInspections = () =>
    qc.invalidateQueries({ queryKey: queryKeys.inspections.all });

  return { invalidateInspections };
}

// ═══════════════════════════════════════════════════════
// Dashboard — combined query (deduplicates with individual caches)
// ═══════════════════════════════════════════════════════

export function useDashboardData() {
  const actions = useActions();
  const projects = useProjects();
  const failureReports = useFailureReports();

  return {
    actions: actions.data ?? [],
    projects: projects.data ?? [],
    failureReports: failureReports.data ?? [],
    isLoading: actions.isLoading || projects.isLoading || failureReports.isLoading,
    error: actions.error || projects.error || failureReports.error,
    refetch: () => {
      actions.refetch();
      projects.refetch();
      failureReports.refetch();
    },
  };
}
