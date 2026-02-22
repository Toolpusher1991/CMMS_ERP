import { create } from "zustand";
import { rigService } from "@/services/rig.service";

export interface RigOption {
  id: string;
  name: string;
}

interface RigState {
  rigs: RigOption[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchRigs: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Cache duration: 2 minutes — avoids re-fetching on every page switch
const CACHE_DURATION = 2 * 60 * 1000;

export const useRigStore = create<RigState>((set, get) => ({
  rigs: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchRigs: async () => {
    const { lastFetched, isLoading } = get();

    // Skip if already loading or recently fetched
    if (isLoading) return;
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) return;

    set({ isLoading: true, error: null });
    try {
      const response = await rigService.getAllRigs();
      if (response.success && response.data) {
        set({
          rigs: response.data.map((rig) => ({
            id: rig.id,
            name: rig.name,
          })),
          lastFetched: Date.now(),
        });
      }
    } catch (err) {
      console.error("Fehler beim Laden der Rigs:", err);
      set({ error: "Rigs konnten nicht geladen werden" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Force refresh (bypasses cache)
  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchRigs();
  },
}));
