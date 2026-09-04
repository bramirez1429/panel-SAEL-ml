import { z } from "zod";

const itemSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1).nullable(),
  thumbnail: z.string().min(1).nullable(),
  sku: z.string().min(1).nullable(),
  stock: z.number().int().nonnegative().nullable(),
  freeShipping: z.boolean().nullable(),
  installmentLabel: z.string().min(1).nullable(),
  status: z.string().min(1).nullable(),
  eligible: z.boolean().nullable(),
  currentPrice: z.number().finite().nullable(),
  promotionPrice: z.number().finite().nullable(),
  minPromotionPrice: z.number().finite().nullable(),
  maxPromotionPrice: z.number().finite().nullable(),
  suggestedPromotionPrice: z.number().finite().nullable(),
  requiresPriceSelection: z.boolean().nullable(),
  sellerDiscountAmount: z.number().finite().nullable(),
  mercadoLibreBaseContributionAmount: z.number().finite().nullable(),
  mercadoLibreBoostAmount: z.number().finite().nullable(),
  mercadoLibreContributionAmount: z.number().finite().nullable(),
  estimatedNetAmount: z.number().finite().nullable(),
}).strict();

const pagingSchema = z.object({
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
}).strict();

export const promotionCampaignItemsSchema = z.object({
  items: z.array(itemSchema),
  paging: pagingSchema.optional(),
}).strict();
