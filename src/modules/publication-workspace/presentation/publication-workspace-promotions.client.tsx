"use client";

import { Checkbox, Divider, Space, Spin, Typography } from "antd";
import { useMemo, useState } from "react";

import {
  applyPublicationVisualOrder,
  groupPublicationsByVariant,
  type PublicationVisualOrder,
} from "@/shared/lib/publication-variant";

import type {
  PromotionDetails,
  PromotionRow,
  PromotionsPage,
} from "@/modules/promotions/domain/promotion.model";
import { PromotionBulkDeactivationLauncher } from "@/modules/promotions/presentation/promotion-bulk-deactivation-launcher.client";
import type { PromotionDeactivationSelection } from "@/modules/promotions/presentation/promotion-deactivation-modal.client";
import { promotionDeactivationKey } from "@/modules/promotions/presentation/promotion-deactivation.helpers";
import {
  promotionSelection,
  usePromotionGlobalStore,
} from "@/modules/promotions/presentation/promotion-global.store";
import { PromotionSelectionSummary } from "@/modules/promotions/presentation/promotion-selection-summary.client";
import {
  isApplicablePromotionOption,
  PromotionsTable,
} from "@/modules/promotions/presentation/promotions-table.client";

import type {
  PublicationWorkspaceItem,
  PublicationWorkspaceSelection,
} from "../domain/publication-workspace.model";

export function PublicationWorkspacePromotions({
  onChanged,
  selection,
  visualOrder,
}: Readonly<{
  onChanged?: () => void | Promise<void>;
  selection: PublicationWorkspaceSelection;
  visualOrder: PublicationVisualOrder;
}>) {
  const { promotionGroups, promotionRows } = useMemo(() => {
    const publicationGroups = selection.type === "family"
      ? applyPublicationVisualOrder(
          groupPublicationsByVariant(selection.children),
          visualOrder,
        )
      : [{
          key: selection.publication.itemId,
          label: null,
          publications: [selection.publication],
        }];
    const groups = publicationGroups.map((group) => {
      const publications = group.publications.map(toPromotionRow);
      return {
        key: group.key,
        label: group.label,
        page: toPromotionsPage(publications),
      };
    });

    return {
      promotionGroups: groups,
      promotionRows: groups.flatMap((group) => group.page.publications),
    };
  }, [selection, visualOrder]);
  const [selectedForRemoval, setSelectedForRemoval] = useState<
    Readonly<Record<string, PromotionDeactivationSelection>>
  >({});
  const optionsByItem = usePromotionGlobalStore((state) => state.optionsByItem);
  const selections = usePromotionGlobalStore((state) => state.selections);
  const toggleSelection = usePromotionGlobalStore((state) => state.toggleSelection);
  const removeSelections = usePromotionGlobalStore((state) => state.removeSelections);

  const applicableSelections = promotionRows.flatMap((publication) => {
    const cached = optionsByItem[publication.itemId];
    if (cached?.status !== "success") return [];

    return cached.options
      .filter(isApplicablePromotionOption)
      .map((option) => promotionSelection(publication, option));
  });
  const applicableKeys = applicableSelections.map(({ key }) => key);
  const selectedApplicableCount = applicableKeys.filter(
    (key) => Boolean(selections[key]),
  ).length;
  const allApplicableSelected =
    applicableKeys.length > 0 &&
    selectedApplicableCount === applicableKeys.length;
  const someApplicableSelected =
    selectedApplicableCount > 0 && !allApplicableSelected;

  function toggleAllApplicable(checked: boolean): void {
    if (!checked) {
      removeSelections(applicableKeys);
      return;
    }

    applicableSelections.forEach((promotion) => {
      if (!selections[promotion.key]) toggleSelection(promotion);
    });
  }

  function toggleRemoval(selection: PromotionDeactivationSelection): void {
    const key = promotionDeactivationKey(
      selection.publication.itemId,
      selection.option,
    );
    setSelectedForRemoval((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = selection;
      return next;
    });
  }

  function removeSuccessfulSelections(
    removed: readonly PromotionDeactivationSelection[],
  ): void {
    setSelectedForRemoval((current) => {
      const next = { ...current };
      removed.forEach(({ publication, option }) => {
        delete next[promotionDeactivationKey(publication.itemId, option)];
      });
      return next;
    });
  }

  return (
    <section
      aria-label="Promociones de la selección"
      style={{ width: "100%" }}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Checkbox
          checked={allApplicableSelected}
          disabled={applicableKeys.length === 0}
          indeterminate={someApplicableSelected}
          onChange={(event) => toggleAllApplicable(event.target.checked)}
        >
          Seleccionar todas
        </Checkbox>

        <PromotionSelectionSummary selectionKeys={applicableKeys} onCompleted={onChanged} />

        <PromotionBulkDeactivationLauncher
          publications={promotionRows}
          selectedForRemoval={selectedForRemoval}
          onCompleted={onChanged}
          onSuccessfulRemoval={removeSuccessfulSelections}
        />

        {promotionGroups.map((group) => {
          const groupResolved = group.page.publications.every((publication) => {
            const cached = optionsByItem[publication.itemId];
            return cached?.status === "success" || cached?.status === "error";
          });

          return (
            <section key={group.key} style={{ width: "100%" }}>
              {selection.type === "family" && group.label ? (
                <Divider titlePlacement="start">{group.label}</Divider>
              ) : null}
              {!groupResolved ? (
                <Space align="center" style={{ minHeight: 120, justifyContent: "center", width: "100%" }}>
                  <Spin size="small" />
                  <Typography.Text type="secondary">Cargando promociones...</Typography.Text>
                </Space>
              ) : null}
              <div style={{ display: groupResolved ? "block" : "none" }}>
                <PromotionsTable
                  directParticipation
                  loadAllOnMount
                  page={group.page}
                  selectedForRemoval={selectedForRemoval}
                  onChanged={onChanged}
                  onToggleRemoval={toggleRemoval}
                />
              </div>
            </section>
          );
        })}
      </Space>
    </section>
  );
}

function toPromotionsPage(publications: readonly PromotionRow[]): PromotionsPage {
  return {
    publications,
    done: true,
    nextCursor: null,
    count: publications.length,
  };
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
