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

  it("desactiva con timeout de 120 segundos", async () => {
    const http = client();
    vi.mocked(http.delete).mockResolvedValue(result(1, 1));

    await new PromotionsApiRepository(http).remove("item:MLA1");

    expect(http.delete).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/publicacion/item%3AMLA1",
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
  it("consulta campañas sin audiencia y con timeout normal", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ campaigns: [] });

    await new PromotionsApiRepository(http).getCampaigns();

    expect(http.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/promociones/campaigns",
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
