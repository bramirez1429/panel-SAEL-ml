'use server';

import { AppError } from '@/shared/errors/app-error';
import type { ProductRankingVariant } from '@/modules/product-ranking/domain/product-ranking.model';
import { createProductRankingRepository } from '@/modules/product-ranking/product-ranking.composition.server';
import { unstable_rethrow } from 'next/navigation';

export type LoadProductRankingVariantsAction = (input: Readonly<{
  type: 'family' | 'item';
  id: string;
}>) => Promise<{ ok: true; variants: readonly ProductRankingVariant[] } | { ok: false; message: string }>;

export const loadProductRankingVariantsAction: LoadProductRankingVariantsAction = async (input) => {
  try {
    const result = await createProductRankingRepository().getVariants(input.type, input.id);
    return { ok: true, variants: result.variants };
  } catch (error) {
    unstable_rethrow(error);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[product-ranking-variants]', error instanceof Error ? { name: error.name, message: error.message } : { message: 'Unknown error' });
    }
    return { ok: false, message: error instanceof AppError ? error.message : 'No se pudieron cargar las variantes.' };
  }
};
