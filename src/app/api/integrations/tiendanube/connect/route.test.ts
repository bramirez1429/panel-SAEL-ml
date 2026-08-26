// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const getAuthorizationRequest = vi.fn();
vi.mock("@/modules/integrations/integrations.composition.server", () => ({
  createTiendanubeApiRepository: () => ({ getAuthorizationRequest }),
}));

import { GET } from "./route";

describe("Tiendanube OAuth connect route", () => {
  it("reenvía Set-Cookie y redirige al proveedor", async () => {
    getAuthorizationRequest.mockResolvedValueOnce({
      url: "https://tiendanube.test/oauth?state=signed",
      response: { body: {}, headers: new Headers({ "set-cookie": "tn_oauth=binding; HttpOnly; Path=/" }) },
    });
    const response = await GET();
    expect(response.headers.get("location")).toBe("https://tiendanube.test/oauth?state=signed");
    expect(response.headers.get("set-cookie")).toContain("tn_oauth=binding");
  });
});
