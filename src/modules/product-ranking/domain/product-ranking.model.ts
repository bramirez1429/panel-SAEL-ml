export type ProductRankingItem = Readonly<{
  title: string;
  sold: number;
  visits: number | null;
  type: 'LEGACY' | 'USER_PRODUCT';
  itemIds: readonly string[];
  familyId: string | null;
  userProductIds: readonly string[];
  thumbnailUrl: string | null;
  variantsCount: number;
}>;

export type ProductRankingVariant = Readonly<{
  id: string;
  label: string;
  itemId: string | null;
  userProductId: string | null;
  sold: number;
  visits: number | null;
  thumbnailUrl: string | null;
}>;

export type ProductRankingVariantsResponse = Readonly<{
  variants: readonly ProductRankingVariant[];
}>;

export type ProductRankingResponse = Readonly<{
  totalProducts: number;
  productsWithSales: number;
  visitPeriodDays: ProductRankingVisitPeriod;
  totalVisits: number | null;
  products: readonly ProductRankingItem[];
}>;
import type { ProductRankingVisitPeriod } from './product-ranking-period';
