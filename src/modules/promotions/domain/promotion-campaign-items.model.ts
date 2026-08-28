export type PromotionCampaignItem = Readonly<{
  itemId: string;
  title: string | null;
  thumbnail: string | null;
  status: string | null;
  currentPrice: number | null;
  promotionPrice: number | null;
  sellerDiscountAmount: number | null;
  mercadoLibreBaseContributionAmount: number | null;
  mercadoLibreBoostAmount: number | null;
  mercadoLibreContributionAmount: number | null;
  estimatedNetAmount: number | null;
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
