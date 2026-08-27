import type { PromotionProductGroup, PromotionStatus, PromotionsPage } from "./promotion.model";
export type PromotionsRequest = Readonly<{ limit: number; cursor: string | null; search?: string; productGroup?: PromotionProductGroup; promotionStatus?: PromotionStatus; promotionType?: string }>;
export interface PromotionsRepository { getCatalog(request: PromotionsRequest): Promise<PromotionsPage>; }
