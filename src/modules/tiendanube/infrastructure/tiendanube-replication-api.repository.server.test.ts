// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { ApiError } from "@/shared/api/api-error";
import { TiendanubeReplicationApiRepository } from "./tiendanube-replication-api.repository.server";

function client() {
  return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn() } satisfies AuthenticatedHttpClient;
}

describe("TiendanubeReplicationApiRepository", () => {
  it("consulta estados en un único batch por sourceKeys", async () => {
    const http = client();
    vi.mocked(http.get).mockResolvedValue({ items: [
      { sourceKey: "item:MLA1", status: "COMPLETED", tiendanubeProductId: "10" },
      { sourceKey: "family:22", status: "NOT_REPLICATED" },
    ] });
    const result = await new TiendanubeReplicationApiRepository(http).getStatuses(["item:MLA1", "family:22"]);
    expect(result[0]?.status).toBe("COMPLETED");
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get.mock.calls[0]?.[0]).toContain("sourceKeys=item%3AMLA1%2Cfamily%3A22");
  });

  it("replica usando sourceKey item", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ ok: true, action: "updated", sourceKey: "item:MLA1", tiendanubeProductId: "10" });
    await expect(new TiendanubeReplicationApiRepository(http).replicate("item:MLA1")).resolves.toBe("updated");
    expect(http.post).toHaveBeenCalledWith("/tiendanube/replicate/source", { sourceKey: "item:MLA1" });
  });

  it("replica usando sourceKey family", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ ok: true, action: "created", sourceKey: "family:22", tiendanubeProductId: "10" });
    await expect(new TiendanubeReplicationApiRepository(http).replicate("family:22")).resolves.toBe("created");
    expect(http.post).toHaveBeenCalledWith("/tiendanube/replicate/source", { sourceKey: "family:22" });
  });

  it("propaga un error HTTP real sin convertirlo en error de contrato", async () => {
    const http = client();
    const error = new ApiError("La tienda Tiendanube no está conectada", "API_HTTP_ERROR", { status: 409 });
    vi.mocked(http.post).mockRejectedValue(error);

    await expect(new TiendanubeReplicationApiRepository(http).replicate("item:MLA1")).rejects.toBe(error);
  });
});
