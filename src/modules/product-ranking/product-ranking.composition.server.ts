import 'server-only';
import { getApiConfig } from '@/shared/api/api-config';
import { createAuthenticatedHttpClient } from '@/shared/api/authenticated-http-client.server';
import { HttpClient } from '@/shared/api/http-client.server';
import { ProductRankingApiRepository } from './infrastructure/product-ranking-api.repository.server';
import { createGetProductRankingQuery } from './application/get-product-ranking.query';

export function createGetProductRankingQueryServer() {
  return createGetProductRankingQuery(createProductRankingRepository());
}

export function createProductRankingRepository() {
  return new ProductRankingApiRepository(createAuthenticatedHttpClient(new HttpClient(getApiConfig())));
}
