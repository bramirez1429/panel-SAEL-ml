import "server-only";
import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { PromotionsRepository, PromotionsRequest } from "../domain/promotions.repository";
import { catalogSchema } from "./promotions.schema";

/** Server adapter for the real Mercado Libre promotions catalog endpoint. */
export class PromotionsApiRepository implements PromotionsRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}

  async getCatalog(request: PromotionsRequest) {
    const params = new URLSearchParams({ limit: String(request.limit) });
    if (request.cursor) params.set("cursor", request.cursor);
    if (request.search?.trim()) params.set("search", request.search.trim());
    if (request.productGroup) params.set("productGroup", request.productGroup);
    if (request.promotionStatus) params.set("promotionStatus", request.promotionStatus);
    if (request.promotionType) params.set("promotionType", request.promotionType);
    const parsed = catalogSchema.safeParse(await this.http.get(`/mercadolibre/direct/promociones?${params}`));
    if (!parsed.success) throw new ApiError("Catálogo de promociones inválido.", "API_INVALID_RESPONSE", { cause: parsed.error });
    return parsed.data;
  }
}
