import { useState, useEffect, useCallback, useRef } from 'react';
import { actionService } from '@/services/action.service';
import type { Action as ServiceAction, ActionStatus } from '@/services/action.service';
import type { Plant } from '@/types';

// Re-export Action type for convenience
export type Action = ServiceAction;

interface UseActionsOptions {
  autoLoad?: boolean;
  plant?: Plant;
  assignedTo?: string;
}

interface UseActionsReturn {
  actions: Action[];
  loading: boolean;
  error: string | null;
  loadActions: () => Promise<void>;
  getActionsByStatus: (status: ActionStatus) => Action[];
  getMyActionsCount: (userEmail: string) => number;
  getOverdueActions: () => Action[];
}

export function useActions(options: UseActionsOptions = {}): UseActionsReturn {
  const { autoLoad = true, plant, assignedTo } = options;
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await actionService.getAll();
      
      let filteredActions = response;
      
      if (plant) {
        filteredActions = filteredActions.filter(a => a.plant === plant);
      }
      
      if (assignedTo) {
        filteredActions = filteredActions.filter(a => a.assignedTo === assignedTo);
      }
      
      if (isMounted.current) {
        setActions(filteredActions);
      }
    } catch (err) {
      console.error('Failed to load actions:', err);
      if (isMounted.current) {
        setError('Actions konnten nicht geladen werden');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [plant, assignedTo]);

  const getActionsByStatus = useCallback((status: ActionStatus): Action[] => {
    return actions.filter(a => a.status === status);
  }, [actions]);

  const getMyActionsCount = useCallback((userEmail: string): number => {
    return actions.filter(
      a => a.assignedTo === userEmail && a.status !== 'COMPLETED'
    ).length;
  }, [actions]);

  const getOverdueActions = useCallback((): Action[] => {
    const now = new Date();
    return actions.filter(a => {
      if (!a.dueDate || a.status === 'COMPLETED') return false;
      return new Date(a.dueDate) < now;
    });
  }, [actions]);

  useEffect(() => {
    isMounted.current = true;
    
    if (autoLoad) {
      loadActions();
    }

    return () => {
      isMounted.current = false;
    };
  }, [autoLoad, loadActions]);

  return {
    actions,
    loading,
    error,
    loadActions,
    getActionsByStatus,
    getMyActionsCount,
    getOverdueActions,
  };
}
