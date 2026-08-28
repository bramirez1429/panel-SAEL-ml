import { z } from "zod";

export const promotionCampaignsSchema = z.object({
  campaigns: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    eligibleItems: z.number().int().nonnegative(),
    startDate: z.string().nullable(),
    finishDate: z.string().nullable(),
  }).strict()),
}).strict();
