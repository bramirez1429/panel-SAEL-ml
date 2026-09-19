import type { ProductRankingResponse } from '../domain/product-ranking.model';

export interface ProductRankingReader { getRanking(): Promise<ProductRankingResponse>; }

export function createGetProductRankingQuery(reader: ProductRankingReader) {
  return { execute: () => reader.getRanking() };
}
