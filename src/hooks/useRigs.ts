import { useState, useEffect, useCallback } from "react";
import { rigService } from "@/services/rig.service";

export interface RigOption {
  id: string;
  name: string;
}

/**
 * Shared hook for loading available rigs.
 * Deduplicates the loadRigs pattern found in ActionTracker, FailureReporting,
 * InspectionReports, ProjectList, and others.
 */
export function useRigs() {
  const [rigs, setRigs] = useState<RigOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await rigService.getAllRigs();
      if (response.success && response.data) {
        setRigs(
          response.data.map((rig) => ({
            id: rig.id,
            name: rig.name,
          }))
        );
      }
    } catch (err) {
      console.error("Fehler beim Laden der Rigs:", err);
      setError("Rigs konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRigs();
  }, [loadRigs]);

  return { rigs, isLoading, error, refresh: loadRigs };
}
