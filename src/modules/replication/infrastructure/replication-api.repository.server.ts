import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { ReplicationRepository } from "../domain/replication.repository";
import type { ReplicablePublication, ReplicationPreview, ReplicationVisitsProduct, ReplicationVisitsResult } from "../domain/replication.model";
import { replicationListResponseSchema, replicationPreviewResponseSchema, replicationVisitsResponseSchema } from "./replication.schema";

export class ReplicationApiRepository implements ReplicationRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getReplicablePublications(): Promise<readonly ReplicablePublication[]> {
    const parsed = replicationListResponseSchema.safeParse(
      await this.httpClient.get(
        "/mercadolibre/direct/replicar",
        { timeoutMs: 120_000 },
      ),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolvió publicaciones para replicar inválidas.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return parsed.data.map((item) => ({
      sourceKey: item.sourceKey,
      title: item.title ?? "Sin título",
      sold: item.sold,
      itemIds: item.itemIds ?? (item.itemId ? [item.itemId] : []),
      priceFrom: item.priceFrom,
      priceTo: item.priceTo,
      currency: item.currency,
      thumbnailUrl: item.thumbnailUrl ?? item.thumbnail ?? null,
      familyId: item.familyId ?? null,
      itemId: item.itemId ?? null,
      userProductId: item.userProductId ?? null,
      type: item.type,
    }));
  }

  async getVisits(products: readonly ReplicationVisitsProduct[]): Promise<readonly ReplicationVisitsResult[]> {
    const parsed = replicationVisitsResponseSchema.safeParse(
      await this.httpClient.post(
        "/mercadolibre/direct/replicar/visitas",
        { days: 30, products },
        { timeoutMs: 120_000 },
      ),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolviÃ³ visitas para replicar invÃ¡lidas.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return parsed.data.items;
  }

  async getPreviewBySource(sourceKey: string): Promise<ReplicationPreview> {
    const query = new URLSearchParams({ sourceKey });
    const parsed = replicationPreviewResponseSchema.safeParse(
      await this.httpClient.get(`/tiendanube/replication/preview-by-source?${query.toString()}`),
    );
    if (!parsed.success) {
      throw new ApiError("El backend devolvió un preview de réplica inválido.", "API_INVALID_RESPONSE", { cause: parsed.error });
    }
    return {
      sourceKey: parsed.data.sourceKey,
      title: parsed.data.title ?? "Sin título",
      thumbnailUrl: parsed.data.thumbnailUrl ?? parsed.data.thumbnail ?? null,
      priceFrom: parsed.data.priceFrom ?? null,
      priceTo: parsed.data.priceTo ?? null,
      currency: parsed.data.currency ?? null,
      tags: parsed.data.tags ?? [],
    };
  }
}
