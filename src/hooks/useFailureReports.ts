import { useState, useEffect, useCallback, useRef } from 'react';
import { failureReportService } from '@/services/failure-report.service';
import type { FailureReport as ServiceFailureReport, FailureReportStatus } from '@/services/failure-report.service';
import type { Plant } from '@/types';

// Re-export for convenience
export type FailureReport = ServiceFailureReport;

interface UseFailureReportsOptions {
  autoLoad?: boolean;
  plant?: Plant;
}

interface UseFailureReportsReturn {
  reports: FailureReport[];
  loading: boolean;
  error: string | null;
  loadReports: () => Promise<void>;
  getReportsByStatus: (status: FailureReportStatus) => FailureReport[];
  getOpenReportsCount: () => number;
}

export function useFailureReports(options: UseFailureReportsOptions = {}): UseFailureReportsReturn {
  const { autoLoad = true, plant } = options;
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await failureReportService.getAll();
      
      let filteredReports = response;
      
      if (plant) {
        filteredReports = response.filter(r => r.plant === plant);
      }
      
      if (isMounted.current) {
        setReports(filteredReports);
      }
    } catch (err) {
      console.error('Failed to load failure reports:', err);
      if (isMounted.current) {
        setError('Störmeldungen konnten nicht geladen werden');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [plant]);

  const getReportsByStatus = useCallback((status: FailureReportStatus): FailureReport[] => {
    return reports.filter(r => r.status === status);
  }, [reports]);

  const getOpenReportsCount = useCallback((): number => {
    return reports.filter(
      r => r.status === 'REPORTED' || r.status === 'IN_REVIEW'
    ).length;
  }, [reports]);

  useEffect(() => {
    isMounted.current = true;
    
    if (autoLoad) {
      loadReports();
    }

    return () => {
      isMounted.current = false;
    };
  }, [autoLoad, loadReports]);

  return {
    reports,
    loading,
    error,
    loadReports,
    getReportsByStatus,
    getOpenReportsCount,
  };
}
