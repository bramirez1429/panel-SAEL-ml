// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

vi.mock("server-only", () => ({}));

import { TiendanubeMigrationApiRepository } from "./tiendanube-migration-api.repository.server";

function createClient(get: AuthenticatedHttpClient["get"], post: AuthenticatedHttpClient["post"]): AuthenticatedHttpClient {
  return { get, getResponse: vi.fn(), post, postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn(), delete: vi.fn(), deleteResponse: vi.fn() };
}

const progress = {
  id: "job-1",
  status: "RUNNING" as const,
  totalItems: 10,
  processedItems: 3,
  approvedItems: 2,
  rejectedItems: 1,
  currentSourceKey: "family:10",
};

const item = {
  id: "item-1",
  sourceKey: "family:10",
  title: null,
  mlaIds: ["MLA1"],
  familyId: "10",
  mlauIds: ["MLAU1"],
  status: "APPROVED" as const,
  outcome: "ALREADY_EXISTS" as const,
  tiendanubeProductId: "900",
  errorCode: null,
  errorMessage: null,
  attempts: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TiendanubeMigrationApiRepository", () => {
  it("inicia sin límite en la ruta del backend", async () => {
    const post = vi.fn<AuthenticatedHttpClient["post"]>().mockResolvedValue(progress);
    const repository = new TiendanubeMigrationApiRepository(createClient(vi.fn(), post));

    await expect(repository.start()).resolves.toEqual({ ...progress });
    expect(post).toHaveBeenCalledWith("/tiendanube/migration/start", undefined);
  });

  it("envía el límite controlado permitido", async () => {
    const post = vi.fn<AuthenticatedHttpClient["post"]>().mockResolvedValue(progress);
    const repository = new TiendanubeMigrationApiRepository(createClient(vi.fn(), post));

    await repository.start(5);

    expect(post).toHaveBeenCalledWith("/tiendanube/migration/start", { testLimit: 5 });
  });

  it("lee active como job directo o null", async () => {
    const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue(progress);
    const repository = new TiendanubeMigrationApiRepository(createClient(get, vi.fn()));

    await expect(repository.getActive()).resolves.toEqual(progress);
    expect(get).toHaveBeenCalledWith("/tiendanube/migration/active");

    get.mockResolvedValueOnce(null);
    await expect(repository.getActive()).resolves.toBeNull();
  });

  it.each(["DISCOVERING", "QUEUED", "RUNNING", "WAITING_RECONCILIATION", "PAUSED", "COMPLETED", "COMPLETED_WITH_REJECTIONS"] as const)(
    "acepta el estado %s",
    async (status) => {
      const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue({ ...progress, status });
      const repository = new TiendanubeMigrationApiRepository(createClient(get, vi.fn()));

      await expect(repository.getStatus("job/1")).resolves.toEqual({ ...progress, status });
      expect(get).toHaveBeenCalledWith("/tiendanube/migration/job%2F1");
    },
  );

  it("consulta items con status, page y limit y traduce ALREADY_EXISTS", async () => {
    const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue({ page: 1, limit: 20, total: 1, items: [item] });
    const repository = new TiendanubeMigrationApiRepository(createClient(get, vi.fn()));

    await expect(repository.getResults("job-1", "APPROVED", 1, 20)).resolves.toEqual({
      page: 1,
      limit: 20,
      total: 1,
      items: [{ ...item, action: "LINKED" }],
    });
    expect(get).toHaveBeenCalledWith("/tiendanube/migration/job-1/items?status=APPROVED&page=1&limit=20");
  });

  it("rechaza respuestas que no cumplen el contrato real", async () => {
    const repository = new TiendanubeMigrationApiRepository(createClient(vi.fn(), vi.fn().mockResolvedValue({ jobId: "job-1" })));

    await expect(repository.start()).rejects.toBeInstanceOf(ApiError);
  });
});
