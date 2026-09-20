import type { ProductRankingResponse } from '../domain/product-ranking.model';
import type { ProductRankingVisitPeriod } from '../domain/product-ranking-period';

export interface ProductRankingReader { getRanking(days: ProductRankingVisitPeriod): Promise<ProductRankingResponse>; }

export function createGetProductRankingQuery(reader: ProductRankingReader) {
  return { execute: (days: ProductRankingVisitPeriod) => reader.getRanking(days) };
}
