import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { HttpGetClient, HttpPostClient } from "@/shared/api/http-client.server";
import { BulkStockApiRepository } from "./bulk-stock-api.repository.server";

describe("BulkStockApiRepository preview", () => {
  it("envía exactamente productType y quantity, incluyendo cero", async () => {
    const post = vi.fn<HttpPostClient["post"]>().mockResolvedValue(previewResponse);
    const get = vi.fn<HttpGetClient["get"]>();
    const repository = new BulkStockApiRepository({ get, post });
    const request = {
      productType: "BUZO_MUJER" as const,
      sizes: [
        { size: "40", quantity: 0 },
        { size: "42", quantity: 3 },
      ],
    };

    await expect(repository.preview(request)).resolves.toMatchObject({
      summary: { found: 2, editable: 2 },
      variants: [
        { key: "MLAU1", currentStock: 2, newStock: 0 },
        { key: "MLA2:22", currentStock: 0, newStock: 3 },
      ],
    });
    expect(post).toHaveBeenCalledWith(
      "/mercadolibre/direct/stock-bulk/preview",
      request,
      { timeoutMs: 60_000 },
    );
  });

  it("envía cuatro targets seleccionados con modelos mezclados y requestedQuantity cero", async () => {
    const post = vi.fn<HttpPostClient["post"]>().mockResolvedValue({
      jobId: "job-4",
      status: "QUEUED",
      totalItems: 4,
    });
    const get = vi.fn<HttpGetClient["get"]>();
    const repository = new BulkStockApiRepository({ get, post });
    const targets = [
      createTarget("MLAU1", "USER_PRODUCT", 0, "active"),
      createTarget("MLAU2", "USER_PRODUCT", 3, "paused"),
      createTarget("MLA3:7", "LEGACY", 0, "paused"),
      createTarget("MLA4:8", "LEGACY", 2, "active"),
    ];

    await expect(repository.createJob({ targets })).resolves.toEqual({ jobId: "job-4" });
    expect(post).toHaveBeenCalledWith(
      "/mercadolibre/direct/stock-bulk/jobs",
      { targets },
      { timeoutMs: 60_000 },
    );
  });

  it("rechaza una respuesta que no cumple el contrato del preview", async () => {
    const post = vi.fn<HttpPostClient["post"]>().mockResolvedValue({ results: [] });
    const get = vi.fn<HttpGetClient["get"]>();
    const repository = new BulkStockApiRepository({ get, post });

    await expect(repository.preview({
      productType: "BUZO_MUJER",
      sizes: [{ size: "40", quantity: 0 }],
    })).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });
});

const previewResponse = {
  productType: "BUZO_MUJER",
  results: [
    {
      identifier: "MLAU1",
      title: "Brooklyn",
      color: "Negro",
      size: "40",
      itemId: "MLA1",
      userProductId: "MLAU1",
      variationId: null,
      familyId: "1",
      model: "USER_PRODUCT",
      currentQuantity: 2,
      requestedQuantity: 0,
      currentStatus: "active",
      needsChange: true,
      editable: true,
    },
    {
      identifier: "MLA2:22",
      title: "Brooklyn",
      color: "Crema",
      size: "42",
      itemId: "MLA2",
      userProductId: null,
      variationId: "22",
      familyId: null,
      model: "LEGACY",
      currentQuantity: 0,
      requestedQuantity: 3,
      currentStatus: "paused",
      needsChange: true,
      editable: true,
    },
  ],
  summary: {
    totalFound: 2,
    editable: 2,
    unchanged: 0,
    active: 1,
    paused: 1,
    outOfStock: 1,
    userProduct: 1,
    legacy: 1,
  },
};

function createTarget(
  identifier: string,
  model: "USER_PRODUCT" | "LEGACY",
  requestedQuantity: number,
  currentStatus: string,
) {
  const userProduct = model === "USER_PRODUCT";
  return {
    identifier,
    title: "Brooklyn",
    color: userProduct ? "Negro" : "Crema",
    size: "40",
    itemId: `MLA${identifier.replace(/\D/g, "").slice(0, 1) || "1"}`,
    userProductId: userProduct ? `MLAU${identifier.replace(/\D/g, "").slice(0, 1) || "1"}` : null,
    variationId: userProduct ? null : identifier.split(":")[1] ?? null,
    familyId: userProduct ? "1" : null,
    model,
    currentQuantity: 1,
    requestedQuantity,
    currentStatus,
    needsChange: true,
    editable: true,
  } as const;
}
