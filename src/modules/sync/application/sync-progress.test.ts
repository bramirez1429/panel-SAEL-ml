import { describe, expect, it } from "vitest";

import { calculateSyncPercent, getMirrorSyncWarning, MIRROR_SYNC_WARNING } from "./sync-progress";

describe("sync progress", () => {
  it("calcula 145 de 250 como 58% usando procesadas", () => {
    expect(calculateSyncPercent(145, 250)).toBe(58);
  });

  it("cuenta los errores dentro de las procesadas", () => {
    const successfulItems = 141;
    const failedItems = 4;
    expect(calculateSyncPercent(successfulItems + failedItems, 250)).toBe(58);
  });

  it("mantiene 100% cuando todas fueron procesadas aunque haya errores", () => {
    expect(calculateSyncPercent(230 + 20, 250)).toBe(100);
  });

  it("devuelve warning cuando Mercado Libre actualizó y el mirror quedó pendiente", () => {
    expect(getMirrorSyncWarning({ providerUpdated: true, mirrorUpdated: false }))
      .toBe(MIRROR_SYNC_WARNING);
    expect(getMirrorSyncWarning({ providerUpdated: true, mirrorUpdated: true }))
      .toBeNull();
  });
});
