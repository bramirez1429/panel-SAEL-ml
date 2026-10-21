import "server-only";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import type {
  TiendaNegocioCatalogPage,
  TiendaNegocioCatalogProduct,
  TiendaNegocioStatus,
} from "../domain/tienda-negocio.model";

const client = () => createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
const API = "/tienda-negocio/sincronizacion";

export async function getTiendaNegocioStatus(): Promise<TiendaNegocioStatus> {
  const data = await client().get(`${API}/estado`);
  if (!isObject(data) || typeof data.connected !== "boolean" ||
    typeof data.migrationEnabled !== "boolean" ||
    typeof data.stage !== "string" || typeof data.documentation !== "string") {
    throw new Error("Respuesta de conexión Tienda Negocio inválida");
  }
  return {
    connected: data.connected,
    migrationEnabled: data.migrationEnabled,
    stage: data.stage,
    documentation: data.documentation,
  };
}

export async function getTiendaNegocioCatalog(
  cursor?: string,
): Promise<TiendaNegocioCatalogPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const data = await client().get(`${API}/catalogo${query}`, { timeoutMs: 60_000 });
  if (!isObject(data) || !Array.isArray(data.products) ||
    typeof data.finished !== "boolean" ||
    (data.nextCursor !== null && typeof data.nextCursor !== "string")) {
    throw new Error("Respuesta de catálogo Tienda Negocio inválida");
  }
  return {
    products: data.products.map(parseProduct),
    nextCursor: data.nextCursor,
    finished: data.finished,
  };
}

function parseProduct(value: unknown): TiendaNegocioCatalogProduct {
  if (!isObject(value) || typeof value.sourceKey !== "string" ||
    !Array.isArray(value.mlaIds) || !value.mlaIds.every((id) => typeof id === "string") ||
    !Array.isArray(value.mlauIds) || !value.mlauIds.every((id) => typeof id === "string")) {
    throw new Error("El catálogo contiene una publicación inválida");
  }
  return {
    sourceKey: value.sourceKey,
    title: typeof value.title === "string" ? value.title : null,
    mlaIds: value.mlaIds,
    familyId: typeof value.familyId === "string" ? value.familyId : null,
    mlauIds: value.mlauIds,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
