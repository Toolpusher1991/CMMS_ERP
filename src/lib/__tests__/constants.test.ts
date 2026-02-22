import { describe, it, expect } from "vitest";
import {
  PRIORITY_CONFIG,
  ACTION_STATUS_CONFIG,
} from "@/lib/constants";

describe("constants", () => {
  describe("PRIORITY_CONFIG", () => {
    it("should have all priority levels defined", () => {
      expect(PRIORITY_CONFIG).toHaveProperty("URGENT");
      expect(PRIORITY_CONFIG).toHaveProperty("CRITICAL");
      expect(PRIORITY_CONFIG).toHaveProperty("HIGH");
      expect(PRIORITY_CONFIG).toHaveProperty("MEDIUM");
      expect(PRIORITY_CONFIG).toHaveProperty("LOW");
    });

    it("should have correct order (URGENT/CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3)", () => {
      expect(PRIORITY_CONFIG.URGENT.order).toBe(0);
      expect(PRIORITY_CONFIG.CRITICAL.order).toBe(0);
      expect(PRIORITY_CONFIG.HIGH.order).toBe(1);
      expect(PRIORITY_CONFIG.MEDIUM.order).toBe(2);
      expect(PRIORITY_CONFIG.LOW.order).toBe(3);
    });

    it("should have labels, colors, and dotColors for each level", () => {
      for (const key of Object.keys(PRIORITY_CONFIG) as (keyof typeof PRIORITY_CONFIG)[]) {
        const config = PRIORITY_CONFIG[key];
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.dotColor).toBeTruthy();
      }
    });
  });

  describe("ACTION_STATUS_CONFIG", () => {
    it("should have OPEN and IN_PROGRESS statuses", () => {
      expect(ACTION_STATUS_CONFIG).toHaveProperty("OPEN");
      expect(ACTION_STATUS_CONFIG).toHaveProperty("IN_PROGRESS");
    });

    it("should have label and color for each status", () => {
      for (const key of Object.keys(ACTION_STATUS_CONFIG) as (keyof typeof ACTION_STATUS_CONFIG)[]) {
        const config = ACTION_STATUS_CONFIG[key];
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
      }
    });
  });
});
