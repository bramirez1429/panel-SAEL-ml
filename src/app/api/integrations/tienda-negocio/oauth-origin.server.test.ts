// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getTiendaNegocioOAuthOrigin } from "./oauth-origin.server";

describe("Tienda Negocio OAuth origin", () => {
  it("uses only a configured HTTPS origin", () => {
    expect(getTiendaNegocioOAuthOrigin({
      TIENDA_NEGOCIO_OAUTH_ORIGIN: "https://overact-scoring-unmanaged.ngrok-free.dev/",
    })).toBe("https://overact-scoring-unmanaged.ngrok-free.dev");
  });

  it("rejects local, non-HTTPS and path-based origins", () => {
    expect(() => getTiendaNegocioOAuthOrigin({})).toThrow();
    expect(() => getTiendaNegocioOAuthOrigin({ TIENDA_NEGOCIO_OAUTH_ORIGIN: "http://localhost:3000" })).toThrow();
    expect(() => getTiendaNegocioOAuthOrigin({ TIENDA_NEGOCIO_OAUTH_ORIGIN: "https://example.com/base" })).toThrow();
  });
});
