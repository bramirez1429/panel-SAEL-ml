import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({ getCampaignItems: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../promotions.composition.server", () => ({
  createPromotionsRepository: () => repository,
}));

import { PromotionCampaignItemsSection } from "./promotion-campaign-items-section.server";
import { PromotionCampaignItemsError } from "./promotion-campaign-items-error";

const campaign = {
  id: "C-1",
  name: "Cyber Fest",
  type: "MARKETPLACE_CAMPAIGN",
  status: "started",
  startDate: null,
  finishDate: null,
  deadlineDate: null,
} as const;

describe("PromotionCampaignItemsSection", () => {
  beforeEach(() => repository.getCampaignItems.mockReset());
  afterEach(cleanup);

  it("consulta los items con el id y type de la campana seleccionada", async () => {
    repository.getCampaignItems.mockResolvedValue({
      items: [{ itemId: "MLA123456", status: "candidate", price: 20_000, promotionPrice: 16_000 }],
      paging: { total: 1, offset: 0, limit: 50 },
    });

    render(await PromotionCampaignItemsSection({ campaign, paging: { limit: 50, offset: 0 } }));

    expect(repository.getCampaignItems).toHaveBeenCalledWith({
      promotionId: "C-1",
      promotionType: "MARKETPLACE_CAMPAIGN",
      paging: { limit: 50, offset: 0 },
    });
    expect(screen.getByText("MLA123456")).toBeInTheDocument();
    expect(screen.getByText("candidate")).toBeInTheDocument();
    expect(screen.getByText("$20.000")).toBeInTheDocument();
    expect(screen.getByText("$16.000")).toBeInTheDocument();
  });

  it("muestra el estado vacio para una respuesta sin items", async () => {
    repository.getCampaignItems.mockResolvedValue({ items: [] });

    render(await PromotionCampaignItemsSection({ campaign, paging: { limit: 50, offset: 0 } }));

    expect(screen.getByText(/No hay publicaciones/)).toBeInTheDocument();
  });

  it("muestra un error local para la consulta de items", () => {
    render(<PromotionCampaignItemsError />);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las publicaciones");
  });
});
