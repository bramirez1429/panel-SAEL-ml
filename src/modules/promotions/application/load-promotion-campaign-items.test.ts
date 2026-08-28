import { describe, expect, it, vi } from "vitest";

import type { PromotionCampaignItems } from "../domain/promotion-campaign-items.model";
import { loadPromotionCampaignItems } from "./load-promotion-campaign-items";

const request = {
  promotionId: "C-1",
  promotionType: "MARKETPLACE_CAMPAIGN",
  paging: { limit: 50, offset: 0 },
} as const;

const page: PromotionCampaignItems = {
  items: [{
    itemId: "MLA1", title: "Remera", thumbnail: null, status: "candidate", currentPrice: 20000, promotionPrice: 16000, sellerDiscountAmount: null, mercadoLibreBaseContributionAmount: null, mercadoLibreBoostAmount: null, mercadoLibreContributionAmount: null, estimatedNetAmount: null,
  }],
};

describe("loadPromotionCampaignItems", () => {
  it("conserva una página recibida del repository", async () => {
    const repository = { getCampaignItems: vi.fn().mockResolvedValue(page) };

    await expect(loadPromotionCampaignItems(repository, request)).resolves.toEqual({ success: true, page });
  });

  it("conserva el error para el manejo local seguro", async () => {
    const error = new Error("timeout");
    const repository = { getCampaignItems: vi.fn().mockRejectedValue(error) };

    await expect(loadPromotionCampaignItems(repository, request)).resolves.toEqual({ success: false, error });
  });
});
