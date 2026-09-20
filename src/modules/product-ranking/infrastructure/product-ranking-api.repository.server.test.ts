// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { AuthenticatedHttpClient } from '@/shared/api/authenticated-http-client.server';
import { ProductRankingApiRepository } from './product-ranking-api.repository.server';

function repositoryWith(response: unknown) {
  const get = vi.fn().mockResolvedValue(response);
  return {
    get,
    repository: new ProductRankingApiRepository({ get } as unknown as AuthenticatedHttpClient),
  };
}

describe('ProductRankingApiRepository periods', () => {
  it('envía days al endpoint principal', async () => {
    const { repository, get } = repositoryWith({
      totalProducts: 0,
      productsWithSales: 0,
      visitPeriodDays: 60,
      totalVisits: 0,
      products: [],
    });

    await repository.getRanking(60);

    expect(get).toHaveBeenCalledWith(
      '/mercadolibre/direct/ranking-productos?days=60',
      { timeoutMs: 120_000 },
    );
  });

  it('envía el mismo days al endpoint lazy de variantes', async () => {
    const { repository, get } = repositoryWith({ variants: [] });

    await repository.getVariants('family', 'FAM 1', 120);

    expect(get).toHaveBeenCalledWith(
      '/mercadolibre/direct/ranking-productos/family/FAM%201/variantes?days=120',
      { timeoutMs: 60_000 },
    );
  });
});
