// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";
import { TiendanubeReplicationApiRepository } from "./tiendanube-replication-api.repository.server";

const PRODUCT_ID = "123e4567-e89b-42d3-a456-426614174000";
function client() { return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn() } satisfies AuthenticatedHttpClient; }

describe("TiendanubeReplicationApiRepository", () => {
  it("consulta estados en un único batch por sourceKeys", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ items: [{ sourceKey: "item:MLA1", status: "COMPLETED", tiendanubeProductId: "10" }, { sourceKey: "family:22", status: "NOT_REPLICATED" }] });
    await new TiendanubeReplicationApiRepository(http).getStatuses(["item:MLA1", "family:22"]);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it("replica usando el UUID product_id y no item_id/family_id", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ ok: true, action: "updated", mercadolibreSourceId: PRODUCT_ID, tiendanubeProductId: "10" });
    await expect(new TiendanubeReplicationApiRepository(http).replicate(PRODUCT_ID)).resolves.toBe("updated");
    expect(http.post).toHaveBeenCalledWith(`/tiendanube/replicate/${PRODUCT_ID}`, undefined);
    expect(http.post.mock.calls[0]?.[0]).not.toContain("MLA");
    expect(http.post.mock.calls[0]?.[0]).not.toContain("family");
  });

  it("propaga un error HTTP real", async () => {
    const http = client();
    const error = new ApiError("La tienda Tiendanube no está conectada", "API_HTTP_ERROR", { status: 409 });
    vi.mocked(http.post).mockRejectedValue(error);
    await expect(new TiendanubeReplicationApiRepository(http).replicate(PRODUCT_ID)).rejects.toBe(error);
  });
});
