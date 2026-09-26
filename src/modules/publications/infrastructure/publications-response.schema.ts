import { z } from "zod";

/** DTO real de GET /mercadolibre/direct/publicaciones/agrupadas. */
const sharedProductDtoSchema = z.object({
  key: z.string().min(1),
  model: z.literal("SHARED"),
  product_id: z.string().uuid().nullable().optional(),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  price: z.number().nullable(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  status: z.string().nullable(),
  thumbnail: z.string().nullable(),
  permalink: z.string().nullable(),
  currency: z.string().nullable(),
  variantsCount: z.number().int().nonnegative(),
});

const familySummaryDtoSchema = z.object({
  key: z.string().min(1),
  model: z.literal("VARIANT_PRICING"),
  product_id: z.string().uuid().nullable().optional(),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  variantsCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  itemId: z.string().min(1).nullable(),
  userProductId: z.string().nullable(),
  title: z.string().nullable(),
  priceFrom: z.number().nullable(),
  priceTo: z.number().nullable(),
  currency: z.string().nullable(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  status: z.string().nullable(),
  thumbnail: z.string().nullable(),
  permalink: z.string().nullable(),
});

export const groupedPublicationDtoSchema = z.union([
  sharedProductDtoSchema,
  familySummaryDtoSchema,
]);

export const publicationsResponseSchema = z.object({
  done: z.boolean(),
  nextCursor: z.string().nullable(),
  rawItemsCount: z.number().int().nonnegative(),
  productsCount: z.number().int().nonnegative(),
  products: z.array(groupedPublicationDtoSchema),
});

export type GroupedPublicationDto = z.infer<
  typeof groupedPublicationDtoSchema
>;
export type PublicationsResponseDto = z.infer<
  typeof publicationsResponseSchema
>;
