import { describe, expect, it } from "vitest";

import { optionsSchema } from "./promotions.schema";

describe("optionsSchema", () => {
  it("valida el contrato enriquecido de una opción candidate", () => {
    const result = optionsSchema.parse([option()]);

    expect(result[0]).toMatchObject({
      status: "candidate",
      suggestedPromotionPrice: 14_449,
      requiresPriceSelection: true,
      mercadoLibreContributionAmount: 0,
      canApply: true,
      canRemove: false,
    });
  });

  it("conserva en null los importes que Mercado Libre no informa", () => {
    const result = optionsSchema.parse([option({
      sellerDiscountAmount: null,
      mercadoLibreBaseContributionAmount: null,
      mercadoLibreBoostAmount: null,
      mercadoLibreContributionAmount: null,
      estimatedNetAmount: null,
    })]);

    expect(result[0]?.sellerDiscountAmount).toBeNull();
    expect(result[0]?.mercadoLibreContributionAmount).toBeNull();
    expect(result[0]?.estimatedNetAmount).toBeNull();
  });
});

function option(overrides: Record<string, unknown> = {}) {
  return {
    id: "P-1",
    offerId: null,
    type: "DEAL",
    name: "Cyber Fest",
    status: "candidate",
    originalPrice: 20_000,
    promotionPrice: 0,
    minPromotionPrice: 3_400,
    maxPromotionPrice: 15_299,
    suggestedPromotionPrice: 14_449,
    requiresPriceSelection: true,
    discountPercent: null,
    sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: 0,
    mercadoLibreBoostAmount: 0,
    mercadoLibreContributionAmount: 0,
    estimatedNetAmount: null,
    startDate: null,
    finishDate: null,
    canApply: true,
    canRemove: false,
    saleEstimate: null,
    ...overrides,
  };
}
