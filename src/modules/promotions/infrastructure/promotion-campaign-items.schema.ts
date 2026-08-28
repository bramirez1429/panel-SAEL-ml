import { z } from "zod";

const itemSchema = z.object({
  itemId: z.string().min(1),
  status: z.string().min(1).optional(),
  price: z.number().finite().optional(),
  promotionPrice: z.number().finite().optional(),
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
