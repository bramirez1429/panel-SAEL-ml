import "server-only";
import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { PromotionsRepository, PromotionsRequest } from "../domain/promotions.repository";
import { catalogSchema, facetsSchema } from "./promotions.schema";
export class PromotionsApiRepository implements PromotionsRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}
  async getFacets() { const parsed = facetsSchema.safeParse(await this.http.get("/mercadolibre/direct/promociones/facets")); if (!parsed.success) throw new ApiError("Facets de promociones inválidos.", "API_INVALID_RESPONSE", { cause: parsed.error }); return parsed.data; }
  async getCatalog(request: PromotionsRequest) { const params = new URLSearchParams({ limit: String(request.limit) }); if (request.cursor) params.set("cursor", request.cursor); if (request.search) params.set("search", request.search); if (request.categoryId) params.set("categoryId", request.categoryId); if (request.promotionStatus) params.set("promotionStatus", request.promotionStatus); if (request.promotionType) params.set("promotionType", request.promotionType); if (request.facetFilters) params.set("facetFilters", request.facetFilters); const parsed = catalogSchema.safeParse(await this.http.get(`/mercadolibre/direct/promociones?${params}`)); if (!parsed.success) throw new ApiError("Catálogo de promociones inválido.", "API_INVALID_RESPONSE", { cause: parsed.error }); return parsed.data; }
}
