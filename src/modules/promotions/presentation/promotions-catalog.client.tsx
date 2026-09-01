"use client";

import type { PromotionsPage } from "../domain/promotion.model";
import { PromotionsPagination } from "./promotions-pagination.client";
import { PromotionSelectionSummary } from "./promotion-selection-summary.client";
import { PromotionsTable } from "./promotions-table.client";

type Props = Readonly<{ page: PromotionsPage; activeSearch?: string }>;

export function PromotionsCatalogClient({ page, activeSearch = "" }: Props) {
  return <div className="promotions-layout">
    <PromotionSelectionSummary />
    <PromotionsPagination page={page}>
      {page.publications.length > 0
        ? <PromotionsTable page={page} />
        : activeSearch
          ? <p>No encontramos publicaciones para esta búsqueda: &quot;{activeSearch}&quot;.</p>
          : <p>No se encontraron publicaciones.</p>}
    </PromotionsPagination>
  </div>;
}
