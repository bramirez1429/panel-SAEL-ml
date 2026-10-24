import type {
  PromotionProductGroup,
  PromotionStatus,
  PromotionsPage,
} from "./promotion.model";
import type {
  PublicationPromotionPreview,
  PublicationPromotionResult,
} from "./publication-promotion.model";
import type { PromotionAnalysisPage, PromotionAudience } from "./promotion-analysis.model";
import type { PromotionCampaigns } from "./promotion-campaign.model";
import type {
  PromotionCampaignItems,
  PromotionCampaignItemsPagingRequest,
} from "./promotion-campaign-items.model";
import type { PromotionRemovalSelection } from "./promotion-removal.model";

export type PromotionPriceModification = Readonly<{
  operation: string;
  allowed: boolean;
  reason: string | null;
}>;

export type PromotionPriceUpdateRestriction = Readonly<{
  code?: string | null;
  reason?: string | null;
  message?: string | null;
}> | string;

export type PromotionOption = Readonly<{
  id: string | null;
  offerId: string | null;
  type: string | null;
  name: string | null;
  status: string | null;
  promotionSubtype?: string | null;
  canUpdatePrice?: boolean | null;
  priceUpdateRestriction?: PromotionPriceUpdateRestriction | null;
  priceModification?: PromotionPriceModification | null;
  canEditPrice?: boolean | null;
  priceEditabilityReason?: string | null;
  originalPrice: number | null;
  promotionPrice: number | null;
  // Campaign price may differ from the buyer-facing discounted price.
  currentEditablePrice?: number | null;
  buyerPrice?: number | null;
  minUpdatePrice?: number | null;
  maxUpdatePrice?: number | null;
  minPromotionPrice: number | null;
  maxPromotionPrice: number | null;
  suggestedPromotionPrice: number | null;
  requiresPriceSelection: boolean | null;
  discountPercent: number | null;
  sellerDiscountAmount: number | null;
  mercadoLibreBaseContributionAmount: number | null;
  mercadoLibreBoostAmount: number | null;
  mercadoLibreContributionAmount: number | null;
  estimatedNetAmount: number | null;
  suggestedEstimatedNetAmount: number | null;
  startDate: string | null;
  finishDate: string | null;
  canApply: boolean;
  canRemove: boolean;
  saleEstimate: Readonly<{
    saleFeeAmount: number;
    estimatedNetAmount: number;
  }> | null;
}>;

export type PromotionApplyRequest =
  | Readonly<{
      type: "PRICE_DISCOUNT";
      dealPrice: number;
      startDate: string;
      finishDate: string;
    }>
  | Readonly<{
      type: "DEAL" | "SELLER_CAMPAIGN";
      promotionId: string;
      dealPrice: number;
    }>
  | Readonly<{
      type: "SMART";
      promotionId: string;
      offerId: string;
    }>;

export type PromotionsRequest = Readonly<{
  limit: number;
  cursor: string | null;
  search?: string;
  productGroup?: PromotionProductGroup;
  promotionStatus?: PromotionStatus;
  promotionType?: string;
}>;

export type PromotionAnalysisRequest = Readonly<{
  promotionId: string;
  audience?: PromotionAudience;
  limit: number;
  cursor: string | null;
}>;

export type PromotionCampaignItemsRequest = Readonly<{
  promotionId: string;
  promotionType: string;
  paging: PromotionCampaignItemsPagingRequest;
}>;

export interface PromotionsRepository {
  getCatalog(request: PromotionsRequest): Promise<PromotionsPage>;
  getCampaigns(audience?: PromotionAudience): Promise<PromotionCampaigns>;
  getCampaignItems(request: PromotionCampaignItemsRequest): Promise<PromotionCampaignItems>;
  getPromotionAnalysis(request: PromotionAnalysisRequest): Promise<PromotionAnalysisPage>;
  getOptions(itemId: string): Promise<readonly PromotionOption[]>;
  preview(
    sourceKey: string,
    request: PromotionApplyRequest,
  ): Promise<PublicationPromotionPreview>;
  remove(sourceKey: string): Promise<PublicationPromotionResult>;
  removeSelected(
    sourceKey: string,
    selection: PromotionRemovalSelection,
  ): Promise<PublicationPromotionResult>;
  apply(
    sourceKey: string,
    request: PromotionApplyRequest,
  ): Promise<PublicationPromotionResult>;
  updatePrice(
    sourceKey: string,
    request: PromotionApplyRequest,
  ): Promise<PublicationPromotionResult>;
}
