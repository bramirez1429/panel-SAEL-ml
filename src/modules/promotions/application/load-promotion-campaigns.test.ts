import { describe, expect, it, vi } from "vitest";

import { loadPromotionCampaigns } from "./load-promotion-campaigns";

describe("loadPromotionCampaigns", () => {
  it("convierte un rechazo del repository en un resultado de error", async () => {
    const error = new Error("Mercado Libre no disponible");
    const repository = { getCampaigns: vi.fn().mockRejectedValue(error) };

    await expect(loadPromotionCampaigns(repository)).resolves.toEqual({
      success: false,
      error,
    });
  });
});
