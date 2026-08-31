export type PromotionRemovalSelection = Readonly<{
  promotionType: "PRICE_DISCOUNT" | "DEAL" | "SELLER_CAMPAIGN" | "SMART";
  promotionId: string | null;
  offerId: string | null;
}>;
