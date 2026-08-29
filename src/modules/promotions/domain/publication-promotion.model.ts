export type PromotionSnapshot = Readonly<{
  id: string | null;
  type: string | null;
  offerId: string | null;
  status: string | null;
  price: number | null;
  originalPrice: number | null;
  startDate: string | null;
  finishDate: string | null;
}>;

export type PublicationPromotionPreviewItem = Readonly<{
  itemId: string;
  price: number | null;
  activePromotion: PromotionSnapshot | null;
  candidates: readonly PromotionSnapshot[];
  requestedCandidate: PromotionSnapshot | null;
  applicable: boolean;
  unavailableReason: string | null;
}>;

export type PublicationPromotionPreview = Readonly<{
  sourceKey: string;
  totalItems: number;
  applicableItems: number;
  unavailableItems: number;
  items: readonly PublicationPromotionPreviewItem[];
}>;

export type PromotionItemResult = Readonly<{
  itemId: string;
  success: boolean;
  stage: string;
  errorCode?: string;
  providerMessage?: string;
}>;

export type PublicationPromotionResult = Readonly<{
  success: boolean;
  status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILURE";
  errorCode?: string;
  providerMessage?: string;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  results: readonly PromotionItemResult[];
}>;

export function previewAllowsApplication(
  preview: PublicationPromotionPreview,
): boolean {
  return (
    preview.totalItems > 0 &&
    preview.applicableItems === preview.totalItems &&
    preview.unavailableItems === 0
  );
}

export function publicationSourceKey(publication: {
  itemId: string;
  familyId: string | null;
}): string {
  return publication.familyId
    ? `family:${publication.familyId}`
    : `item:${publication.itemId}`;
}
