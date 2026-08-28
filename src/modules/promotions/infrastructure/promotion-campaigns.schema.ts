import { z } from "zod";

export const promotionCampaignsSchema = z.object({
  campaigns: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    status: z.string().min(1),
    startDate: z.string().nullable(),
    finishDate: z.string().nullable(),
    deadlineDate: z.string().nullable(),
  }).strict()),
}).strict();
