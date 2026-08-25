// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { PublicationEditApiRepository } from "./publication-edit-api.repository.server";

function client() {
  return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn(), delete: vi.fn(), deleteResponse: vi.fn() } satisfies AuthenticatedHttpClient;
}

describe("PublicationEditApiRepository", () => {
  it("usa endpoints de familia para precio, stock y SKU", async () => {
    const http = client();
    const repo = new PublicationEditApiRepository(http);
    const target = { type: "family" as const, familyId: "F1", itemId: "MLA1" };
    await repo.updatePrice(target, 100);
    await repo.updateStock(target, 3);
    await repo.updateSku(target, "SKU");
    expect(http.patch).toHaveBeenNthCalledWith(1, "/mercadolibre/direct/edicion/nueva/F1/items/MLA1", { price: 100 });
    expect(http.patch).toHaveBeenNthCalledWith(2, "/mercadolibre/direct/edicion/nueva/F1/items/MLA1/stock", { quantity: 3 });
    expect(http.patch).toHaveBeenNthCalledWith(3, "/mercadolibre/direct/edicion/nueva/F1/items/MLA1/sku", { sku: "SKU" });
  });

  it("confirma SKU por el endpoint específico y variationId Legacy", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      model: "SHARED",
      itemId: "MLA1",
      hasVariations: true,
      variations: [{ variationId: 44, sku: "SKU-44" }],
    });
    const repo = new PublicationEditApiRepository(http);
    await expect(repo.getSku({ type: "legacy", itemId: "MLA1", variationId: 44 })).resolves.toBe("SKU-44");
    expect(http.get).toHaveBeenCalledWith("/mercadolibre/direct/edicion/clasica/MLA1/sku");
  });

  it("confirma SKU de una familia por el endpoint específico", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({
      model: "VARIANT_PRICING",
      familyId: "F1",
      itemId: "MLA1",
      userProductId: "MLAU1",
      sku: "FAMILY-SKU",
    });
    const repo = new PublicationEditApiRepository(http);
    await expect(repo.getSku({ type: "family", familyId: "F1", itemId: "MLA1" })).resolves.toBe("FAMILY-SKU");
  });

  it("envía variationId sólo para stock y SKU legacy", async () => {
    const http = client();
    const repo = new PublicationEditApiRepository(http);
    const target = { type: "legacy" as const, itemId: "MLA1", variationId: 44 };
    await repo.updatePrice(target, 100);
    await repo.updateStock(target, 3);
    await repo.updateSku(target, "SKU");
    expect(http.patch).toHaveBeenNthCalledWith(1, "/mercadolibre/direct/edicion/clasica/MLA1", { price: 100 });
    expect(http.patch).toHaveBeenNthCalledWith(2, "/mercadolibre/direct/edicion/clasica/MLA1/stock", { quantity: 3, variationId: 44 });
    expect(http.patch).toHaveBeenNthCalledWith(3, "/mercadolibre/direct/edicion/clasica/MLA1/sku", { sku: "SKU", variationId: 44 });
  });

  it("actualiza el estado del item correcto", async () => {
    const http = client();
    const repo = new PublicationEditApiRepository(http);
    await repo.updateStatus({ type: "family", familyId: "F1", itemId: "MLA2" }, "paused");
    expect(http.patch).toHaveBeenCalledWith("/mercadolibre/direct/edicion/nueva/F1/items/MLA2", { status: "paused" });
  });
});
