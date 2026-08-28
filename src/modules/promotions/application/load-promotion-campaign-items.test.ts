import { describe, expect, it, vi } from "vitest";

import { loadPromotionCampaignItems } from "./load-promotion-campaign-items";

const request = {
  promotionId: "C-1",
  promotionType: "MARKETPLACE_CAMPAIGN",
  paging: { limit: 50, offset: 0 },
} as const;

describe("loadPromotionCampaignItems", () => {
  it("conserva una pagina recibida del repository", async () => {
    const repository = {
      getCampaignItems: vi.fn().mockResolvedValue({ items: [{ itemId: "MLA1" }] }),
    };

    await expect(loadPromotionCampaignItems(repository, request)).resolves.toEqual({
      success: true,
      page: { items: [{ itemId: "MLA1" }] },
    });
  });

  it("convierte un fallo de items en resultado local no exitoso", async () => {
    const repository = {
      getCampaignItems: vi.fn().mockRejectedValue(new Error("timeout")),
    };

    await expect(loadPromotionCampaignItems(repository, request)).resolves.toEqual({ success: false });
  });
});
