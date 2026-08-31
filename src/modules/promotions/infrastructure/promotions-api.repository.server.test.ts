// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { PromotionApplyRequest } from "../domain/promotions.repository";
import { previewAllowsApplication } from "../domain/publication-promotion.model";
import { PromotionsApiRepository } from "./promotions-api.repository.server";

const request: PromotionApplyRequest = {
  type: "DEAL",
  promotionId: "deal-1",
  dealPrice: 80,
};

describe("PromotionsApiRepository publication operations", () => {
  it("usa el endpoint real del catálogo para la búsqueda server-side", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ done: true, nextCursor: null, count: 0, publications: [] });

    await new PromotionsApiRepository(http).getCatalog({ limit: 20, cursor: null, search: "123456" });

    expect(http.get).toHaveBeenCalledWith("/mercadolibre/direct/promociones?limit=20&search=123456");
  });

  it.each([
    [8, 8, true],
    [8, 6, false],
  ])("interpreta preview %i/%i y decide si permite aplicar", (total, applicable, allowed) => {
    expect(previewAllowsApplication(preview(total, applicable))).toBe(allowed);
  });

  it("consulta preview con timeout de 30 segundos", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue(preview(8, 8));

    await new PromotionsApiRepository(http).preview("family:123", request);

    expect(http.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/publicacion/family%3A123/preview?type=DEAL&promotionId=deal-1&dealPrice=80",
      { timeoutMs: 30_000 },
    );
  });

  it("aplica con timeout de 120 segundos", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue(result(8, 8));

    await new PromotionsApiRepository(http).apply("family:123", request);

    expect(http.post).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/publicacion/family%3A123/aplicar",
      request,
      { timeoutMs: 120_000 },
    );
  });

  it("acepta un failure total con el error real del MLA", async () => {
    const http = client();
    const failure = {
      success: false,
      status: "FAILURE",
      errorCode: "PROMOTION_APPLICATION_FAILED",
      providerMessage: "invalid deal price",
      totalItems: 1,
      successfulItems: 0,
      failedItems: 1,
      results: [
        {
          itemId: "MLA1",
          success: false,
          stage: "APPLICATION",
          errorCode: "PROMOTION_APPLICATION_FAILED",
          providerMessage: "invalid deal price",
        },
      ],
    };
    vi.mocked(http.post).mockResolvedValue(failure);

    await expect(
      new PromotionsApiRepository(http).apply("item:MLA1", request),
    ).resolves.toEqual(failure);
  });

  it("desactiva con timeout de 120 segundos", async () => {
    const http = client();
    vi.mocked(http.delete).mockResolvedValue(result(1, 1));

    await new PromotionsApiRepository(http).remove("item:MLA1");

    expect(http.delete).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/publicacion/item%3AMLA1",
      { timeoutMs: 120_000 },
    );
  });

  it.each([
    [
      { promotionType: "DEAL", promotionId: "P1", offerId: null } as const,
      "promotionType=DEAL&promotionId=P1",
    ],
    [
      { promotionType: "SELLER_CAMPAIGN", promotionId: "S1", offerId: null } as const,
      "promotionType=SELLER_CAMPAIGN&promotionId=S1",
    ],
    [
      { promotionType: "SMART", promotionId: "P2", offerId: "O2" } as const,
      "promotionType=SMART&promotionId=P2&offerId=O2",
    ],
    [
      { promotionType: "PRICE_DISCOUNT", promotionId: null, offerId: null } as const,
      "promotionType=PRICE_DISCOUNT",
    ],
  ])("desactiva únicamente la promoción seleccionada", async (selection, query) => {
    const http = client();
    vi.mocked(http.delete).mockResolvedValue(result(1, 1));

    await new PromotionsApiRepository(http).removeSelected("item:MLA1", selection);

    expect(http.delete).toHaveBeenCalledWith(
      `/mercadolibre/direct/promociones/publicacion/item%3AMLA1?${query}`,
      { timeoutMs: 120_000 },
    );
  });

  it("usa 30 segundos para opciones", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue([]);

    await new PromotionsApiRepository(http).getOptions("MLA1");

    expect(http.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/MLA1/opciones",
      { timeoutMs: 30_000 },
    );
  });

  it.each(["WOMEN", "GIRLS"] as const)("consulta el análisis read-only con audiencia %s", async (audience) => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ done: true, nextCursor: null, count: 0, publications: [] });

    await new PromotionsApiRepository(http).getPromotionAnalysis({ promotionId: "P-1", audience, limit: 20, cursor: "next" });

    expect(http.get).toHaveBeenCalledWith(
      `/mercadolibre/direct/promociones/analysis?promotionId=P-1&limit=20&cursor=next&audience=${audience}`,
      { timeoutMs: 30_000 },
    );
  });
});

describe("PromotionsApiRepository campaigns", () => {
  it.each([undefined, "WOMEN", "GIRLS"] as const)("consulta campañas con audiencia %s y timeout normal", async (audience) => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ campaigns: [] });

    await new PromotionsApiRepository(http).getCampaigns(audience);

    const suffix = audience ? `?audience=${audience}` : "";
    expect(http.get).toHaveBeenCalledWith(
      `/mercadolibre/direct/promociones/campaigns${suffix}`,
    );
  });

  it("acepta una campaña real sin nombre", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      campaigns: [{
        id: "P-1",
        name: null,
        type: "MARKETPLACE_CAMPAIGN",
        status: "started",
        startDate: null,
        finishDate: null,
        deadlineDate: null,
      }],
    });

    await expect(new PromotionsApiRepository(http).getCampaigns()).resolves.toEqual({
      campaigns: [{
        id: "P-1",
        name: null,
        type: "MARKETPLACE_CAMPAIGN",
        status: "started",
        startDate: null,
        finishDate: null,
        deadlineDate: null,
      }],
    });
  });
  it("consulta una sola pagina de items con id y tipo de campana", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      items: [],
      paging: { total: 100, offset: 0, limit: 50 },
    });

    await new PromotionsApiRepository(http).getCampaignItems({
      promotionId: "C/1",
      promotionType: "MARKETPLACE_CAMPAIGN",
      paging: { limit: 50, offset: 0 },
    });

    expect(http.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/campaigns/C%2F1/items?promotionType=MARKETPLACE_CAMPAIGN&limit=50&offset=0",
    );
  });
});

function client() {
  return {
    get: vi.fn<AuthenticatedHttpClient["get"]>(),
    getResponse: vi.fn<AuthenticatedHttpClient["getResponse"]>(),
    post: vi.fn<AuthenticatedHttpClient["post"]>(),
    postResponse: vi.fn<AuthenticatedHttpClient["postResponse"]>(),
    patch: vi.fn<AuthenticatedHttpClient["patch"]>(),
    patchResponse: vi.fn<AuthenticatedHttpClient["patchResponse"]>(),
    delete: vi.fn<AuthenticatedHttpClient["delete"]>(),
    deleteResponse: vi.fn<AuthenticatedHttpClient["deleteResponse"]>(),
  } satisfies AuthenticatedHttpClient;
}

function preview(totalItems: number, applicableItems: number) {
  return {
    sourceKey: "family:123",
    totalItems,
    applicableItems,
    unavailableItems: totalItems - applicableItems,
    items: [],
  };
}

function result(totalItems: number, successfulItems: number) {
  return {
    success: successfulItems === totalItems,
    status: successfulItems === totalItems ? "SUCCESS" : "PARTIAL_FAILURE",
    totalItems,
    successfulItems,
    failedItems: totalItems - successfulItems,
    results: [],
  };
}
