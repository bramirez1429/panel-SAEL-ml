export type ProductRankingItem = Readonly<{
  title: string;
  sold: number;
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
  thumbnailUrl: string | null;
}>;

export type ProductRankingVariantsResponse = Readonly<{
  variants: readonly ProductRankingVariant[];
}>;

export type ProductRankingResponse = Readonly<{
  totalProducts: number;
  productsWithSales: number;
  products: readonly ProductRankingItem[];
}>;
