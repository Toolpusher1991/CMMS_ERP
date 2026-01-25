import { useState, useEffect, useCallback, useRef } from 'react';
import { projectService } from '@/services/project.service';
import type { Project as ServiceProject } from '@/services/project.service';
import type { Plant } from '@/types';

// Re-export for convenience
export type Project = ServiceProject;
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

interface UseProjectsOptions {
  autoLoad?: boolean;
  plant?: Plant;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  getMyProjectsCount: (userEmail: string) => number;
  getActiveProjects: () => Project[];
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { autoLoad = true, plant } = options;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await projectService.getProjects();
      
      let filteredProjects = response.projects;
      
      if (plant) {
        filteredProjects = filteredProjects.filter(p => p.plant === plant);
      }
      
      if (isMounted.current) {
        setProjects(filteredProjects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      if (isMounted.current) {
        setError('Projekte konnten nicht geladen werden');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [plant]);

  const getProjectById = useCallback((id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const getProjectsByStatus = useCallback((status: ProjectStatus): Project[] => {
    return projects.filter(p => p.status === status);
  }, [projects]);

  const getMyProjectsCount = useCallback((userEmail: string): number => {
    return projects.filter(p => 
      (p.manager?.email === userEmail || 
       p.members?.some(m => m.user.email === userEmail)) &&
      p.status !== 'COMPLETED' && 
      p.status !== 'CANCELLED'
    ).length;
  }, [projects]);

  const getActiveProjects = useCallback((): Project[] => {
    return projects.filter(
      p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
    );
  }, [projects]);

  useEffect(() => {
    isMounted.current = true;
    
    if (autoLoad) {
      loadProjects();
    }

    return () => {
      isMounted.current = false;
    };
  }, [autoLoad, loadProjects]);

  return {
    projects,
    loading,
    error,
    loadProjects,
    getProjectById,
    getProjectsByStatus,
    getMyProjectsCount,
    getActiveProjects,
  };
}
