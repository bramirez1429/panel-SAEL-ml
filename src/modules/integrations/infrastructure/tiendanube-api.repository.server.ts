import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { HttpResponse } from "@/shared/api/http-client.server";
import { tiendanubeConnectionSchema } from "./integration-response.schema";

export class TiendanubeApiRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getConnection(): Promise<{ connected: false } | { connected: true; storeId: string }> {
    const parsed = tiendanubeConnectionSchema.safeParse(await this.httpClient.get("/tiendanube/connection"));
    if (!parsed.success) throw new ApiError("El backend devolvió un estado Tiendanube inválido.", "API_INVALID_RESPONSE", { cause: parsed.error });
    return parsed.data.connected ? { connected: true, storeId: parsed.data.storeId } : { connected: false };
  }

  async getAuthorizationRequest(): Promise<{ url: string; response: HttpResponse }> {
    const response = await this.httpClient.getResponse("/tiendanube/connect");
    const body = response.body;
    if (!isRecord(body) || typeof body.url !== "string") throw new ApiError("El backend devolvió una URL de autorización inválida.", "API_INVALID_RESPONSE");
    try { return { url: new URL(body.url).toString(), response }; } catch (cause: unknown) { throw new ApiError("El backend devolvió una URL de autorización inválida.", "API_INVALID_RESPONSE", { cause }); }
  }

  async disconnect(): Promise<void> {
    await this.httpClient.delete("/tiendanube/connection");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
