import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { PromotionsApiRepository } from "../infrastructure/promotions-api.repository.server";
import { PromotionsView } from "./promotions-view";

describe("campaign selector repository flow", () => {
  afterEach(cleanup);

  it.each([["Cyber Fest", "Cyber Fest"], [null, "Promoción de Mercado Libre"]] as const)(
    "recorre repository, schema y Select con name=%s",
    async (name, label) => {
      const http = client();
      vi.mocked(http.get).mockResolvedValue({
        campaigns: [{
          id: "P-1",
          name,
          type: "MARKETPLACE_CAMPAIGN",
          status: "started",
          startDate: null,
          finishDate: null,
          deadlineDate: null,
        }],
      });

      const response = await new PromotionsApiRepository(http).getCampaigns();
      render(<PromotionsView campaigns={response.campaigns} />);
      const user = userEvent.setup();
      await user.click(screen.getByRole("combobox", { name: "Promoción" }));

      expect(await screen.findByText(label)).toBeInTheDocument();
      expect(http.get).toHaveBeenCalledWith(
        "/mercadolibre/direct/promociones/campaigns",
      );
    },
  );
});

function client(): AuthenticatedHttpClient {
  return {
    get: vi.fn<AuthenticatedHttpClient["get"]>(),
    getResponse: vi.fn<AuthenticatedHttpClient["getResponse"]>(),
    post: vi.fn<AuthenticatedHttpClient["post"]>(),
    postResponse: vi.fn<AuthenticatedHttpClient["postResponse"]>(),
    patch: vi.fn<AuthenticatedHttpClient["patch"]>(),
    patchResponse: vi.fn<AuthenticatedHttpClient["patchResponse"]>(),
    delete: vi.fn<AuthenticatedHttpClient["delete"]>(),
    deleteResponse: vi.fn<AuthenticatedHttpClient["deleteResponse"]>(),
  };
}
