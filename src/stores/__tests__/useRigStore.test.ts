import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRigStore } from "@/stores/useRigStore";

// Mock rigService
vi.mock("@/services/rig.service", () => ({
  rigService: {
    getAllRigs: vi.fn(),
  },
}));

import { rigService } from "@/services/rig.service";

describe("useRigStore", () => {
  beforeEach(() => {
    useRigStore.setState({
      rigs: [],
      isLoading: false,
      error: null,
      lastFetched: null,
    });
    vi.clearAllMocks();
  });

  describe("fetchRigs", () => {
    it("should load rigs from API", async () => {
      const mockRigs = [
        { id: "1", name: "T700" },
        { id: "2", name: "T46" },
      ];

      vi.mocked(rigService.getAllRigs).mockResolvedValue({
        success: true,
        data: mockRigs,
      });

      await useRigStore.getState().fetchRigs();

      const state = useRigStore.getState();
      expect(state.rigs).toEqual(mockRigs);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).not.toBeNull();
    });

    it("should use cache if data was fetched recently", async () => {
      // Set state as if data was just fetched
      useRigStore.setState({
        rigs: [{ id: "1", name: "T700" }],
        lastFetched: Date.now(),
      });

      await useRigStore.getState().fetchRigs();

      // API should not be called
      expect(rigService.getAllRigs).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      vi.mocked(rigService.getAllRigs).mockRejectedValue(
        new Error("Network error"),
      );

      await useRigStore.getState().fetchRigs();

      const state = useRigStore.getState();
      expect(state.error).toBe("Rigs konnten nicht geladen werden");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("refresh", () => {
    it("should force fetch bypassing cache", async () => {
      const mockRigs = [{ id: "1", name: "T700" }];

      // Set state as if data was just fetched
      useRigStore.setState({
        rigs: [{ id: "old", name: "Old" }],
        lastFetched: Date.now(),
      });

      vi.mocked(rigService.getAllRigs).mockResolvedValue({
        success: true,
        data: mockRigs,
      });

      await useRigStore.getState().refresh();

      expect(rigService.getAllRigs).toHaveBeenCalled();
      expect(useRigStore.getState().rigs).toEqual(mockRigs);
    });
  });
});
