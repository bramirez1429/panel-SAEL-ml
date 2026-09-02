import { z } from "zod";

const attributeDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  value_name: z.string().nullable().optional(),
  values: z.array(z.unknown()).optional(),
});

const pictureDtoSchema = z.object({
  id: z.string().min(1),
  url: z.string().nullable().optional(),
  secure_url: z.string().nullable().optional(),
});

/** Campos reales consumidos por la pantalla de detalle del endpoint activo. */
export const publicationDetailResponseSchema = z.object({
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  familyId: z.string().nullable(),
  familyName: z.string().nullable(),
  userProductId: z.string().nullable().optional(),
  status: z.string().nullable(),
  stock: z.object({
    available: z.number().int().nonnegative(),
    sold: z.number().int().nonnegative(),
  }),
  price: z.object({
    current: z.number().nullable(),
    regular: z.number().nullable(),
    standard: z.number().nullable(),
    currency: z.string().nullable(),
  }),
  thumbnail: z.string().nullable(),
  pictures: z.array(pictureDtoSchema).default([]),
  permalink: z.string().nullable(),
  attributes: z.array(attributeDtoSchema),
  variations: z.array(z.unknown()),
});

const familyVariantDtoSchema = z.object({
  itemId: z.string().min(1),
  userProductId: z.string().nullable(),
  title: z.string().nullable(),
  status: z.string().nullable(),
  stock: z.object({
    available: z.number().int().nonnegative(),
    sold: z.number().int().nonnegative(),
  }),
  price: z.object({
    current: z.number().nullable(),
    regular: z.number().nullable().optional(),
    standard: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
  }),
  thumbnail: z.string().nullable(),
  pictures: z.array(pictureDtoSchema).default([]),
  attributes: z.array(attributeDtoSchema),
  permalink: z.string().nullable(),
  sku: z.object({
    sellerCustomField: z.string().nullable(),
    inventoryId: z.string().nullable(),
  }).optional(),
});

/** DTO real de GET /mercadolibre/direct/familias/:familyId. */
export const familyDetailResponseSchema = z.object({
  model: z.literal("VARIANT_PRICING"),
  familyId: z.string().min(1),
  familyName: z.string().nullable(),
  userProductsCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  userProductIds: z.array(z.string()),
  variants: z.array(familyVariantDtoSchema),
});

export type PublicationDetailResponseDto = z.infer<
  typeof publicationDetailResponseSchema
>;
export type PublicationAttributeDto = z.infer<typeof attributeDtoSchema>;
export type PublicationPictureDto = z.infer<typeof pictureDtoSchema>;
export type FamilyDetailResponseDto = z.infer<typeof familyDetailResponseSchema>;
