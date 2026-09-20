import { z } from 'zod';

export const productRankingResponseSchema = z.object({
  totalProducts: z.number().int().nonnegative(),
  productsWithSales: z.number().int().nonnegative(),
  visitPeriodDays: z.union([
    z.literal(7),
    z.literal(10),
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(90),
    z.literal(120),
    z.literal(150),
  ]),
  totalVisits: z.number().int().nonnegative().nullable(),
  products: z.array(z.object({
    title: z.string(), sold: z.number().int().nonnegative(), visits: z.number().int().nonnegative().nullable(),
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
    visits: z.number().int().nonnegative().nullable(),
    thumbnailUrl: z.string().nullable(),
  })),
});
