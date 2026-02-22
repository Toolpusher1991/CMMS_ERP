import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/auth.service";

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getToken", () => {
    it("should return null when no token is stored", () => {
      expect(authService.getToken()).toBeNull();
    });

    it("should return the stored access token", () => {
      localStorage.setItem("accessToken", "test-token-123");
      expect(authService.getToken()).toBe("test-token-123");
    });
  });

  describe("getRefreshToken", () => {
    it("should return null when no refresh token is stored", () => {
      expect(authService.getRefreshToken()).toBeNull();
    });

    it("should return the stored refresh token", () => {
      localStorage.setItem("refreshToken", "refresh-token-456");
      expect(authService.getRefreshToken()).toBe("refresh-token-456");
    });
  });

  describe("getCurrentUser", () => {
    it("should return null when no user is stored", () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it("should return parsed user object", () => {
      const user = {
        id: "1",
        email: "admin@test.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      localStorage.setItem("user", JSON.stringify(user));

      const result = authService.getCurrentUser();
      expect(result).toEqual(user);
      expect(result?.email).toBe("admin@test.com");
    });

    it("should return null for invalid JSON", () => {
      localStorage.setItem("user", "not-valid-json");
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when no tokens exist", () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should return false when only access token exists", () => {
      localStorage.setItem("accessToken", "token");
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should return false when only refresh token exists", () => {
      localStorage.setItem("refreshToken", "token");
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should return true when both tokens exist", () => {
      localStorage.setItem("accessToken", "access");
      localStorage.setItem("refreshToken", "refresh");
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("should return false when no user is stored", () => {
      expect(authService.isAdmin()).toBe(false);
    });

    it("should return false for non-admin user", () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "USER", id: "1", email: "u@t.com" }),
      );
      expect(authService.isAdmin()).toBe(false);
    });

    it("should return true for admin user", () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "ADMIN", id: "1", email: "a@t.com" }),
      );
      expect(authService.isAdmin()).toBe(true);
    });
  });

  describe("logout", () => {
    it("should clear all auth data from localStorage", async () => {
      localStorage.setItem("accessToken", "token");
      localStorage.setItem("refreshToken", "refresh");
      localStorage.setItem("user", '{"id":"1"}');

      // Mock fetch for the logout API call
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await authService.logout();

      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });
});
