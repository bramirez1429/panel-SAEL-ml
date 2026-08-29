import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  apply: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => ({
    preview: mocks.preview,
    apply: mocks.apply,
  }),
}));

import { applySelectedPromotion } from "./apply-selected-promotion.action";

const option: PromotionOption = {
  id: "P-MLA1",
  offerId: null,
  type: "DEAL",
  name: "Cyber Fest",
  status: "candidate",
  originalPrice: 100,
  promotionPrice: null,
  minPromotionPrice: 50,
  maxPromotionPrice: 90,
  suggestedPromotionPrice: 80,
  requiresPriceSelection: true,
  discountPercent: null,
  sellerDiscountAmount: null,
  mercadoLibreBaseContributionAmount: 0,
  mercadoLibreBoostAmount: null,
  mercadoLibreContributionAmount: 0,
  estimatedNetAmount: null,
  suggestedEstimatedNetAmount: 60,
  startDate: null,
  finishDate: null,
  canApply: true,
  canRemove: false,
  saleEstimate: null,
};

describe("applySelectedPromotion", () => {
  beforeEach(() => {
    mocks.preview.mockReset();
    mocks.apply.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("aplica solamente al MLA seleccionado aunque pertenezca a una familia", async () => {
    const request = {
      type: "DEAL",
      promotionId: "P-MLA1",
      dealPrice: 80,
    } as const;

    mocks.preview.mockResolvedValue({
      sourceKey: "item:MLA1",
      totalItems: 1,
      applicableItems: 1,
      unavailableItems: 0,
      items: [],
    });

    mocks.apply.mockResolvedValue({
      success: true,
      status: "SUCCESS",
      totalItems: 1,
      successfulItems: 1,
      failedItems: 0,
      results: [],
    });

    await expect(
      applySelectedPromotion({
        itemId: "MLA1",
        familyId: "123",
        option,
        selectedPrice: 80,
      }),
    ).resolves.toEqual({ ok: true });

    expect(mocks.preview).toHaveBeenCalledWith("item:MLA1", request);
    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", request);
  });

  it("no aplica cuando el preflight falla", async () => {
    mocks.preview.mockResolvedValue({
      sourceKey: "item:MLA1",
      totalItems: 1,
      applicableItems: 0,
      unavailableItems: 1,
      items: [],
    });

    const result = await applySelectedPromotion({
      itemId: "MLA1",
      familyId: null,
      option,
      selectedPrice: 80,
    });

    expect(result.ok).toBe(false);
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it.each([
    ["PROMOTION_APPLICATION_FAILED", "No se pudo aplicar la promoción completa."],
    [
      "PROMOTION_VERIFICATION_FAILED",
      "No pudimos confirmar el estado final de la promoción.",
    ],
    [
      "PROMOTION_CHANGED_DURING_OPERATION",
      "Mercado Libre modificó la disponibilidad de esta promoción. Volvé a consultar.",
    ],
  ])("muestra el error especifico de un failure total: %s", async (errorCode, message) => {
    mocks.preview.mockResolvedValue({
      sourceKey: "item:MLA1",
      totalItems: 1,
      applicableItems: 1,
      unavailableItems: 0,
      items: [],
    });
    mocks.apply.mockResolvedValue({
      success: false,
      status: "FAILURE",
      errorCode,
      totalItems: 1,
      successfulItems: 0,
      failedItems: 1,
      results: [
        {
          itemId: "MLA1",
          success: false,
          stage: "APPLICATION",
          errorCode,
        },
      ],
    });

    await expect(
      applySelectedPromotion({
        itemId: "MLA1",
        familyId: "123",
        option,
        selectedPrice: 80,
      }),
    ).resolves.toEqual({ ok: false, message, diagnosticCode: errorCode });

    expect(mocks.apply).toHaveBeenCalledWith("item:MLA1", expect.any(Object));
  });
});
