// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({
  getAccessToken: vi.fn(),
}));

import { getAccessToken } from "@/modules/auth/infrastructure/session/auth-session.server";

import { createAuthenticatedHttpClient } from "./authenticated-http-client.server";

describe("createAuthenticatedHttpClient", () => {
  it("lee la cookie server-side y agrega Bearer a requests privados", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("access-jwt");
    const get = vi.fn().mockResolvedValue({ ok: true });
    const client = createAuthenticatedHttpClient({
      get,
      getResponse: vi.fn(),
      post: vi.fn(),
      postResponse: vi.fn(),
    });

    await client.get("/private");

    expect(get).toHaveBeenCalledWith("/private", {
      bearerToken: "access-jwt",
    });
  });

  it("autentica el endpoint privado agrupado de publicaciones", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("publication-access-jwt");
    const get = vi.fn().mockResolvedValue({ products: [] });
    const client = createAuthenticatedHttpClient({
      get,
      getResponse: vi.fn(),
      post: vi.fn(),
      postResponse: vi.fn(),
    });

    await client.get("/mercadolibre/direct/publicaciones/agrupadas?limit=20");

    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicaciones/agrupadas?limit=20",
      { bearerToken: "publication-access-jwt" },
    );
  });

  it("autentica el inicio OAuth de Mercado Libre", async () => {
    vi.mocked(getAccessToken).mockResolvedValue("oauth-access-jwt");
    const get = vi.fn().mockResolvedValue({ url: "https://ml.example/authorize" });
    const client = createAuthenticatedHttpClient({
      get,
      getResponse: vi.fn(),
      post: vi.fn(),
      postResponse: vi.fn(),
    });

    await client.get("/mercadolibre/connect");

    expect(get).toHaveBeenCalledWith("/mercadolibre/connect", {
      bearerToken: "oauth-access-jwt",
    });
  });

  it("rechaza requests privados cuando no existe sesión", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);
    const get = vi.fn();
    const client = createAuthenticatedHttpClient({
      get,
      getResponse: vi.fn(),
      post: vi.fn(),
      postResponse: vi.fn(),
    });

    await expect(client.get("/private")).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(get).not.toHaveBeenCalled();
  });
});
