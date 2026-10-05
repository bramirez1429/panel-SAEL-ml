import { z } from "zod";

const publicationSchema = z.object({
  sourceKey: z.string().min(1),
  title: z.string().nullable().optional(),
  sold: z.number().nonnegative(),
  thumbnailUrl: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  familyId: z.string().nullable().optional(),
  itemId: z.string().nullable().optional(),
  userProductId: z.string().nullable().optional(),
  type: z.enum(["USER_PRODUCT", "LEGACY"]),
});

export const replicationListResponseSchema = z.union([
  z.array(publicationSchema),
  z.object({ items: z.array(publicationSchema) }).transform((value) => value.items),
  z.object({ products: z.array(publicationSchema) }).transform((value) => value.products),
]);

export const replicationPreviewResponseSchema = z.object({
  sourceKey: z.string().min(1),
  title: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  priceFrom: z.number().nullable().optional(),
  priceTo: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});
