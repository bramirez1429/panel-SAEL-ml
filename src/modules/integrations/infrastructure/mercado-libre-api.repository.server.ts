import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { HttpResponse } from "@/shared/api/http-client.server";

const CONNECT_ENDPOINT = "/mercadolibre/connect";
const CONNECTION_PROBE_ENDPOINT =
  "/mercadolibre/direct/publicaciones/agrupadas?limit=1";

export class MercadoLibreApiRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getAuthorizationUrl(): Promise<string> {
    return (await this.getAuthorizationRequest()).url;
  }

  async getAuthorizationRequest(): Promise<{
    url: string;
    response: HttpResponse;
  }> {
    const response = await this.httpClient.getResponse(CONNECT_ENDPOINT);
    const body = response.body;
    if (!isObject(body) || typeof body.url !== "string") {
      throw new ApiError(
        "El backend devolvió una URL de autorización inválida.",
        "API_INVALID_RESPONSE",
      );
    }
    try {
      return { url: new URL(body.url).toString(), response };
    } catch (cause: unknown) {
      throw new ApiError(
        "El backend devolvió una URL de autorización inválida.",
        "API_INVALID_RESPONSE",
        { cause },
      );
    }
  }

  async hasConnection(): Promise<boolean> {
    try {
      await this.httpClient.get(CONNECTION_PROBE_ENDPOINT);
      return true;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      throw error;
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
