import { describe, expect, it } from "vitest";

import { knownPromotionsPages, parsePromotionsPage } from "./promotions-pagination.model";

describe("promotions pagination model", () => {
  it.each([
    [null, 1],
    ["0", 1],
    ["invalid", 1],
    ["3", 3],
  ])("normaliza page %s", (value, expected) => {
    expect(parsePromotionsPage(value)).toBe(expected);
  });

  it("habilita únicamente la próxima página conocida", () => {
    expect(knownPromotionsPages(1, false, "cursor-2")).toBe(2);
  });

  it("no inventa una página cuando el backend terminó", () => {
    expect(knownPromotionsPages(3, true, null)).toBe(3);
  });
});
