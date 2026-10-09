import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";

import type { MercadolibreSyncProgress } from "../domain/mercadolibre-sync.model";
import type { MercadolibreSyncRepository } from "../domain/mercadolibre-sync.repository";
import { mercadolibreActiveSyncResponseSchema, mercadolibreSyncProgressSchema } from "./mercadolibre-sync.schema";

export class MercadolibreSyncApiRepository implements MercadolibreSyncRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async start(): Promise<MercadolibreSyncProgress> {
    return this.parse(await this.httpClient.post("/mercadolibre/publicaciones/sync"));
  }

  async getStatus(syncId: string): Promise<MercadolibreSyncProgress> {
    return this.parse(await this.httpClient.get(`/mercadolibre/publicaciones/sync/${encodeURIComponent(syncId)}`));
  }

  async getActive(): Promise<MercadolibreSyncProgress | null> {
    const parsed = mercadolibreActiveSyncResponseSchema.safeParse(
      await this.httpClient.get("/mercadolibre/publicaciones/sync/active"),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolvi\u00f3 un estado de sincronizaci\u00f3n inv\u00e1lido.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return parsed.data.activeSync;
  }

  async cancel(syncId: string): Promise<MercadolibreSyncProgress> {
    return this.parse(await this.httpClient.post(`/mercadolibre/publicaciones/sync/${encodeURIComponent(syncId)}/cancel`));
  }

  private parse(response: unknown): MercadolibreSyncProgress {
    const parsed = mercadolibreSyncProgressSchema.safeParse(response);
    if (!parsed.success) {
      throw new ApiError("El backend devolvió un estado de sincronización inválido.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return parsed.data;
  }
}
