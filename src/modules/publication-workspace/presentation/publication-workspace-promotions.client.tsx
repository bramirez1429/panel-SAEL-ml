"use client";

import { Button, Checkbox, Space, Spin, Typography } from "antd";
import { useId, useMemo, useState } from "react";

import { publicationTitlePresentation } from "@/shared/lib/publication-size";

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
        publications: group.publications,
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

        {selection.type === "family"
          ? promotionGroups.map((group) => (
              <PublicationVariantPreview
                key={`${selection.familyId}:${group.key}`}
                label={group.label ?? "Otras variantes"}
                publications={group.publications}
              />
            ))
          : promotionGroups.map((group) => {
              // Individual publications keep their original promotion workflow.
              const groupResolved = group.page.publications.every((publication) => {
                const cached = optionsByItem[publication.itemId];
                return cached?.status === "success" || cached?.status === "error";
              });

              return (
                <section key={group.key} style={{ width: "100%" }}>
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

/**
 * Paso 1: solamente muestra la agrupación que ya llegó en selection.children.
 * No monta PromotionsTable ni ejecuta acciones para consultar promociones.
 */
function PublicationVariantPreview({
  label,
  publications,
}: Readonly<{
  label: string;
  publications: readonly PublicationWorkspaceItem[];
}>) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <section aria-label={`Variantes de ${label}`} style={{ width: "100%" }}>
      <Button
        type="text"
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`${expanded ? "Cerrar" : "Abrir"} ${label}`}
        onClick={() => setExpanded((current) => !current)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f3f7fc",
          border: "1px solid #e5eaf1",
          borderRadius: 8,
          minHeight: 48,
          height: "auto",
          padding: "10px 16px",
          width: "100%",
          textAlign: "left",
          whiteSpace: "normal",
        }}
      >
        <span>
          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>{" "}
          <strong>{label}</strong>
        </span>
        <Typography.Text type="secondary">
          {publications.length} {publications.length === 1 ? "talle" : "talles"}
        </Typography.Text>
      </Button>
      {expanded ? (
        <ul
          id={contentId}
          aria-label={`Talles de ${label}`}
          style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}
        >
          {publications.map((publication) => {
            const size = workspacePublicationSize(publication);
            return (
              <li
                key={publication.itemId}
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: "1px solid #e5eaf1",
                }}
              >
                <strong style={{ minWidth: 72 }}>
                  {size ? `Talle ${size}` : "Sin talle"}
                </strong>
                <span style={{ flex: "1 1 180px" }}>{publication.title}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {publication.itemId}
                </Typography.Text>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function workspacePublicationSize(publication: PublicationWorkspaceItem): string | null {
  const sizeAttribute = publication.attributes?.find((attribute) => {
    const descriptor = `${attribute.id} ${attribute.name ?? ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/gu, "")
      .toUpperCase();
    return /\b(SIZE|TALLE|TALLA)\b/u.test(descriptor);
  });
  return sizeAttribute?.value?.trim() || publicationTitlePresentation(publication.title).size;
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
