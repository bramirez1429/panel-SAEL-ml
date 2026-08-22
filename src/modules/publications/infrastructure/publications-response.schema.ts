import { z } from "zod";

/** DTO real de GET /mercadolibre/direct/publicaciones/agrupadas. */
const familyAttributeDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  value_name: z.string().nullable().optional(),
  values: z
    .array(
      z.object({
        id: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

const familyPictureDtoSchema = z.object({
  id: z.string().min(1),
  url: z.string().optional(),
  secure_url: z.string().optional(),
});

const familyItemSummaryDtoSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().nullable(),
  price: z.number().nullable(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  status: z.string().nullable(),
  inventoryId: z.string().nullable(),
  thumbnail: z.string().nullable(),
  pictures: z.array(familyPictureDtoSchema),
  attributes: z.array(familyAttributeDtoSchema),
});

const familyVariantSummaryDtoSchema = z.object({
  userProductId: z.string().min(1),
  items: z.array(familyItemSummaryDtoSchema),
});

const sharedProductDtoSchema = z.object({
  key: z.string().min(1),
  model: z.literal("SHARED"),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  price: z.number().nullable(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  status: z.string().nullable(),
  thumbnail: z.string().nullable(),
  variations: z.array(z.unknown()),
});

const familySummaryDtoSchema = z.object({
  key: z.string().min(1),
  model: z.literal("VARIANT_PRICING"),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  variantsCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  variants: z.array(familyVariantSummaryDtoSchema),
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
