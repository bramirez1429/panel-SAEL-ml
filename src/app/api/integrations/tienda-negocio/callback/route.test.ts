// @vitest-environment node

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("@/shared/api/authenticated-http-client.server", () => ({
  createAuthenticatedHttpClient: () => ({ post }),
}));
vi.mock("@/shared/api/http-client.server", () => ({
  HttpClient: class {},
}));
vi.mock("@/shared/api/api-config", () => ({ getApiConfig: () => ({}) }));

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Tienda Negocio OAuth callback", () => {
  it("redirects to the configured public origin after a successful exchange", async () => {
    vi.stubEnv("TIENDA_NEGOCIO_OAUTH_ORIGIN", "https://overact-scoring-unmanaged.ngrok-free.dev");
    post.mockResolvedValueOnce({});

    const response = await GET(new NextRequest(
      "https://overact-scoring-unmanaged.ngrok-free.dev/api/integrations/tienda-negocio/callback?code=opaque",
      { headers: { cookie: "tn_oauth_pending=123e4567-e89b-12d3-a456-426614174000" } },
    ));

    expect(response.headers.get("location")).toBe("https://overact-scoring-unmanaged.ngrok-free.dev/integraciones?tiendaNegocio=connected");
    expect(post).toHaveBeenCalledWith("/tienda-negocio/sincronizacion/conexion/completar", { code: "opaque" });
    expect(response.headers.get("set-cookie")).toContain("tn_oauth_pending=");
  });

  it("does not call the backend without the pending OAuth cookie", async () => {
    vi.stubEnv("TIENDA_NEGOCIO_OAUTH_ORIGIN", "https://overact-scoring-unmanaged.ngrok-free.dev");

    const response = await GET(new NextRequest(
      "https://overact-scoring-unmanaged.ngrok-free.dev/api/integrations/tienda-negocio/callback?code=opaque",
    ));

    expect(post).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("tiendaNegocio=error&reason=session");
  });
});
