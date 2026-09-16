"use client";

import { useState } from "react";

import type { PromotionsPage } from "../domain/promotion.model";
import { PromotionBulkDeactivationLauncher } from "./promotion-bulk-deactivation-launcher.client";
import type { PromotionDeactivationSelection } from "./promotion-deactivation-modal.client";
import { promotionDeactivationKey } from "./promotion-deactivation.helpers";
import { PromotionsPagination } from "./promotions-pagination.client";
import { PromotionSelectionSummary } from "./promotion-selection-summary.client";
import { PromotionsTable } from "./promotions-table.client";

type Props = Readonly<{ page: PromotionsPage; activeSearch?: string }>;

export function PromotionsCatalogClient({ page, activeSearch = "" }: Props) {
  const [selectedForRemoval, setSelectedForRemoval] = useState<Readonly<Record<string, PromotionDeactivationSelection>>>({});

  function toggleRemovalSelection(selection: PromotionDeactivationSelection): void {
    const key = promotionDeactivationKey(selection.publication.itemId, selection.option);
    setSelectedForRemoval((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = selection;
      return next;
    });
  }

  function removeSuccessfulSelections(selections: readonly PromotionDeactivationSelection[]): void {
    setSelectedForRemoval((current) => {
      const next = { ...current };
      selections.forEach((selection) => {
        delete next[promotionDeactivationKey(selection.publication.itemId, selection.option)];
      });
      return next;
    });
  }

  return <div className="promotions-layout">
    <PromotionSelectionSummary />
    <PromotionBulkDeactivationLauncher
      publications={page.publications}
      selectedForRemoval={selectedForRemoval}
      onSuccessfulRemoval={removeSuccessfulSelections}
    />
    <PromotionsPagination page={page}>
      {page.publications.length > 0
        ? <PromotionsTable
          page={page}
          selectedForRemoval={selectedForRemoval}
          onToggleRemoval={toggleRemovalSelection}
        />
        : activeSearch
          ? <p>No encontramos publicaciones para esta búsqueda: &quot;{activeSearch}&quot;.</p>
          : <p>No se encontraron publicaciones.</p>}
    </PromotionsPagination>
  </div>;
}
