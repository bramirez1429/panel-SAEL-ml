"use client";

import type {
  PromotionDetails,
  PromotionRow,
  PromotionsPage,
} from "@/modules/promotions/domain/promotion.model";
import { PromotionsTable } from "@/modules/promotions/presentation/promotions-table.client";

import type {
  PublicationWorkspaceItem,
  PublicationWorkspaceSelection,
} from "../domain/publication-workspace.model";

const noRemovalSelections = {} as const;
const ignoreRemovalSelection = () => undefined;

export function PublicationWorkspacePromotions({
  selection,
}: Readonly<{
  selection: PublicationWorkspaceSelection;
}>) {
  const publications = selection.type === "family"
    ? selection.children
    : [selection.publication];

  const page: PromotionsPage = {
    publications: publications.map(toPromotionRow),
    done: true,
    nextCursor: null,
    count: publications.length,
  };

  return (
    <section
      aria-label="Promociones de la selección"
      style={{ width: "100%" }}
    >
      <PromotionsTable
        compact
        loadAllOnMount
        page={page}
        selectedForRemoval={noRemovalSelections}
        onToggleRemoval={ignoreRemovalSelection}
      />
    </section>
  );
}

function toPromotionRow(
  publication: PublicationWorkspaceItem,
): PromotionRow {
  return {
    itemId: publication.itemId,
    familyId: null,
    title: publication.title,
    thumbnail: publication.thumbnailUrl,
    sku: publication.sku,
    stock: publication.stock,
    freeShipping: null,
    installmentLabel: publication.installmentLabel,
    price: publication.price,
    currentPromotion: currentPromotionOf(publication),
    hasActivePromotion: publication.hasActivePromotion,
  };
}

function currentPromotionOf(
  publication: PublicationWorkspaceItem,
): PromotionDetails | null {
  if (!publication.hasActivePromotion) return null;

  return {
    id: null,
    type: null,
    name: null,
    originalPrice: publication.regularPrice,
    promotionPrice: publication.price,
    discountPercent: publication.promotionDiscountPercent,
    startDate: null,
    finishDate: null,
  };
}
