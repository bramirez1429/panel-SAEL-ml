import { describe, expect, it } from "vitest";

import { promotionCampaignItemsSchema } from "./promotion-campaign-items.schema";

const item = {
  itemId: "MLA123", title: "Remera", thumbnail: "https://img/MLA123.jpg", status: "candidate", eligible: true, currentPrice: 20_000, promotionPrice: 16_000, minPromotionPrice: 15_000, maxPromotionPrice: 18_000, suggestedPromotionPrice: 16_000, requiresPriceSelection: false, sellerDiscountAmount: 2_000, mercadoLibreBaseContributionAmount: 1_500, mercadoLibreBoostAmount: 500, mercadoLibreContributionAmount: 2_000, estimatedNetAmount: 14_000,
};

describe("promotionCampaignItemsSchema", () => {
  it("acepta el contrato enriquecido y campos null", () => {
    const parsed = promotionCampaignItemsSchema.parse({
      items: [item, { ...item, title: null, thumbnail: null, status: null, eligible: null, currentPrice: null, promotionPrice: null, minPromotionPrice: null, maxPromotionPrice: null, suggestedPromotionPrice: null, requiresPriceSelection: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: null, mercadoLibreBoostAmount: null, mercadoLibreContributionAmount: null, estimatedNetAmount: null }],
      paging: { total: 2, offset: 0, limit: 50 },
    });

    expect(parsed.items[1]).toMatchObject({
      eligible: null,
      minPromotionPrice: null,
      maxPromotionPrice: null,
      suggestedPromotionPrice: null,
      requiresPriceSelection: null,
    });
  });

  it("rechaza el contrato previo incompleto", () => {
    expect(() => promotionCampaignItemsSchema.parse({ items: [{ itemId: "MLA123", price: 16000 }] })).toThrow();
  });
});
