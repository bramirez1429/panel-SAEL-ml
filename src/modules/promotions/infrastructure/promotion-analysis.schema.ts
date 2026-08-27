import { z } from "zod";

const amount = z.number().finite().nonnegative().nullable();
const candidateSchema = z.object({
  price: amount,
  originalPrice: amount,
  discountPercent: z.number().finite().nullable(),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
  mercadoLibreContributionAmount: amount,
  mercadoLibreBaseContributionAmount: amount,
  mercadoLibreBoostAmount: amount,
}).nullable();

const childSchema = z.object({
  itemId: z.string().min(1),
  eligible: z.boolean(),
  originalPrice: amount,
  variantLabel: z.string().nullable(),
  attributes: z.array(z.object({ valueName: z.string().nullable() })),
  requiresPriceSelection: z.boolean(),
  candidate: candidateSchema,
  saleEstimate: z.object({
    saleFeeAmount: z.number().finite().nonnegative(),
    estimatedNetAmount: z.number().finite(),
  }).nullable(),
});

export const promotionAnalysisResponseSchema = z.object({
  done: z.boolean(),
  nextCursor: z.string().nullable(),
  publications: z.array(z.object({
    sourceKey: z.string().regex(/^(item:MLA|family:)/),
    title: z.string(),
    thumbnail: z.string().nullable(),
    model: z.enum(["LEGACY", "FAMILY"]),
    children: z.array(childSchema),
  })),
});

export type PromotionAnalysisResponseDto = z.infer<typeof promotionAnalysisResponseSchema>;
