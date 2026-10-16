// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { TiendanubeBulkEditApiRepository } from "./tiendanube-bulk-edit-api.repository.server";

function client(): AuthenticatedHttpClient {
  return {
    get: vi.fn(),
    getResponse: vi.fn(),
    post: vi.fn(),
    postResponse: vi.fn(),
    patch: vi.fn(),
    patchResponse: vi.fn(),
    delete: vi.fn(),
    deleteResponse: vi.fn(),
  };
}

describe("TiendanubeBulkEditApiRepository", () => {
  it("consulta el resumen en el endpoint definitivo", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue(summary());

    await new TiendanubeBulkEditApiRepository(http).getCategorySummary(123);

    expect(http.get).toHaveBeenCalledWith("/tiendanube/bulk-edition/categories/123/summary");
  });

  it("envía los cambios anidados al solicitar la previsualización", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue(preview());
    const request = { categoryId: "123", changes: { price: "36499", promotionalPrice: "31024", stock: 3 } };

    await new TiendanubeBulkEditApiRepository(http).preview(request);

    expect(http.post).toHaveBeenCalledWith("/tiendanube/bulk-edition/preview", request);
  });

  it("inicia el trabajo con snapshotId y consulta el progreso real", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ id: "job-1" });
    vi.mocked(http.get).mockResolvedValue(job());
    const repository = new TiendanubeBulkEditApiRepository(http);

    await repository.createJob("preview-1");

    expect(http.post).toHaveBeenCalledWith("/tiendanube/bulk-edition/jobs", { snapshotId: "preview-1" });
    expect(http.get).toHaveBeenCalledWith("/tiendanube/bulk-edition/jobs/job-1");
  });

  it("consulta los fallidos en su endpoint separado", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue([failure()]);

    await new TiendanubeBulkEditApiRepository(http).getFailures("job-1");

    expect(http.get).toHaveBeenCalledWith("/tiendanube/bulk-edition/jobs/job-1/failures");
  });

  it("reintenta fallidos y consulta luego el progreso real", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ id: "job-2" });
    vi.mocked(http.get).mockResolvedValue({ ...job(), id: "job-2" });

    await new TiendanubeBulkEditApiRepository(http).retryFailures("job-1");

    expect(http.post).toHaveBeenCalledWith("/tiendanube/bulk-edition/jobs/job-1/retry-failures");
    expect(http.get).toHaveBeenCalledWith("/tiendanube/bulk-edition/jobs/job-2");
  });
});

function summary() {
  return {
    categoryId: "123", productCount: 2, variantCount: 3, locations: [{ id: "01GQ2ZHK064BQRHGDB7CCV0Y6N" }],
    products: [{ id: "1001", name: "Remera básica", variants: [{ id: "501", sku: "REM-M-NEG", size: "M", color: "Negro", price: "45000.00", promotionalPrice: "31999.00", stock: 4 }] }],
  };
}

function preview() {
  return {
    ...summary(), id: "2e5ed8e3-00cb-4a26-bcec-7d7f44d21e0a", changes: { price: "36499", promotionalPrice: "31024", stock: 3 },
    preservedFields: [], incompatibilities: [], generatedAt: "2026-10-16T12:00:00.000Z", expiresAt: "2026-10-16T12:30:00.000Z",
  };
}

function job() {
  return { id: "job-1", status: "RUNNING", totalProducts: 2, totalVariants: 3, completedVariants: 1, failedVariants: 0, pendingVariants: 2 };
}

function failure() {
  return { productName: "Remera básica", productId: "1001", sku: "REM-M-NEG", variant: "M / Negro", variantId: "501", error: "Tiendanube rechazó la actualización" };
}
