import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams("promotionId=C-1&cursor=obsolete"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

import { PromotionCampaignItemsTable } from "./promotion-campaign-items-table.client";

describe("PromotionCampaignItemsTable", () => {
  beforeEach(() => navigation.push.mockReset());
  afterEach(cleanup);

  it("pide la siguiente pagina mediante offset y elimina cursor", async () => {
    const user = userEvent.setup();
    render(<PromotionCampaignItemsTable
      promotionId="C-1"
      page={{
        items: [{ itemId: "MLA1" }],
        paging: { total: 100, offset: 0, limit: 50 },
      }}
    />);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/promociones?promotionId=C-1&offset=50"));
  });

  it("muestra valores faltantes como un guion", () => {
    render(<PromotionCampaignItemsTable promotionId="C-1" page={{ items: [{ itemId: "MLA1" }] }} />);

    expect(screen.getAllByText("—")).toHaveLength(3);
  });
});
