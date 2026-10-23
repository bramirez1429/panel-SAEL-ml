// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();

vi.mock("@/shared/api/authenticated-http-client.server", () => ({
  createAuthenticatedHttpClient: () => ({ get }),
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

describe("Tienda Negocio OAuth connect", () => {
  it("redirects to the provider and creates a secure pending cookie", async () => {
    vi.stubEnv("TIENDA_NEGOCIO_OAUTH_ORIGIN", "https://overact-scoring-unmanaged.ngrok-free.dev");
    get.mockResolvedValueOnce({ url: "https://panel.tiendanegocio.com/oauth?state=opaque" });

    const response = await GET();

    expect(response.headers.get("location")).toBe("https://panel.tiendanegocio.com/oauth?state=opaque");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("does not redirect to localhost if the public origin is missing", async () => {
    vi.stubEnv("TIENDA_NEGOCIO_OAUTH_ORIGIN", "");
    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("location")).toBeNull();
  });
});
