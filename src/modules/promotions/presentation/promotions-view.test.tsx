import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import { PromotionsView } from "./promotions-view";

const navigation = vi.hoisted(() => ({ push: vi.fn(), searchParams: new URLSearchParams("audience=WOMEN&cursor=next") }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }), useSearchParams: () => navigation.searchParams }));
const campaigns: readonly PromotionCampaign[] = [{ id: "C-1", name: "Cyber Fest", type: "DEAL", status: "started", startDate: null, finishDate: null, deadlineDate: null }];

describe("PromotionsView", () => {
  beforeEach(() => navigation.push.mockReset());
  afterEach(cleanup);
  it("renderiza sólo el selector y usa fallback para name null", async () => {
    const user = userEvent.setup();
    render(<PromotionsView campaigns={[{ ...campaigns[0]!, name: null }]} />);
    expect(screen.getByRole("combobox", { name: "Promoción" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Promoción" }));
    expect(await screen.findByText("Promoción de Mercado Libre")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Público" })).not.toBeInTheDocument();
  });
  it("guarda sólo promotionId y elimina cursor", async () => {
    const user = userEvent.setup();
    render(<PromotionsView campaigns={campaigns} />);
    await user.click(screen.getByRole("combobox", { name: "Promoción" }));
    await user.click(await screen.findByText("Cyber Fest"));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/promociones?promotionId=C-1"));
  });
  it("muestra el estado vacío sin campañas", () => {
    render(<PromotionsView campaigns={[]} />);
    expect(screen.getByText("No hay promociones disponibles actualmente.")).toBeInTheDocument();
  });
});
