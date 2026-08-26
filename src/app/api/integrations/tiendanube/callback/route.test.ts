// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const getResponse = vi.fn();
vi.mock("@/shared/api/http-client.server", () => ({
  HttpClient: class {
    getResponse = getResponse;
  },
}));
vi.mock("@/shared/api/api-config", () => ({ getApiConfig: () => ({ baseUrl: "https://backend.test", timeoutMs: 1000 }) }));

import { GET } from "./route";

function request(url: string, cookie?: string): Request {
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

describe("Tiendanube OAuth callback proxy", () => {
  it("reenvía la cookie original y redirige al completar", async () => {
    getResponse.mockResolvedValueOnce({ body: { ok: true }, headers: new Headers({ "set-cookie": "tn_oauth=; Path=/; Max-Age=0" }) });
    const response = await GET(request("http://localhost/api/integrations/tiendanube/callback?code=abc&state=signed", "tn_oauth=binding"));
    expect(getResponse).toHaveBeenCalledWith("/tiendanube/callback?code=abc&state=signed", { cookieHeader: "tn_oauth=binding" });
    expect(response.headers.get("location")).toContain("/integraciones?tiendanube=connected");
    expect(response.headers.get("set-cookie")).toContain("tn_oauth=");
  });

  it("no llama al backend si falta code o state", async () => {
    getResponse.mockClear();
    const response = await GET(request("http://localhost/api/integrations/tiendanube/callback?code=abc"));
    expect(getResponse).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/integraciones?tiendanube=error");
  });

  it("oculta errores técnicos y redirige con estado de error", async () => {
    getResponse.mockRejectedValueOnce(new Error("state inválido o venció"));
    const response = await GET(request("http://localhost/api/integrations/tiendanube/callback?code=abc&state=signed", "tn_oauth=binding"));
    expect(response.headers.get("location")).toContain("/integraciones?tiendanube=error");
    expect(response.headers.get("location")).not.toContain("state inválido");
  });
});
