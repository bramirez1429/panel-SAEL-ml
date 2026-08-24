import { z } from "zod";

const legacyVariationSkuSchema = z.object({
  variationId: z.union([z.number(), z.string()]).nullable(),
  sku: z.string().nullable(),
});

export const publicationSkuResponseSchema = z.discriminatedUnion("model", [
  z.object({
    model: z.literal("SHARED"),
    itemId: z.string(),
    hasVariations: z.boolean(),
    variations: z.array(legacyVariationSkuSchema).optional(),
    sku: z.string().nullable().optional(),
  }),
  z.object({
    model: z.literal("VARIANT_PRICING"),
    familyId: z.string(),
    itemId: z.string(),
    userProductId: z.string().nullable(),
    sku: z.string().nullable(),
  }),
]);

export type PublicationSkuResponse = z.infer<typeof publicationSkuResponseSchema>;
