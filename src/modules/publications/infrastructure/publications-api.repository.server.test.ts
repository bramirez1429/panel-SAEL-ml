import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import {
  familyDetailResponse,
  familyPublicationDetailResponse,
} from "./publication-detail-response.fixture";
import { PublicationsApiRepository } from "./publications-api.repository.server";
import { createPublicationsResponse } from "./publications-response.fixture";

describe("PublicationsApiRepository", () => {
  it("requests the active grouped NestJS endpoint with its cursor", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue(createPublicationsResponse());
    const repository = new PublicationsApiRepository({ get });

    await expect(
      repository.getPublications({ pageSize: 20, cursor: "cursor-2" }),
    ).resolves.toEqual(expect.objectContaining({ productsCount: 1, count: 1 }));
    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicaciones/agrupadas?limit=20&cursor=cursor-2",
    );
  });

  it("translates an invalid payload into a controlled API error", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue({ publications: [] });
    const repository = new PublicationsApiRepository({ get });

    try {
      await repository.getPublications({ pageSize: 20, cursor: null });
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

    await expect(
      repository.getPublications({ pageSize: 20, cursor: null }),
    ).rejects.toBe(transportError);
  });

  it("requests the verified detail endpoint using the internal UUID", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockImplementation(async (path) =>
      path.includes("/familias/")
        ? familyDetailResponse
        : familyPublicationDetailResponse,
    );
    const repository = new PublicationsApiRepository({ get });

    await expect(
      repository.getById("MLA200"),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "MLA200",
        sold: 7,
        group: expect.objectContaining({ childrenCount: 2 }),
      }),
    );
    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicaciones/MLA200",
    );
    expect(get).toHaveBeenCalledWith("/mercadolibre/direct/familias/200");
  });

  it("preserves the HTTP 404 so presentation can render not-found", async () => {
    const notFoundError = new ApiError(
      "El backend respondió con HTTP 404.",
      "API_HTTP_ERROR",
      { status: 404 },
    );
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockRejectedValue(notFoundError);
    const repository = new PublicationsApiRepository({ get });

    await expect(
      repository.getById("11111111-1111-4111-8111-111111111111"),
    ).rejects.toBe(notFoundError);
  });

  it("translates an invalid detail payload into a controlled API error", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue({ product: { id: "invalid" } });
    const repository = new PublicationsApiRepository({ get });

    await expect(
      repository.getById("11111111-1111-4111-8111-111111111111"),
    ).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });
});
