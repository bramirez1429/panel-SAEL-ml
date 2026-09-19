// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { MercadoLibreApiRepository } from "./mercado-libre-api.repository.server";

function createRepository(body: unknown) {
  const get = vi.fn().mockResolvedValue(body);
  const httpClient = {
    get,
    getResponse: vi.fn(),
    post: vi.fn(),
    postResponse: vi.fn(),
    patch: vi.fn(),
    patchResponse: vi.fn(),
    delete: vi.fn(),
    deleteResponse: vi.fn(),
  } as unknown as AuthenticatedHttpClient;
  return { repository: new MercadoLibreApiRepository(httpClient), get };
}

describe("MercadoLibreApiRepository connection health", () => {
  it("lee una conexión operativa", async () => {
    const { repository, get } = createRepository({
      connected: true,
      reconnectRequired: false,
      sellerId: 639189394,
    });

    await expect(repository.getConnection()).resolves.toEqual({
      connected: true,
      reconnectRequired: false,
      sellerId: 639189394,
    });
    expect(get).toHaveBeenCalledWith("/mercadolibre/connection");
  });

  it("conserva el seller al informar que hace falta reconectar", async () => {
    const { repository } = createRepository({
      connected: false,
      reconnectRequired: true,
      sellerId: 639189394,
    });

    await expect(repository.getConnection()).resolves.toEqual({
      connected: false,
      reconnectRequired: true,
      sellerId: 639189394,
    });
  });

  it("mantiene compatible el estado sin conexión", async () => {
    const { repository } = createRepository({ connected: false });

    await expect(repository.getConnection()).resolves.toEqual({
      connected: false,
    });
  });
});
