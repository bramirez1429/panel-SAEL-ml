import { z } from "zod";

const nullableAmount = z.number().finite().nullable();
const estimateSchema = z.object({
  saleFeeAmount: z.number().finite().nonnegative(),
  estimatedNetAmount: z.number().finite(),
}).strict().nullable();

const childSchema = z.object({
  itemId: z.string().min(1),
  variantLabel: z.string().nullable(),
  eligible: z.boolean(),
  originalPrice: nullableAmount,
  promotionPrice: nullableAmount,
  discountPercent: z.number().finite().nullable(),
  mercadoLibreBaseContributionAmount: nullableAmount,
  mercadoLibreBoostAmount: nullableAmount,
  mercadoLibreContributionAmount: nullableAmount,
  saleEstimate: estimateSchema,
  requiresPriceSelection: z.boolean(),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
}).strict();

const summarySchema = z.object({
  totalItems: z.number().int().nonnegative(),
  eligibleItems: z.number().int().nonnegative(),
  ineligibleItems: z.number().int().nonnegative(),
  minPromotionPrice: nullableAmount,
  maxPromotionPrice: nullableAmount,
  minEstimatedNetAmount: nullableAmount,
  maxEstimatedNetAmount: nullableAmount,
  minMercadoLibreContributionAmount: nullableAmount,
  maxMercadoLibreContributionAmount: nullableAmount,
}).strict();

export const promotionAnalysisResponseSchema = z.object({
  done: z.boolean(),
  nextCursor: z.string().nullable(),
  count: z.number().int().nonnegative(),
  publications: z.array(z.object({
    sourceKey: z.string().regex(/^(item:MLA|family:)/),
    title: z.string(),
    thumbnail: z.string().nullable(),
    model: z.enum(["LEGACY", "FAMILY"]),
    totalItems: z.number().int().nonnegative(),
    eligibleItems: z.number().int().nonnegative(),
    ineligibleItems: z.number().int().nonnegative(),
    summary: summarySchema,
    children: z.array(childSchema),
  }).strict()),
}).strict();

export type PromotionAnalysisResponseDto = z.infer<typeof promotionAnalysisResponseSchema>;
