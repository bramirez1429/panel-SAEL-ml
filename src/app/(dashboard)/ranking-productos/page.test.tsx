// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  rethrow: vi.fn(),
}));

vi.mock('next/navigation', () => ({ unstable_rethrow: mocks.rethrow }));
vi.mock('@/modules/product-ranking/product-ranking.composition.server', () => ({
  createGetProductRankingQueryServer: () => ({ execute: mocks.execute }),
}));
vi.mock('@/modules/product-ranking/presentation/product-ranking-view', () => ({ ProductRankingView: () => null }));
vi.mock('./load-product-ranking-variants.action', () => ({ loadProductRankingVariantsAction: vi.fn() }));

import ProductRankingPage from './page';

describe('ProductRankingPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('vuelve a lanzar los errores de control interno de Next', async () => {
    const redirectError = new Error('redirect');
    mocks.execute.mockRejectedValue(redirectError);
    mocks.rethrow.mockImplementation((error: unknown) => { if (error === redirectError) throw error; });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(ProductRankingPage()).rejects.toBe(redirectError);
    expect(mocks.rethrow).toHaveBeenCalledWith(redirectError);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
