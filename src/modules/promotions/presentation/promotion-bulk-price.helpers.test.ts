import { describe, expect, it } from "vitest";

import type { PromotionOption } from "../domain/promotions.repository";
import { canEditPromotionPrice, isExistingPromotion, money } from "./promotion-bulk-price.helpers";

describe("capacidades de precio promocional", () => {
  it("permite editar una promoción candidata con operación CREATE", () => {
    expect(canEditPromotionPrice(option({ status: "candidate", requiresPriceSelection: true }))).toBe(true);
  });

  it("permite editar una promoción activa sólo con UPDATE confirmado por backend", () => {
    const active = option({
      status: "started",
      canRemove: true,
      canUpdatePrice: true,
      promotionPrice: 71_911,
      priceModification: { operation: "UPDATE", allowed: true, reason: null },
    });

    expect(isExistingPromotion(active)).toBe(true);
    expect(canEditPromotionPrice(active)).toBe(true);
  });

  it("bloquea una promoción activa fija y una capacidad desconocida", () => {
    expect(canEditPromotionPrice(option({
      status: "started",
      canRemove: true,
      canUpdatePrice: false,
      promotionPrice: 64_999,
      priceModification: { operation: "NONE", allowed: false, reason: "Precio fijo" },
    }))).toBe(false);
    expect(canEditPromotionPrice(option({
      status: "started",
      canRemove: true,
      promotionPrice: 64_999,
    }))).toBe(false);
  });

  it("sólo permite SELLER_CAMPAIGN flexible", () => {
    const base = {
      type: "SELLER_CAMPAIGN",
      status: "started",
      canRemove: true,
      canUpdatePrice: true,
      promotionPrice: 71_911,
      priceModification: { operation: "UPDATE", allowed: true, reason: null },
    };

    expect(canEditPromotionPrice(option({ ...base, subType: "FLEXIBLE_PERCENTAGE" }))).toBe(true);
    expect(canEditPromotionPrice(option({ ...base, subType: "FIXED_AMOUNT" }))).toBe(false);
  });

  it("conserva centavos reales sin redondear precios enteros", () => {
    expect(money(71_911.2)).toBe("$ 71.911,20");
    expect(money(68_999)).toBe("$ 68.999");
  });
});

function option(overrides: Partial<PromotionOption> = {}): PromotionOption {
  return {
    id: "P-1",
    offerId: null,
    type: "DEAL",
    name: "Wellness Week",
    status: "candidate",
    originalPrice: 75_696,
    promotionPrice: null,
    minPromotionPrice: 60_000,
    maxPromotionPrice: 72_000,
    suggestedPromotionPrice: 68_000,
    requiresPriceSelection: true,
    discountPercent: null,
    sellerDiscountAmount: null,
    mercadoLibreBaseContributionAmount: 0,
    mercadoLibreBoostAmount: 0,
    mercadoLibreContributionAmount: 0,
    estimatedNetAmount: null,
    suggestedEstimatedNetAmount: null,
    startDate: null,
    finishDate: null,
    canApply: true,
    canRemove: false,
    saleEstimate: null,
    ...overrides,
  };
}
