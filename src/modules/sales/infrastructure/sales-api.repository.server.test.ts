// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";

vi.mock("server-only", () => ({}));

import { SalesApiRepository } from "./sales-api.repository.server";

function createHttp(post: AuthenticatedHttpClient["post"]): AuthenticatedHttpClient {
  return { post } as AuthenticatedHttpClient;
}

describe("SalesApiRepository.sync", () => {
  it("llama POST /sales/sync con las horas y el timeout esperado", async () => {
    const response = {
      hours: 48,
      mercadoLibre: { found: 3, processed: 2, failed: 1 },
    };
    const post = vi.fn<AuthenticatedHttpClient["post"]>().mockResolvedValue(response);
    const repository = new SalesApiRepository(createHttp(post));

    await expect(repository.sync(48)).resolves.toEqual(response);
    expect(post).toHaveBeenCalledWith(
      "/sales/sync?hours=48",
      undefined,
      { timeoutMs: 60_000 },
    );
  });

  it("preserva el ApiError y su status cuando falla el endpoint", async () => {
    const syncError = new ApiError("Sync failed", "API_HTTP_ERROR", { status: 500 });
    const post = vi.fn<AuthenticatedHttpClient["post"]>().mockRejectedValue(syncError);
    const repository = new SalesApiRepository(createHttp(post));

    await expect(repository.sync(48)).rejects.toBe(syncError);
    expect(syncError.status).toBe(500);
  });
});
