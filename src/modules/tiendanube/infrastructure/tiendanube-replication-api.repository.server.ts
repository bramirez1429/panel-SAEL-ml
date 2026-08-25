import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";
import type { TiendanubeReplicationState } from "../domain/tiendanube-replication.model";
import { replicationResponseSchema, statusResponseSchema } from "./tiendanube-replication-response.schema";

/** Única capa que conoce los endpoints de replicación por sourceKey. */
export class TiendanubeReplicationApiRepository implements TiendanubeReplicationRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getStatuses(sourceKeys: readonly string[]): Promise<readonly TiendanubeReplicationState[]> {
    if (sourceKeys.length === 0) return [];
    const query = new URLSearchParams({ sourceKeys: sourceKeys.join(",") });
    const parsed = statusResponseSchema.safeParse(
      await this.httpClient.get(`/tiendanube/replication/status-by-source?${query.toString()}`),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolvió estados de Tiendanube inválidos.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return parsed.data.items.map((item) => ({
      sourceKey: item.sourceKey,
      status: item.status,
      tiendanubeProductId: item.tiendanubeProductId ?? null,
    }));
  }

  async replicate(sourceKey: string): Promise<void> {
    const parsed = replicationResponseSchema.safeParse(
      await this.httpClient.post("/tiendanube/replication/mercadolibre/source", { sourceKey }),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolvió una respuesta inválida al replicar.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
  }
}
