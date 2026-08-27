export type PromotionAudience = "WOMEN" | "GIRLS";

export type PromotionAnalysisChild = Readonly<{
  itemId: string;
  variantLabel: string | null;
  eligible: boolean;
  originalPrice: number | null;
  promotionPrice: number | null;
  discountPercent: number | null;
  mercadoLibreBaseContributionAmount: number | null;
  mercadoLibreBoostAmount: number | null;
  mercadoLibreContributionAmount: number | null;
  saleEstimate: Readonly<{
    saleFeeAmount: number;
    estimatedNetAmount: number;
  }> | null;
  requiresPriceSelection: boolean;
  startDate: string | null;
  finishDate: string | null;
}>;

export type PromotionAnalysisPublication = Readonly<{
  sourceKey: string;
  title: string;
  thumbnail: string | null;
  model: "LEGACY" | "FAMILY";
  totalItems: number;
  eligibleItems: number;
  ineligibleItems: number;
  children: readonly PromotionAnalysisChild[];
  summary: Readonly<{
    totalItems: number;
    eligibleItems: number;
    ineligibleItems: number;
    minPromotionPrice: number | null;
    maxPromotionPrice: number | null;
    minEstimatedNetAmount: number | null;
    maxEstimatedNetAmount: number | null;
    minMercadoLibreContributionAmount: number | null;
    maxMercadoLibreContributionAmount: number | null;
  }>;
}>;

export type PromotionAnalysisPage = Readonly<{
  publications: readonly PromotionAnalysisPublication[];
  done: boolean;
  nextCursor: string | null;
  count: number;
}>;
