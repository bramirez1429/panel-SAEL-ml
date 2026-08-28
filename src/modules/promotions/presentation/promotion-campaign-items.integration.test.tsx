import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../promotions.composition.server", async () => {
  const { PromotionsApiRepository } = await import("../infrastructure/promotions-api.repository.server");
  return {
    createPromotionsRepository: () => new PromotionsApiRepository(http as never),
  };
});

import { PromotionCampaignItemsSection } from "./promotion-campaign-items-section.server";

describe("PromotionCampaignItems integration", () => {
  it("valida y renderiza el contrato enriquecido desde repository hasta la tabla", async () => {
    http.get.mockResolvedValue({
      items: [{
        itemId: "MLA123", title: "Remera oficial", thumbnail: "https://img/MLA123.jpg", status: "candidate", eligible: true, currentPrice: 20_000, promotionPrice: 16_000, requiresPriceSelection: false, sellerDiscountAmount: 2_000, mercadoLibreBaseContributionAmount: 1_500, mercadoLibreBoostAmount: 500, mercadoLibreContributionAmount: 2_000, estimatedNetAmount: 14_000,
      }],
      paging: { total: 1, offset: 0, limit: 50 },
    });

    render(await PromotionCampaignItemsSection({
      campaign: { id: "P-1", name: "Cyber Fest", type: "MARKETPLACE_CAMPAIGN", status: "started", startDate: null, finishDate: null, deadlineDate: null },
      paging: { limit: 50, offset: 0 },
    }));

    expect(http.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/campaigns/P-1/items?promotionType=MARKETPLACE_CAMPAIGN&limit=50&offset=0",
    );
    expect(screen.getByText("Remera oficial")).toBeInTheDocument();
    expect(screen.getByText("Cyber Fest")).toBeInTheDocument();
    expect(screen.getByText(/\$\s+14\.000/)).toBeInTheDocument();
  });
});
