import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock import.meta.env and window before importing apiClient
// so we test the ApiClient class behavior directly

describe("ApiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("Authentication headers", () => {
    it("should include Authorization header when token exists", async () => {
      localStorage.setItem("accessToken", "test-bearer-token");

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      global.fetch = fetchSpy;

      // Dynamic import so our localStorage mock is applied
      const { apiClient } = await import("@/services/api");
      await apiClient.get("/test-endpoint");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBe("Bearer test-bearer-token");
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("should not include Authorization header when no token", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchSpy;

      const { apiClient } = await import("@/services/api");
      await apiClient.get("/test-endpoint");

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });
  });

  describe("HTTP methods", () => {
    it("should call GET with correct method", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });
      global.fetch = fetchSpy;

      const { apiClient } = await import("@/services/api");
      await apiClient.get("/items");

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain("/items");
      expect(options.method).toBe("GET");
    });

    it("should call POST with JSON body", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchSpy;

      const { apiClient } = await import("@/services/api");
      await apiClient.post("/items", { name: "Test Item" });

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ name: "Test Item" });
    });

    it("should call PUT with JSON body", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchSpy;

      const { apiClient } = await import("@/services/api");
      await apiClient.put("/items/1", { name: "Updated" });

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.method).toBe("PUT");
      expect(JSON.parse(options.body)).toEqual({ name: "Updated" });
    });

    it("should call DELETE with correct method", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchSpy;

      const { apiClient } = await import("@/services/api");
      await apiClient.delete("/items/1");

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.method).toBe("DELETE");
    });
  });

  describe("Error handling", () => {
    it("should throw on non-OK response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({ message: "Internal Server Error" }),
      });

      const { apiClient } = await import("@/services/api");
      await expect(apiClient.get("/fail")).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("should throw timeout error on AbortError", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const { apiClient } = await import("@/services/api");
      await expect(apiClient.get("/slow")).rejects.toThrow(
        "Zeitüberschreitung",
      );
    });
  });
});
