import "server-only";

import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type {
  PublicationEditRepository,
  PublicationEditTarget,
  PublicationEditStatus,
} from "../domain/publication-edit.repository";
import { publicationSkuResponseSchema } from "./publication-sku-response.schema";

/** Único adaptador que conoce los endpoints reales de edición de NestJS. */
export class PublicationEditApiRepository implements PublicationEditRepository {
  constructor(private readonly httpClient: AuthenticatedHttpClient) {}

  async getSku(target: PublicationEditTarget): Promise<string | null> {
    const path = target.type === "family"
      ? `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}/items/${encodeURIComponent(target.itemId)}/sku`
      : `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}/sku`;
    const response = publicationSkuResponseSchema.parse(await this.httpClient.get(path));
    if (response.model === "VARIANT_PRICING") return response.sku;
    if (target.type === "legacy" && target.variationId !== null) {
      return response.variations?.find(
        (variation) => String(variation.variationId) === String(target.variationId),
      )?.sku ?? null;
    }
    return response.sku ?? null;
  }

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

  async updateStatus(target: PublicationEditTarget, status: PublicationEditStatus): Promise<void> {
    const path = target.type === "family"
      ? `/mercadolibre/direct/edicion/nueva/${encodeURIComponent(target.familyId)}/items/${encodeURIComponent(target.itemId)}`
      : `/mercadolibre/direct/edicion/clasica/${encodeURIComponent(target.itemId)}`;
    await this.httpClient.patch(path, { status });
  }
}
