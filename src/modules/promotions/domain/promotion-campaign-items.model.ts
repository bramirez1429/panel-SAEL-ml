export type PromotionCampaignItem = Readonly<{
  itemId: string;
  status?: string;
  price?: number;
  promotionPrice?: number;
}>;

export type PromotionCampaignItemsPaging = Readonly<{
  total: number;
  offset: number;
  limit: number;
}>;

export type PromotionCampaignItemsPagingRequest = Readonly<{
  offset: number;
  limit: number;
}>;

export type PromotionCampaignItems = Readonly<{
  items: readonly PromotionCampaignItem[];
  paging?: PromotionCampaignItemsPaging;
}>;
