import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({ getCampaigns: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("../promotions.composition.server", () => ({ createPromotionsRepository: () => repository }));
import { PromotionCampaignsSection } from "./promotion-campaigns-section.server";

describe("PromotionCampaignsSection", () => {
  beforeEach(() => repository.getCampaigns.mockReset());
  afterEach(cleanup);
  it.each([["Cyber Fest", "Cyber Fest"], [null, "Promoción de Mercado Libre"]] as const)("renderiza campaigns exitosas con name=%s", async (name, label) => {
    const user = userEvent.setup();
    repository.getCampaigns.mockResolvedValue({ campaigns: [{ id: "P-1", name, type: "MARKETPLACE_CAMPAIGN", status: "started", startDate: null, finishDate: null, deadlineDate: null }] });
    render(await PromotionCampaignsSection());
    await user.click(screen.getByRole("combobox", { name: "Promoción" }));
    expect(await screen.findByText(label)).toBeInTheDocument();
  });
});
