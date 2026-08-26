// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";
import { TiendanubeReplicationApiRepository } from "./tiendanube-replication-api.repository.server";

function client() {
  return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn(), delete: vi.fn(), deleteResponse: vi.fn() } satisfies AuthenticatedHttpClient;
}

describe("TiendanubeReplicationApiRepository", () => {
  it("consulta estados en un único batch por sourceKeys", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ items: [{ sourceKey: "item:MLA1", status: "COMPLETED", tiendanubeProductId: "10" }, { sourceKey: "family:22", status: "NOT_REPLICATED" }] });
    await new TiendanubeReplicationApiRepository(http).getStatuses(["item:MLA1", "family:22"]);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["item:MLA1", "created"],
    ["family:22", "updated"],
  ] as const)("replica %s en el endpoint source con body exacto", async (sourceKey, action) => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ ok: true, action, sourceKey, tiendanubeProductId: "10" });

    const options = { priceMode: "KEEP_SOURCE" as const, categoryId: 10 };
    await expect(new TiendanubeReplicationApiRepository(http).replicate(sourceKey, options)).resolves.toBe(action);
    expect(http.post).toHaveBeenCalledWith("/tiendanube/replicate/source", { sourceKey, options }, { timeoutMs: 120_000 });
    expect(http.post.mock.calls[0]?.[0]).not.toMatch(/\/replicate\/[0-9a-f-]+$/i);
  });

  it("propaga un error HTTP real", async () => {
    const http = client();
    const error = new ApiError("La tienda Tiendanube no está conectada", "API_HTTP_ERROR", { status: 409 });
    vi.mocked(http.post).mockRejectedValue(error);
    await expect(new TiendanubeReplicationApiRepository(http).replicate("item:MLA1", { priceMode: "KEEP_SOURCE", categoryId: 10 })).rejects.toBe(error);
  });
});
