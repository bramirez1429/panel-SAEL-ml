import { z } from "zod";

const campaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).nullable(),
  type: z.string().min(1),
  status: z.string().min(1),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
  deadlineDate: z.string().nullable(),
}).strict();

export const promotionCampaignsSchema = z.object({
  campaigns: z.array(z.unknown()).transform((campaigns) => campaigns.flatMap((campaign) => {
    const parsed = campaignSchema.safeParse(campaign);
    return parsed.success ? [parsed.data] : [];
  })),
}).strict();
