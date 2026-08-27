export type PromotionStatus = "ACTIVE" | "AVAILABLE" | "PENDING" | "NONE";
export type PromotionProductGroup = "WOMEN_TSHIRT" | "WOMEN_SWEATSHIRT" | "GIRLS_TSHIRT" | "GIRLS_SWEATSHIRT";
export type PromotionDetails = Readonly<{ id: string | null; type: string | null; name: string | null; originalPrice: number | null; promotionPrice: number | null; discountPercent: number | null; startDate: string | null; finishDate: string | null }>;
export type PromotionRow = Readonly<{ itemId: string; familyId: string | null; title: string; thumbnail: string | null; productGroup: PromotionProductGroup; price: number; currentPromotion: PromotionDetails | null; hasActivePromotion: boolean; availablePromotionsCount: number; promotionStatus: PromotionStatus }>;
export type PromotionsPage = Readonly<{ publications: readonly PromotionRow[]; done: boolean; nextCursor: string | null; count: number }>;
