export type PromotionCampaign = Readonly<{
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  finishDate: string | null;
  deadlineDate: string | null;
}>;

export type PromotionCampaigns = Readonly<{
  campaigns: readonly PromotionCampaign[];
}>;
