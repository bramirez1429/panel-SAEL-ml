import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { HttpResponse } from "@/shared/api/http-client.server";
import {
  mercadoLibreConnectionSchema,
  type MercadoLibreConnectionDto,
} from "./integration-response.schema";

const CONNECT_ENDPOINT = "/mercadolibre/connect";

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

  async getConnection(): Promise<MercadoLibreConnectionDto> {
    const body = await this.httpClient.get("/mercadolibre/connection");
    const parsed = mercadoLibreConnectionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "El backend devolvió un estado Mercado Libre inválido.",
        "API_INVALID_RESPONSE",
      );
    }
    return parsed.data;
  }

  async disconnect(): Promise<void> {
    await this.httpClient.delete("/mercadolibre/connection");
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
