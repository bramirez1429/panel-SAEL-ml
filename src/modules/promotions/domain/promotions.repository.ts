import type { PromotionFacets, PromotionsPage } from "./promotion.model";
export type PromotionsRequest = Readonly<{ limit: number; cursor: string | null; search?: string; categoryId?: string; promotionStatus?: string; promotionType?: string; facetFilters?: string }>;
export interface PromotionsRepository { getFacets(): Promise<PromotionFacets>; getCatalog(request: PromotionsRequest): Promise<PromotionsPage>; }
