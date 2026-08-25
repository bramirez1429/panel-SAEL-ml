// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({ getAccessToken: vi.fn() }));

import { getAccessToken } from "@/modules/auth/infrastructure/session/auth-session.server";
import { createAuthenticatedHttpClient } from "./authenticated-http-client.server";

function dependencies() {
  return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn(), delete: vi.fn(), deleteResponse: vi.fn() };
}

describe("createAuthenticatedHttpClient", () => {
  it("agrega Bearer a requests privados", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("access-jwt");
    const deps = dependencies();
    const client = createAuthenticatedHttpClient(deps);
    await client.get("/private");
    expect(deps.get).toHaveBeenCalledWith("/private", { bearerToken: "access-jwt" });
  });

  it("agrega Bearer también a mutaciones PATCH", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("edit-jwt");
    const deps = dependencies();
    const client = createAuthenticatedHttpClient(deps);
    await client.patch("/private/edit", { price: 10 });
    expect(deps.patch).toHaveBeenCalledWith("/private/edit", { price: 10 }, { bearerToken: "edit-jwt" });
  });

  it("rechaza requests cuando no existe sesión", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);
    const deps = dependencies();
    const client = createAuthenticatedHttpClient(deps);
    await expect(client.get("/private")).rejects.toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
    expect(deps.get).not.toHaveBeenCalled();
  });

  it("autentica publicaciones agrupadas y OAuth", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("private-jwt");
    const deps = dependencies();
    const client = createAuthenticatedHttpClient(deps);
    await client.get("/mercadolibre/direct/publicaciones/agrupadas?limit=20");
    await client.get("/mercadolibre/connect");
    expect(deps.get).toHaveBeenNthCalledWith(1, "/mercadolibre/direct/publicaciones/agrupadas?limit=20", { bearerToken: "private-jwt" });
    expect(deps.get).toHaveBeenNthCalledWith(2, "/mercadolibre/connect", { bearerToken: "private-jwt" });
  });
});
