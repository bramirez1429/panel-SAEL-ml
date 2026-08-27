import { describe, expect, it } from "vitest";
import { formatPromotionPeriod } from "./promotion-date.helpers";
describe("formatPromotionPeriod", () => {
  it("formats same month", () => expect(formatPromotionPeriod("2026-08-17T00:00:00-03:00", "2026-08-31T00:00:00-03:00")).toContain("17 ago."));
  it("preserves offset calendar day and handles missing dates", () => { expect(formatPromotionPeriod("2026-08-17T00:00:00-03:00", null)).toContain("Desde 17 ago."); expect(formatPromotionPeriod(null, null)).toBe("Sin fecha informada"); });
  it("handles invalid dates", () => expect(formatPromotionPeriod("invalid", "2026-08-31")).toContain("Hasta"));
});
