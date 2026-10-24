import { describe, expect, it, vi } from "vitest";

import type { ApplySelectedPromotionInput } from "./apply-selected-promotion.action";
import { applySelectionWithRetry } from "./apply-selection-with-retry.client";

vi.mock("./apply-selected-promotion.action", () => ({ applySelectedPromotion: vi.fn() }));

const input = { itemId: "MLA1", option: {}, selectedPrice: null } as unknown as ApplySelectedPromotionInput;

describe("applySelectionWithRetry", () => {
  it.each(["PROMOTION_TIMEOUT", "PROMOTION_PROVIDER_UNAVAILABLE"])("no reintenta una escritura para %s", async (diagnosticCode) => {
    const failure = { ok: false as const, message: "Error transitorio", diagnosticCode };
    const execute = vi.fn().mockResolvedValue(failure);

    await expect(applySelectionWithRetry(input, execute)).resolves.toEqual(failure);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    "PROMOTION_CHANGED_DURING_OPERATION",
    "PROMOTION_NOT_APPLICABLE",
    "PROMOTION_PERMISSION_DENIED",
  ])("no reintenta el error de negocio %s", async (diagnosticCode) => {
    const failure = { ok: false as const, message: "Error de negocio", diagnosticCode };
    const execute = vi.fn().mockResolvedValue(failure);
    await expect(applySelectionWithRetry(input, execute)).resolves.toEqual(failure);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
