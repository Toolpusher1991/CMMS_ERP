/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";

// Mock authService
vi.mock("@/services/auth.service", () => ({
  authService: {
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    qrLogin: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from "@/services/auth.service";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
    vi.clearAllMocks();
  });

  describe("initialize", () => {
    it("should set authenticated when token and user exist", () => {
      const mockUser = {
        id: "1",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        isActive: true,
        createdAt: "2026-01-01",
      };

      vi.mocked(authService.getToken).mockReturnValue("token-123");
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it("should set unauthenticated when no token", () => {
      vi.mocked(authService.getToken).mockReturnValue(null);
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);

      useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("login", () => {
    it("should set user and isAuthenticated on successful login", async () => {
      const mockUser = {
        id: "2",
        email: "admin@test.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-01-01",
      };

      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        message: "Login successful",
        data: {
          user: mockUser,
          accessToken: "access-123",
          refreshToken: "refresh-456",
        },
      });

      const result = await useAuthStore
        .getState()
        .login({ email: "admin@test.com", password: "pass" });

      expect(result).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe("logout", () => {
    it("should clear user and set unauthenticated", async () => {
      useAuthStore.setState({
        user: { id: "1" } as any,
        isAuthenticated: true,
      });

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("isAdmin", () => {
    it("should return true when user role is ADMIN", () => {
      useAuthStore.setState({
        user: { role: "ADMIN" } as any,
        isAuthenticated: true,
      });
      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });

    it("should return false when user role is USER", () => {
      useAuthStore.setState({
        user: { role: "USER" } as any,
        isAuthenticated: true,
      });
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it("should return false when no user", () => {
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });
  });
});
