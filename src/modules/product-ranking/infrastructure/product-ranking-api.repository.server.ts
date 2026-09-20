import 'server-only';
import type { AuthenticatedHttpClient } from '@/shared/api/authenticated-http-client.server';
import { ApiError } from '@/shared/api/api-error';
import type { ProductRankingResponse, ProductRankingVariantsResponse } from '../domain/product-ranking.model';
import { productRankingResponseSchema, productRankingVariantsResponseSchema } from './product-ranking.schema';
import type { ProductRankingVisitPeriod } from '../domain/product-ranking-period';

export class ProductRankingApiRepository {
  constructor(private readonly http: AuthenticatedHttpClient) {}

  async getRanking(days: ProductRankingVisitPeriod): Promise<ProductRankingResponse> {
    const response = await this.http.get(`/mercadolibre/direct/ranking-productos?days=${days}`, { timeoutMs: 120_000 });
    const parsed = productRankingResponseSchema.safeParse(response);
    if (!parsed.success) throw new ApiError('Respuesta de ranking de productos inválida.', 'API_INVALID_RESPONSE', { cause: parsed.error });
    return parsed.data;
  }

  async getVariants(type: 'family' | 'item', id: string, days: ProductRankingVisitPeriod): Promise<ProductRankingVariantsResponse> {
    const response = await this.http.get(
      `/mercadolibre/direct/ranking-productos/${type}/${encodeURIComponent(id)}/variantes?days=${days}`,
      { timeoutMs: 60_000 },
    );
    const parsed = productRankingVariantsResponseSchema.safeParse(response);
    if (!parsed.success) throw new ApiError('Respuesta de variantes del ranking inválida.', 'API_INVALID_RESPONSE', { cause: parsed.error });
    return parsed.data;
  }
}
