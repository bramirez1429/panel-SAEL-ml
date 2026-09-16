"use client";

import { Button } from "antd";
import { useState } from "react";

import type { PromotionRow } from "../domain/promotion.model";
import { PromotionBulkDeactivationModal } from "./promotion-bulk-deactivation-modal.client";
import type { PromotionDeactivationSelection } from "./promotion-deactivation-modal.client";
import {
  isRemovablePromotionOption,
  promotionDeactivationKey,
} from "./promotion-deactivation.helpers";
import { usePromotionGlobalStore } from "./promotion-global.store";

type Props = Readonly<{
  publications: readonly PromotionRow[];
  selectedForRemoval: Readonly<Record<string, PromotionDeactivationSelection>>;
  onSuccessfulRemoval: (selections: readonly PromotionDeactivationSelection[]) => void;
}>;

export function PromotionBulkDeactivationLauncher({
  publications,
  selectedForRemoval,
  onSuccessfulRemoval,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reviewSelections, setReviewSelections] = useState<readonly PromotionDeactivationSelection[]>([]);
  const optionsByItem = usePromotionGlobalStore((state) => state.optionsByItem);
  const visibleRemovableSelections = publications.flatMap((publication) => {
    const entry = optionsByItem[publication.itemId];
    if (entry?.status !== "success") return [];
    return entry.options
      .filter(isRemovablePromotionOption)
      .map((option) => ({ publication, option }));
  });
  const removableSelections = uniqueSelections([
    ...Object.values(selectedForRemoval),
    ...visibleRemovableSelections,
  ]);
  const selectedCount = Object.keys(selectedForRemoval).length;

  function openReview(): void {
    setReviewSelections(removableSelections);
    setOpen(true);
  }

  if (selectedCount === 0 && !open) return null;

  return <>
    {selectedCount > 0 ? (
      <Button
        aria-label={`Dejar de participar de ${selectedCount} ${selectedCount === 1 ? "promoción" : "promociones"}`}
        danger
        style={{ marginBottom: 16 }}
        onClick={openReview}
      >
        Dejar de participar de {selectedCount} {selectedCount === 1 ? "promoción" : "promociones"}
      </Button>
    ) : null}
    {open ? (
      <PromotionBulkDeactivationModal
        selections={reviewSelections}
        initialSelectedKeys={Object.keys(selectedForRemoval)}
        onSuccessfulRemoval={onSuccessfulRemoval}
        onClose={() => setOpen(false)}
      />
    ) : null}
  </>;
}

function uniqueSelections(
  selections: readonly PromotionDeactivationSelection[],
): readonly PromotionDeactivationSelection[] {
  const unique = new Map<string, PromotionDeactivationSelection>();
  selections.forEach((selection) => {
    const key = promotionDeactivationKey(selection.publication.itemId, selection.option);
    unique.set(key, selection);
  });
  return [...unique.values()];
}
