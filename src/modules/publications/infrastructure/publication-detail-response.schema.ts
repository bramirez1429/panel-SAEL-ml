import { z } from "zod";

import { publicationDtoSchema } from "./publications-response.schema";

const publicationAttributeDtoSchema = z.object({
  id: z.string().min(1),
  valueName: z.string().nullable(),
});

const sharedVariationDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  availableQuantity: z.number().int().nonnegative(),
  soldQuantity: z.number().int().nonnegative(),
  attributes: z.array(publicationAttributeDtoSchema),
});

const publicationDetailProductDtoSchema = publicationDtoSchema.extend({
  shared_variations: z.array(sharedVariationDtoSchema),
  created_at: z.iso.datetime({ offset: true }),
});

const publicationChildDtoSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  item_id: z.string().min(1),
  user_product_id: z.string().min(1),
  variant_label: z.string().nullable(),
  title: z.string().nullable(),
  thumbnail: z.string().nullable(),
  status: z.string().nullable(),
  currency_id: z.string().nullable(),
  listing_type_id: z.string().nullable(),
  price: z.number().nullable(),
  available_quantity: z.number().int().nonnegative(),
  sold_quantity: z.number().int().nonnegative(),
  attributes: z.array(publicationAttributeDtoSchema),
  permalink: z.string().nullable(),
  source_updated_at: z.iso.datetime({ offset: true }).nullable(),
  last_synced_at: z.iso.datetime({ offset: true }),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});

const sharedPublicationDetailResponseSchema = z.object({
  product: publicationDetailProductDtoSchema.extend({
    model: z.literal("SHARED"),
  }),
});

const familyPublicationDetailResponseSchema = z.object({
  product: publicationDetailProductDtoSchema.extend({
    model: z.literal("VARIANT_PRICING"),
  }),
  children: z.array(publicationChildDtoSchema),
});

/**
 * Contrato específico del detalle NestJS. Distingue el parent SHARED del
 * parent de familia para exigir hijos únicamente cuando corresponde.
 */
export const publicationDetailResponseSchema = z.union([
  sharedPublicationDetailResponseSchema,
  familyPublicationDetailResponseSchema,
]);

export type PublicationAttributeDto = z.infer<
  typeof publicationAttributeDtoSchema
>;
export type SharedVariationDto = z.infer<typeof sharedVariationDtoSchema>;
export type PublicationChildDto = z.infer<typeof publicationChildDtoSchema>;
export type SharedPublicationDetailResponseDto = z.infer<
  typeof sharedPublicationDetailResponseSchema
>;
export type FamilyPublicationDetailResponseDto = z.infer<
  typeof familyPublicationDetailResponseSchema
>;
export type PublicationDetailResponseDto = z.infer<
  typeof publicationDetailResponseSchema
>;
