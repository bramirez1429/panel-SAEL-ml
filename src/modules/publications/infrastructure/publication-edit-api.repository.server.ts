import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type {
  PublicationEditRepository,
  PublicationEditTarget,
} from "../domain/publication-edit.repository";

/** Único adaptador que conoce los endpoints reales de edición de NestJS. */
export class PublicationEditApiRepository implements PublicationEditRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async updatePrice(target: PublicationEditTarget, price: number): Promise<void> {
    const path = target.type === "family"
      ? `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}/items/${encodeURIComponent(target.itemId)}`
      : `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}`;
    await this.httpClient.patch(path, { price });
  }

  async updateStock(target: PublicationEditTarget, quantity: number): Promise<void> {
    const path = target.type === "family"
      ? `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}/items/${encodeURIComponent(target.itemId)}/stock`
      : `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}/stock`;
    const body = target.type === "legacy" && target.variationId !== null
      ? { quantity, variationId: target.variationId }
      : { quantity };
    await this.httpClient.patch(path, body);
  }

  async updateSku(target: PublicationEditTarget, sku: string): Promise<void> {
    const path = target.type === "family"
      ? `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}/items/${encodeURIComponent(target.itemId)}/sku`
      : `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}/sku`;
    const body = target.type === "legacy" && target.variationId !== null
      ? { sku, variationId: target.variationId }
      : { sku };
    await this.httpClient.patch(path, body);
  }
}
