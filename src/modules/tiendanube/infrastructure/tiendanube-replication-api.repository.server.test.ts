// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
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

  it("replica usando sólo sourceKey", async () => {
    const http = client();
    vi.mocked(http.post).mockResolvedValue({ ok: true, alreadyReplicated: false, tiendanubeProductId: "10" });
    await new TiendanubeReplicationApiRepository(http).replicate("item:MLA1");
    expect(http.post).toHaveBeenCalledWith("/tiendanube/replication/mercadolibre/source", { sourceKey: "item:MLA1" });
  });
});
