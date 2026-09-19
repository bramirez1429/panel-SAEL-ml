import { AppError } from '@/shared/errors/app-error';
import { ApiError } from '@/shared/api/api-error';
import { unstable_rethrow } from 'next/navigation';
import { createGetProductRankingQueryServer } from '@/modules/product-ranking/product-ranking.composition.server';
import { ProductRankingView } from '@/modules/product-ranking/presentation/product-ranking-view';
import { loadProductRankingVariantsAction } from './load-product-ranking-variants.action';

export const dynamic = 'force-dynamic';

export default async function ProductRankingPage() {
  try {
    const data = await createGetProductRankingQueryServer().execute();
    return <ProductRankingView data={data} loadVariantsAction={loadProductRankingVariantsAction} />;
  } catch (error) {
    unstable_rethrow(error);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[product-ranking]', error instanceof ApiError
        ? { name: error.name, code: error.code, status: error.status, message: error.message }
        : error instanceof AppError
          ? { name: error.name, code: error.code, message: error.message }
          : error instanceof Error
            ? { name: error.name, message: error.message }
            : { message: 'Unknown error' });
    }
    return <ProductRankingView error />;
  }
}
