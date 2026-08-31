import { describe, expect, it } from "vitest";

import { formatPromotionPeriod } from "./promotion-period.formatter";

describe("formatPromotionPeriod", () => {
  it("formatea inicio y fin sin desplazar fechas sin hora", () => {
    expect(formatPromotionPeriod("2026-08-31", "2026-09-14")).toBe("31/ago al 14/sep");
  });

  it("formatea sólo el inicio", () => {
    expect(formatPromotionPeriod("2026-08-31", null)).toBe("Desde 31/ago");
  });

  it("formatea sólo el fin", () => {
    expect(formatPromotionPeriod(null, "2026-09-14")).toBe("Hasta 14/sep");
  });

  it("devuelve null sin fechas", () => {
    expect(formatPromotionPeriod(null, null)).toBeNull();
  });

  it("ignora una fecha inválida y conserva la parte válida", () => {
    expect(formatPromotionPeriod("fecha-inválida", "2026-09-14")).toBe("Hasta 14/sep");
    expect(formatPromotionPeriod("2026-02-30", "también-inválida")).toBeNull();
  });

  it("respeta el instante cuando Mercado Libre informa un offset", () => {
    expect(formatPromotionPeriod("2026-09-01T01:00:00Z", null)).toBe("Desde 31/ago");
  });
});
