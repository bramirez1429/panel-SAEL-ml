import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { TiendanubeReplicationRepository } from "../domain/tiendanube-replication.repository";
import type { TiendanubeCategory, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";
import { categoriesResponseSchema, replicationResponseSchema, statusResponseSchema } from "./tiendanube-replication-response.schema";

/** Única capa que conoce los endpoints Tiendanube; nunca expone credenciales al navegador. */
export class TiendanubeReplicationApiRepository implements TiendanubeReplicationRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getStatuses(sourceKeys: readonly string[]): Promise<readonly TiendanubeReplicationState[]> {
    if (sourceKeys.length === 0) return [];
    const query = new URLSearchParams({ sourceKeys: sourceKeys.join(",") });
    const parsed = statusResponseSchema.safeParse(await this.httpClient.get(`/tiendanube/replication/status-by-source?${query.toString()}`));
    if (!parsed.success) throw new ApiError("El backend devolvió estados de Tiendanube inválidos.", "API_INVALID_RESPONSE", { cause: parsed.error });
    return parsed.data.items.map((item) => ({ sourceKey: item.sourceKey, status: item.status, tiendanubeProductId: item.tiendanubeProductId ?? null }));
  }

  async replicate(sourceKey: string, options: import("../domain/tiendanube-replication.model").ReplicationOptions) {
    const parsed = replicationResponseSchema.safeParse(await this.httpClient.post("/tiendanube/replicate/source", { sourceKey, options }, { timeoutMs: 120_000 }));
    if (!parsed.success) throw new ApiError("El backend devolvió una respuesta inválida al replicar.", "API_INVALID_RESPONSE", { cause: parsed.error });
    return parsed.data.action;
  }

  async getCategories(): Promise<readonly TiendanubeCategory[]> {
    const parsed = categoriesResponseSchema.safeParse(await this.httpClient.get("/tiendanube/categories"));
    if (!parsed.success) throw new ApiError("El backend devolvió categorías inválidas.", "API_INVALID_RESPONSE", { cause: parsed.error });
    return parsed.data.items;
  }
}
