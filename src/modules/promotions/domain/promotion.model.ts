export type PromotionStatus = "ACTIVE" | "AVAILABLE" | "PENDING" | "NONE";
export type PromotionFacet = Readonly<{ id: string; name: string; values: readonly Readonly<{ value: string; count: number }>[] }>;
export type PromotionCategory = Readonly<{ id: string; name: string; path: readonly string[]; count: number }>;
export type PromotionFacets = Readonly<{ categories: readonly PromotionCategory[]; attributes: readonly PromotionFacet[] }>;
export type PromotionRow = Readonly<{ itemId: string; familyId: string | null; title: string; thumbnail: string | null; category: PromotionCategory; price: number; publicationStatus: string; attributes: readonly Readonly<{ id: string; name: string; value: string }>[]; promotionSummary: Readonly<{ status: PromotionStatus; activeTypes: readonly string[]; candidateTypes: readonly string[]; pendingTypes: readonly string[] }> }>;
export type PromotionsPage = Readonly<{ publications: readonly PromotionRow[]; done: boolean; nextCursor: string | null; count: number }>;
