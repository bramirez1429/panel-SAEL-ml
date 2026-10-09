// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

vi.mock("server-only", () => ({}));

import { MercadolibreSyncApiRepository } from "./mercadolibre-sync-api.repository.server";

const activeSync = {
  ok: true,
  syncId: "sync-1",
  status: "RUNNING",
  totalItems: 10,
  processedItems: 4,
  productsSaved: 3,
  childrenSaved: 2,
  errorsCount: 0,
  lastError: null,
  hasMore: true,
};

function createHttpClient(get: AuthenticatedHttpClient["get"]): AuthenticatedHttpClient {
  return {
    get,
    getResponse: vi.fn(),
    post: vi.fn(),
    postResponse: vi.fn(),
    patch: vi.fn(),
    patchResponse: vi.fn(),
    delete: vi.fn(),
    deleteResponse: vi.fn(),
  };
}

describe("MercadolibreSyncApiRepository.getActive", () => {
  it("normaliza activeSync cuando existe un job activo", async () => {
    const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue({ activeSync });
    const repository = new MercadolibreSyncApiRepository(createHttpClient(get));

    await expect(repository.getActive()).resolves.toEqual(activeSync);
    expect(get).toHaveBeenCalledWith("/mercadolibre/publicaciones/sync/active");
  });

  it("devuelve null cuando activeSync es null", async () => {
    const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue({ activeSync: null });
    const repository = new MercadolibreSyncApiRepository(createHttpClient(get));

    await expect(repository.getActive()).resolves.toBeNull();
  });

  it("rechaza una respuesta que no cumple el contrato", async () => {
    const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue({ activeSync: {} });
    const repository = new MercadolibreSyncApiRepository(createHttpClient(get));

    await expect(repository.getActive()).rejects.toBeInstanceOf(ApiError);
  });
});
