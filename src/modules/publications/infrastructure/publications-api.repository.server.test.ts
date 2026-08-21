import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import { PublicationsApiRepository } from "./publications-api.repository.server";
import { createPublicationsResponse } from "./publications-response.fixture";

describe("PublicationsApiRepository", () => {
  it("requests the verified NestJS endpoint and maps its response", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue(createPublicationsResponse());
    const repository = new PublicationsApiRepository({ get });

    await expect(repository.getPublications()).resolves.toEqual(
      expect.objectContaining({ total: 1, count: 1 }),
    );
    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/publicaciones?page=1&limit=20",
    );
  });

  it("translates an invalid payload into a controlled API error", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue({ publications: [] });
    const repository = new PublicationsApiRepository({ get });

    try {
      await repository.getPublications();
      throw new Error("Expected repository.getPublications() to reject");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError);

      if (!(error instanceof ApiError)) {
        throw error;
      }

      expect(error.code).toBe("API_INVALID_RESPONSE");
      expect(error.cause).toBeDefined();
    }
  });

  it("preserves controlled transport errors", async () => {
    const transportError = new ApiError(
      "No se pudo conectar con el backend.",
      "API_UNREACHABLE",
    );
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockRejectedValue(transportError);
    const repository = new PublicationsApiRepository({ get });

    await expect(repository.getPublications()).rejects.toBe(transportError);
  });
});
