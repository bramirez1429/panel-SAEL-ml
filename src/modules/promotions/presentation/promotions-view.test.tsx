import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import { PromotionsView } from "./promotions-view";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams("promotionId=OLD&audience=WOMEN&cursor=next"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

const campaigns: readonly PromotionCampaign[] = [{
  id: "C-1", name: "Cyber Fest", type: "DEAL", eligibleItems: 30, startDate: null, finishDate: null,
}];

describe("PromotionsView", () => {
  beforeEach(() => navigation.push.mockReset());
  afterEach(cleanup);

  it("renderiza selector de promoción y su cobertura sin mostrar el ID", async () => {
    const user = userEvent.setup();
    render(<PromotionsView campaigns={campaigns} />);
    expect(screen.getByRole("combobox", { name: "Promoción" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Público" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Promoción" }));
    expect(await screen.findByText("Cyber Fest · 30 publicaciones elegibles")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Promoción" }).parentElement).not.toHaveTextContent("C-1");
  });

  it("agrega la promoción, conserva audiencia y elimina cursor", async () => {
    const user = userEvent.setup();
    render(<PromotionsView campaigns={campaigns} />);
    await user.click(screen.getByRole("combobox", { name: "Promoción" }));
    await user.click(await screen.findByText("Cyber Fest · 30 publicaciones elegibles"));
    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith("/promociones?promotionId=C-1&audience=WOMEN");
    });
  });

  it("muestra el estado vacío de campañas", () => {
    render(<PromotionsView campaigns={[]} />);
    expect(screen.getByText("No hay promociones disponibles actualmente.")).toBeInTheDocument();
  });
});
