import { z } from 'zod';

export const productRankingResponseSchema = z.object({
  totalProducts: z.number().int().nonnegative(),
  productsWithSales: z.number().int().nonnegative(),
  products: z.array(z.object({
    title: z.string(), sold: z.number().int().nonnegative(),
    type: z.enum(['LEGACY', 'USER_PRODUCT']),
    itemIds: z.array(z.string()),
    familyId: z.string().nullable(),
    userProductIds: z.array(z.string()),
    thumbnailUrl: z.string().nullable(),
    variantsCount: z.number().int().nonnegative(),
  })),
});

export const productRankingVariantsResponseSchema = z.object({
  variants: z.array(z.object({
    id: z.string(),
    label: z.string(),
    itemId: z.string().nullable(),
    userProductId: z.string().nullable(),
    sold: z.number().int().nonnegative(),
    thumbnailUrl: z.string().nullable(),
  })),
});
