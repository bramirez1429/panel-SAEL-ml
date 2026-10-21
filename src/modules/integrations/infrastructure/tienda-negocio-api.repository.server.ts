import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

type TiendaNegocioConnectionResponse = Readonly<
  | { connected: false; authorizationConfigured: boolean }
  | { connected: true; storeId: string; authorizationConfigured: boolean }
>;

export class TiendaNegocioApiRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getConnection(): Promise<TiendaNegocioConnectionResponse> {
    const data = await this.httpClient.get("/tienda-negocio/sincronizacion/estado");
    if (!isObject(data) || typeof data.connected !== "boolean" ||
      typeof data.authorizationConfigured !== "boolean") {
      throw new ApiError(
        "El backend devolvió un estado Tienda Negocio inválido.",
        "API_INVALID_RESPONSE",
      );
    }
    if (data.connected) {
      if (typeof data.storeId !== "string" || !data.storeId.trim()) {
        throw new ApiError("Falta el ID de Tienda Negocio.", "API_INVALID_RESPONSE");
      }
      return {
        connected: true,
        storeId: data.storeId,
        authorizationConfigured: data.authorizationConfigured,
      };
    }
    return { connected: false, authorizationConfigured: data.authorizationConfigured };
  }

  async disconnect(): Promise<void> {
    await this.httpClient.delete("/tienda-negocio/sincronizacion/conexion");
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
