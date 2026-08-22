import { z } from "zod";

const attributeDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  value_name: z.string().nullable().optional(),
  values: z.array(z.unknown()).optional(),
});

/** Campos reales consumidos por la pantalla de detalle del endpoint activo. */
export const publicationDetailResponseSchema = z.object({
  model: z.enum(["SHARED", "VARIANT_PRICING"]),
  itemId: z.string().min(1),
  title: z.string().nullable(),
  familyId: z.string().nullable(),
  familyName: z.string().nullable(),
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
  permalink: z.string().nullable(),
  attributes: z.array(attributeDtoSchema),
  variations: z.array(z.unknown()),
});

export type PublicationDetailResponseDto = z.infer<
  typeof publicationDetailResponseSchema
>;
export type PublicationAttributeDto = z.infer<typeof attributeDtoSchema>;
