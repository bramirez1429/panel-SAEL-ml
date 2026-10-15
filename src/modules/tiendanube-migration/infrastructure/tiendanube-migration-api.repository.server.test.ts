// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

vi.mock("server-only", () => ({}));

import { TiendanubeMigrationApiRepository } from "./tiendanube-migration-api.repository.server";

function createClient(get: AuthenticatedHttpClient["get"], post: AuthenticatedHttpClient["post"]): AuthenticatedHttpClient {
  return {
    get,
    getResponse: vi.fn(),
    post,
    postResponse: vi.fn(),
    patch: vi.fn(),
    patchResponse: vi.fn(),
    delete: vi.fn(),
    deleteResponse: vi.fn(),
  };
}

const progress = {
  jobId: "job-1",
  status: "RUNNING" as const,
  totalProducts: 10,
  processedProducts: 3,
  approvedProducts: 2,
  rejectedProducts: 1,
  currentProduct: null,
};

describe("TiendanubeMigrationApiRepository", () => {
  it("inicia la migración con el cliente autenticado", async () => {
    const post = vi.fn<AuthenticatedHttpClient["post"]>().mockResolvedValue(progress);
    const repository = new TiendanubeMigrationApiRepository(createClient(vi.fn(), post));

    await expect(repository.start()).resolves.toEqual(progress);
    expect(post).toHaveBeenCalledWith("/tiendanube/migration/global");
  });

  it("rechaza el estado que no cumple el contrato", async () => {
    const repository = new TiendanubeMigrationApiRepository(createClient(vi.fn(), vi.fn().mockResolvedValue({ jobId: "job-1" })));

    await expect(repository.start()).rejects.toBeInstanceOf(ApiError);
  });
});
