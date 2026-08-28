import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import type { PromotionCampaignItems } from "../domain/promotion-campaign-items.model";
import { PromotionCampaignItemsTable } from "./promotion-campaign-items-table.client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams("promotionId=C-1&cursor=obsolete"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

const campaign: PromotionCampaign = {
  id: "C-1", name: "Cyber Fest", type: "MARKETPLACE_CAMPAIGN", status: "started", startDate: null, finishDate: null, deadlineDate: null,
};

describe("PromotionCampaignItemsTable", () => {
  beforeEach(() => navigation.push.mockReset());
  afterEach(cleanup);

  it("renderiza imagen, título y los importes enriquecidos", () => {
    render(<PromotionCampaignItemsTable campaign={campaign} page={page([item()])} />);

    expect(screen.getByRole("img", { name: "Remera" })).toHaveAttribute("src", "https://img/MLA1.jpg");
    expect(screen.getByText("Remera")).toBeInTheDocument();
    expect(screen.getByText("MLA1")).toBeInTheDocument();
    expect(screen.getByText("Cyber Fest")).toBeInTheDocument();
    expect(screen.getByText(currency(16000))).toBeInTheDocument();
    expect(screen.getAllByText(currency(2000))).toHaveLength(2);
    expect(screen.getByText(currency(14000))).toBeInTheDocument();
  });

  it("muestra null como guion y usa placeholder cuando no hay imagen", () => {
    render(<PromotionCampaignItemsTable campaign={campaign} page={page([item({ thumbnail: null, title: null, promotionPrice: null, sellerDiscountAmount: null, mercadoLibreContributionAmount: null, estimatedNetAmount: null })])} />);

    expect(screen.getByLabelText("Sin imagen")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(7);
  });

  it("pide la siguiente página mediante offset y elimina cursor", async () => {
    const user = userEvent.setup();
    render(<PromotionCampaignItemsTable campaign={campaign} page={{ ...page([item()]), paging: { total: 100, offset: 0, limit: 50 } }} />);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/promociones?promotionId=C-1&offset=50"));
  });
});

function page(items: PromotionCampaignItems["items"]): PromotionCampaignItems {
  return { items, paging: { total: 1, offset: 0, limit: 50 } };
}

function item(overrides: Partial<PromotionCampaignItems["items"][number]> = {}) {
  return {
    itemId: "MLA1",
    title: "Remera",
    thumbnail: "https://img/MLA1.jpg",
    status: "candidate",
    currentPrice: 20000,
    promotionPrice: 16000,
    sellerDiscountAmount: 2000,
    mercadoLibreBaseContributionAmount: 1500,
    mercadoLibreBoostAmount: 500,
    mercadoLibreContributionAmount: 2000,
    estimatedNetAmount: 14000,
    ...overrides,
  };
}

function currency(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value).replace("\u00a0", " ");
}
