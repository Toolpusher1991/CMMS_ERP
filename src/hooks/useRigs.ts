import { useEffect } from "react";
import { useRigStore, type RigOption } from "@/stores/useRigStore";

export type { RigOption };

/**
 * Shared hook for loading available rigs.
 * Backed by Zustand store — all consumers share the same cached data.
 * Only one API call is made, with a 2-minute cache.
 */
export function useRigs() {
  const { rigs, isLoading, error, fetchRigs, refresh } = useRigStore();

  useEffect(() => {
    fetchRigs();
  }, [fetchRigs]);

  return { rigs, isLoading, error, refresh };
}
