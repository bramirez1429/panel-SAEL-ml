import { z } from "zod";

/**
 * Contrato de entrada del endpoint NestJS. Todo dato externo se valida aquí
 * como unknown antes de alcanzar el mapper y el dominio.
 */
export const publicationDtoSchema = z.object({
  id: z.string().uuid(),
  seller_id: z.number().int().nonnegative(),
  external_key: z.string().min(1),
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
  family_id: z.string().nullable(),
  parent_item_id: z.string().nullable(),
  family_name: z.string().nullable(),
  title: z.string(),
  thumbnail: z.string().nullable(),
  status: z.string().nullable(),
  category_id: z.string().nullable(),
  currency_id: z.string().nullable(),
  price_from: z.number().nullable(),
  price_to: z.number().nullable(),
  stock_total: z.number().nonnegative(),
  children_count: z.number().int().nonnegative(),
  permalink: z.string().nullable(),
  source_updated_at: z.iso.datetime({ offset: true }).nullable(),
  last_synced_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});

export const publicationsResponseSchema = z.object({
  paging: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  count: z.number().int().nonnegative(),
  publications: z.array(publicationDtoSchema),
});

export type PublicationDto = z.infer<typeof publicationDtoSchema>;
export type PublicationsResponseDto = z.infer<
  typeof publicationsResponseSchema
>;
