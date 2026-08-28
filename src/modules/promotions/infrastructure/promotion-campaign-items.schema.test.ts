import { describe, expect, it } from "vitest";

import { promotionCampaignItemsSchema } from "./promotion-campaign-items.schema";

const item = {
  itemId: "MLA123", title: "Remera", thumbnail: "https://img/MLA123.jpg", status: "candidate", currentPrice: 20_000, promotionPrice: 16_000, sellerDiscountAmount: 2_000, mercadoLibreBaseContributionAmount: 1_500, mercadoLibreBoostAmount: 500, mercadoLibreContributionAmount: 2_000, estimatedNetAmount: 14_000,
};

describe("promotionCampaignItemsSchema", () => {
  it("acepta el contrato enriquecido y campos null", () => {
    expect(promotionCampaignItemsSchema.parse({
      items: [item, { ...item, title: null, thumbnail: null, status: null, currentPrice: null, promotionPrice: null, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: null, mercadoLibreBoostAmount: null, mercadoLibreContributionAmount: null, estimatedNetAmount: null }],
      paging: { total: 2, offset: 0, limit: 50 },
    })).toHaveProperty("items", expect.any(Array));
  });

  it("rechaza el contrato previo incompleto", () => {
    expect(() => promotionCampaignItemsSchema.parse({ items: [{ itemId: "MLA123", price: 16000 }] })).toThrow();
  });
});
