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

  it("usa family sourceKey para una publicación nueva", async () => {
    const request = {
      type: "DEAL",
      promotionId: "P-MLA1",
      dealPrice: 80,
    } as const;

    mocks.preview.mockResolvedValue({
      sourceKey: "family:123",
      totalItems: 2,
      applicableItems: 2,
      unavailableItems: 0,
      items: [],
    });

    mocks.apply.mockResolvedValue({
      success: true,
      status: "SUCCESS",
      totalItems: 2,
      successfulItems: 2,
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

    expect(mocks.preview).toHaveBeenCalledWith("family:123", request);
    expect(mocks.apply).toHaveBeenCalledWith("family:123", request);
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
});
