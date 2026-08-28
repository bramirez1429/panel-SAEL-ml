export type PromotionCampaign = Readonly<{
  id: string;
  name: string;
  type: string;
  eligibleItems: number;
  startDate: string | null;
  finishDate: string | null;
}>;

export type PromotionCampaigns = Readonly<{
  campaigns: readonly PromotionCampaign[];
}>;
