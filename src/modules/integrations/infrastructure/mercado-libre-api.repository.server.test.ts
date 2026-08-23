// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import { MercadoLibreApiRepository } from "./mercado-libre-api.repository.server";

describe("MercadoLibreApiRepository", () => {
  it("inicia connect a través del cliente privado autenticado", async () => {
    const getResponse = vi
      .fn<AuthenticatedHttpClient["getResponse"]>()
      .mockResolvedValue({
        body: {
          url: "https://auth.mercadolibre.com.ar/authorization?state=signed",
        },
        headers: new Headers(),
      });
    const repository = new MercadoLibreApiRepository({
      get: vi.fn(),
      getResponse,
      post: vi.fn(),
      postResponse: vi.fn(),
      patch: vi.fn(),
      patchResponse: vi.fn(),
    } satisfies AuthenticatedHttpClient);

    await expect(repository.getAuthorizationUrl()).resolves.toContain(
      "auth.mercadolibre.com.ar",
    );
    expect(getResponse).toHaveBeenCalledWith("/mercadolibre/connect");
  });
});
