// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  create: vi.fn(),
  remove: vi.fn(),
  getAccess: vi.fn(),
  getRefresh: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: session.redirect }));
vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({
  createSession: session.create,
  deleteSession: session.remove,
  getAccessToken: session.getAccess,
  getRefreshToken: session.getRefresh,
}));

import { ApiError } from "./api-error";
import { createAuthenticatedHttpClient } from "./authenticated-http-client.server";

const refreshedSession = {
  accessToken: "new-access-jwt",
  accessTokenExpiresAt: "2026-09-11T15:15:00.000Z",
  refreshToken: "rotated-refresh-jwt",
  refreshTokenExpiresAt: "2026-09-12T15:00:00.000Z",
};

function dependencies() {
  return { get: vi.fn(), getResponse: vi.fn(), post: vi.fn(), postResponse: vi.fn(), patch: vi.fn(), patchResponse: vi.fn(), delete: vi.fn(), deleteResponse: vi.fn() };
}

function unauthorized(body: unknown = { code: "AUTHENTICATION_REQUIRED" }): ApiError {
  return new ApiError("Sesión vencida", "API_HTTP_ERROR", { status: 401, responseBody: body });
}

describe("createAuthenticatedHttpClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.getAccess.mockResolvedValue("access-jwt");
    session.getRefresh.mockResolvedValue("refresh-jwt");
    session.create.mockResolvedValue(undefined);
    session.remove.mockResolvedValue(undefined);
  });

  it("agrega Bearer a requests privados", async () => {
    const deps = dependencies();
    deps.get.mockResolvedValue({ ok: true });
    const client = createAuthenticatedHttpClient(deps);
    await client.get("/private");
    expect(deps.get).toHaveBeenCalledWith("/private", { bearerToken: "access-jwt" });
  });

  it("ejecuta el flujo 401 → refresh → retry con los tokens rotados", async () => {
    const deps = dependencies();
    deps.get.mockRejectedValueOnce(unauthorized()).mockResolvedValueOnce({ publications: [] });
    deps.post.mockResolvedValue(refreshedSession);
    const client = createAuthenticatedHttpClient(deps);

    await expect(client.get("/mercadolibre/publicaciones")).resolves.toEqual({ publications: [] });

    expect(deps.post).toHaveBeenCalledOnce();
    expect(deps.post).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-jwt" }, { credentials: "include" });
    expect(deps.get).toHaveBeenNthCalledWith(1, "/mercadolibre/publicaciones", { bearerToken: "access-jwt" });
    expect(deps.get).toHaveBeenNthCalledWith(2, "/mercadolibre/publicaciones", { bearerToken: "new-access-jwt" });
    expect(session.create).toHaveBeenCalledWith({
      accessToken: "new-access-jwt",
      accessTokenExpiresAt: new Date(refreshedSession.accessTokenExpiresAt),
      refreshToken: "rotated-refresh-jwt",
      refreshTokenExpiresAt: new Date(refreshedSession.refreshTokenExpiresAt),
    });
  });

  it("renueva ante AUTHENTICATION_REQUIRED aunque no haya access cookie", async () => {
    session.getAccess.mockResolvedValue(null);
    session.getRefresh.mockResolvedValue("refresh-without-access");
    const deps = dependencies();
    deps.post.mockResolvedValue(refreshedSession);
    deps.get.mockResolvedValue({ ok: true });

    await expect(createAuthenticatedHttpClient(deps).get("/private")).resolves.toEqual({ ok: true });
    expect(deps.get).toHaveBeenCalledOnce();
    expect(deps.get).toHaveBeenCalledWith("/private", { bearerToken: "new-access-jwt" });
  });

  it("detecta AUTHENTICATION_REQUIRED informado en el cuerpo del backend", async () => {
    session.getRefresh.mockResolvedValue("body-code-refresh-jwt");
    const deps = dependencies();
    deps.get.mockRejectedValueOnce(new ApiError("Sesión requerida", "API_HTTP_ERROR", {
      status: 403,
      responseBody: { code: "AUTHENTICATION_REQUIRED" },
    })).mockResolvedValueOnce({ ok: true });
    deps.post.mockResolvedValue(refreshedSession);

    await expect(createAuthenticatedHttpClient(deps).get("/private")).resolves.toEqual({ ok: true });
    expect(deps.post).toHaveBeenCalledOnce();
    expect(deps.get).toHaveBeenCalledTimes(2);
  });

  it("comparte un único refresh entre requests simultáneas", async () => {
    session.getRefresh.mockResolvedValue("shared-refresh-jwt");
    const deps = dependencies();
    deps.get.mockImplementation(async (_path, options) => {
      if (options?.bearerToken === "access-jwt") throw unauthorized();
      return { ok: true };
    });
    let resolveRefresh: ((value: typeof refreshedSession) => void) | undefined;
    deps.post.mockImplementation(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    const client = createAuthenticatedHttpClient(deps);

    const requests = Array.from({ length: 5 }, (_, index) => client.get(`/private/${index}`));
    await vi.waitFor(() => expect(deps.post).toHaveBeenCalledOnce());
    resolveRefresh?.(refreshedSession);

    await expect(Promise.all(requests)).resolves.toEqual(Array(5).fill({ ok: true }));
    expect(deps.post).toHaveBeenCalledOnce();
  });

  it("no entra en loop cuando el retry también devuelve 401", async () => {
    session.getRefresh.mockResolvedValue("single-retry-refresh-jwt");
    const deps = dependencies();
    deps.get.mockRejectedValue(unauthorized());
    deps.post.mockResolvedValue(refreshedSession);

    await expect(createAuthenticatedHttpClient(deps).get("/private")).rejects.toThrow("REDIRECT:/login");
    expect(deps.get).toHaveBeenCalledTimes(2);
    expect(deps.post).toHaveBeenCalledOnce();
    expect(session.remove).toHaveBeenCalledOnce();
    expect(session.redirect).toHaveBeenCalledOnce();
  });

  it("limpia la sesión y redirige si falla /auth/refresh", async () => {
    session.getRefresh.mockResolvedValue("failed-refresh-jwt");
    const deps = dependencies();
    deps.get.mockRejectedValue(unauthorized());
    deps.post.mockRejectedValue(new ApiError("Refresh vencido", "API_HTTP_ERROR", { status: 401 }));

    await expect(createAuthenticatedHttpClient(deps).get("/private")).rejects.toThrow("REDIRECT:/login");
    expect(deps.post).toHaveBeenCalledOnce();
    expect(deps.get).toHaveBeenCalledOnce();
    expect(session.remove).toHaveBeenCalledOnce();
  });

  it("propaga timeout en DELETE sin permitir reemplazar el bearer", async () => {
    const deps = dependencies();
    deps.delete.mockResolvedValue(undefined);
    const client = createAuthenticatedHttpClient(deps);
    await client.delete("/private/remove", { timeoutMs: 120_000, ...({ bearerToken: "caller-jwt" } as unknown as object) });
    expect(deps.delete).toHaveBeenCalledWith("/private/remove", { timeoutMs: 120_000, bearerToken: "access-jwt" });
  });
});
