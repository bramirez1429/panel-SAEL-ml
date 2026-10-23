// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { TiendaNegocioApiRepository } from "./tienda-negocio-api.repository.server";

function setup(payload: unknown) {
  const get = vi.fn<AuthenticatedHttpClient["get"]>().mockResolvedValue(payload);
  const del = vi.fn<AuthenticatedHttpClient["delete"]>().mockResolvedValue(undefined);
  const client = { get, delete: del } as unknown as AuthenticatedHttpClient;
  return { repo: new TiendaNegocioApiRepository(client), get, del };
}

describe("TiendaNegocioApiRepository", () => {
  it("lee el estado desde el backend privado, sin entregar credenciales", async () => {
    const { repo, get } = setup({
      connected: true,
      storeId: "12345",
      authorizationConfigured: true,
      migrationEnabled: false,
    });
    await expect(repo.getConnection()).resolves.toEqual({
      connected: true,
      storeId: "12345",
      authorizationConfigured: true,
    });
    expect(get).toHaveBeenCalledWith("/tienda-negocio/sincronizacion/estado");
  });

  it("diferencia la configuración pendiente de una conexión disponible", async () => {
    const { repo } = setup({ connected: false, authorizationConfigured: false });
    await expect(repo.getConnection()).resolves.toEqual({
      connected: false, authorizationConfigured: false,
    });
  });

  it("rechaza datos inválidos y conserva solo la desconexión propia", async () => {
    await expect(setup({ connected: true, storeId: null, authorizationConfigured: true })
      .repo.getConnection()).rejects.toThrow();
    const { repo, del } = setup({ connected: false, authorizationConfigured: true });
    await repo.disconnect();
    expect(del).toHaveBeenCalledWith("/tienda-negocio/sincronizacion/conexion");
  });
});
