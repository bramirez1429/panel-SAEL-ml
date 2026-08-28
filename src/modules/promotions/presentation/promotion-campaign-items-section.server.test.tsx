import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({ getCampaignItems: vi.fn() }));
const loader = vi.hoisted(() => ({ load: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => repository,
}));
vi.mock("../application/load-promotion-campaign-items", () => ({
  loadPromotionCampaignItems: loader.load,
}));

import { PromotionCampaignItemsSection } from "./promotion-campaign-items-section.server";

const campaign = {
  id: "C-1", name: "Cyber Fest", type: "MARKETPLACE_CAMPAIGN", status: "started", startDate: null, finishDate: null, deadlineDate: null,
} as const;

const page = {
  items: [{
    itemId: "MLA123456", title: "Remera", thumbnail: null, status: "candidate", eligible: true, currentPrice: 20_000, promotionPrice: 16_000, requiresPriceSelection: false, sellerDiscountAmount: 2_000, mercadoLibreBaseContributionAmount: 1_500, mercadoLibreBoostAmount: 500, mercadoLibreContributionAmount: 2_000, estimatedNetAmount: 14_000,
  }],
  paging: { total: 1, offset: 0, limit: 50 },
};

describe("PromotionCampaignItemsSection", () => {
  beforeEach(() => {
    repository.getCampaignItems.mockReset();
    loader.load.mockReset();
  });
  afterEach(cleanup);

  it("consulta los items con el id y type de la campaña seleccionada", async () => {
    repository.getCampaignItems.mockResolvedValue(page);
    loader.load.mockResolvedValue({ success: true, page });

    render(await PromotionCampaignItemsSection({ campaign, paging: { limit: 50, offset: 0 } }));

    expect(loader.load).toHaveBeenCalledWith(repository, { promotionId: "C-1", promotionType: "MARKETPLACE_CAMPAIGN", paging: { limit: 50, offset: 0 } });
    expect(screen.getByText("Remera")).toBeInTheDocument();
    expect(screen.getByText("Cyber Fest")).toBeInTheDocument();
  });

  it("muestra el estado vacío para una respuesta sin items", async () => {
    repository.getCampaignItems.mockResolvedValue({ items: [] });
    loader.load.mockResolvedValue({ success: true, page: { items: [] } });

    render(await PromotionCampaignItemsSection({ campaign, paging: { limit: 50, offset: 0 } }));

    expect(screen.getByText(/No hay publicaciones/)).toBeInTheDocument();
  });

  it("registra y muestra un error local para la consulta de items", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    loader.load.mockResolvedValue({ success: false, error: new Error("timeout") });

    render(await PromotionCampaignItemsSection({ campaign, paging: { limit: 50, offset: 0 } }));

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las publicaciones de esta promoción");
    expect(log).toHaveBeenCalledWith("Falló la carga de ítems de una campaña de Mercado Libre.", expect.objectContaining({ message: "timeout" }));
    log.mockRestore();
  });
});
