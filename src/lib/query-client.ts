import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes before refetching in background
      staleTime: 2 * 60 * 1000,
      // Keep cached data for 10 minutes after component unmount
      gcTime: 10 * 60 * 1000,
      // Show stale data while refetching
      refetchOnWindowFocus: true,
      // Retry failed requests up to 2 times
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Query key factory for consistent, type-safe keys ──
export const queryKeys = {
  // Actions
  actions: {
    all: ['actions'] as const,
    list: () => [...queryKeys.actions.all, 'list'] as const,
    byPlant: (plant: string) => [...queryKeys.actions.all, 'plant', plant] as const,
    detail: (id: string) => [...queryKeys.actions.all, 'detail', id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    files: (id: string) => [...queryKeys.projects.all, 'files', id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },

  // Failure Reports
  failureReports: {
    all: ['failure-reports'] as const,
    list: () => [...queryKeys.failureReports.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.failureReports.all, 'detail', id] as const,
  },

  // Rigs
  rigs: {
    all: ['rigs'] as const,
    list: () => [...queryKeys.rigs.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.rigs.all, 'detail', id] as const,
  },

  // Asset Integrity
  assetRigs: {
    all: ['asset-rigs'] as const,
    list: () => [...queryKeys.assetRigs.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.assetRigs.all, 'detail', id] as const,
  },

  // Tenders
  tenders: {
    all: ['tenders'] as const,
    list: () => [...queryKeys.tenders.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tenders.all, 'detail', id] as const,
  },

  // Inspection Reports
  inspections: {
    all: ['inspections'] as const,
    list: () => [...queryKeys.inspections.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.inspections.all, 'detail', id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },
} as const;
