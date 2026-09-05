"use client";

import {
  Button,
  Checkbox,
  Table,
} from "antd";
import type { TableColumnsType } from "antd";
import SkeletonInput from "antd/es/skeleton/Input";
import {
  useState,
  type CSSProperties,
} from "react";

import type {
  PromotionCampaign,
} from "../domain/promotion-campaign.model";
import type {
  PromotionCampaignItem,
} from "../domain/promotion-campaign-items.model";
import type {
  PromotionRow,
  PromotionsPage,
} from "../domain/promotion.model";
import {
  promotionOptionToRemovalSelection,
} from "../domain/promotion-removal.mapper";
import type {
  PromotionOption,
} from "../domain/promotions.repository";

import { DealPromotionModal } from "./deal-promotion-modal.client";
import {
  PromotionDeactivationModal,
  type PromotionDeactivationSelection,
} from "./promotion-deactivation-modal.client";
import {
  promotionSelection,
  promotionSelectionKey,
  usePromotionGlobalStore,
} from "./promotion-global.store";
import { getPromotionOptions } from "./promotion-options.action";
import {
  enqueuePromotionOptionsLoad,
} from "./promotion-options.queue.client";
import { PromotionOptionsModal } from "./promotion-options-modal.client";
import {
  DiscountCell,
  FinalPriceCell,
  NetCell,
  optionName,
  PromotionContent,
  PublicationCell,
  RecommendationText,
} from "./promotions-table-cells";
import {
  PromotionViewportLoader,
} from "./promotion-viewport-loader.client";

type Props = Readonly<{
  page: PromotionsPage;
}>;

type DealSelection = Readonly<{
  campaign: PromotionCampaign;
  item: PromotionCampaignItem;
}>;

type DisplayState =
  | "loading"
  | "error"
  | "empty"
  | "option";

type DisplayRow = Readonly<{
  key: string;
  publication: PromotionRow;
  option: PromotionOption | null;
  state: DisplayState;
  publicationRowSpan: number;
  firstInGroup: boolean;
  lastInGroup: boolean;
}>;

const missingValue = "—";

export function PromotionsTable({
  page,
}: Props) {
  const [deal, setDeal] =
    useState<DealSelection | null>(null);

  const [legacyRow, setLegacyRow] =
    useState<PromotionRow | null>(null);

  const [deactivating, setDeactivating] =
    useState<PromotionDeactivationSelection | null>(
      null,
    );

  const optionsByItem =
    usePromotionGlobalStore(
      (state) => state.optionsByItem,
    );

  const selections =
    usePromotionGlobalStore(
      (state) => state.selections,
    );

  const startOptionsLoad =
    usePromotionGlobalStore(
      (state) => state.startOptionsLoad,
    );

  const saveOptions =
    usePromotionGlobalStore(
      (state) => state.saveOptions,
    );

  const failOptions =
    usePromotionGlobalStore(
      (state) => state.failOptions,
    );

  const toggleSelection =
    usePromotionGlobalStore(
      (state) => state.toggleSelection,
    );

  function loadOptions(
    publication: PromotionRow,
  ): void {
    const cached =
      optionsByItem[publication.itemId];

    if (
      cached?.status === "loading" ||
      cached?.status === "success"
    ) {
      return;
    }

    startOptionsLoad(publication.itemId);

    enqueuePromotionOptionsLoad(async () => {
      try {
        saveOptions(
          publication.itemId,
          await getPromotionOptions(
            publication.itemId,
          ),
        );
      } catch {
        failOptions(publication.itemId);
      }
    });
  }

  const rows = displayRows(
    page.publications,
    optionsByItem,
  );

  const columns: TableColumnsType<DisplayRow> = [
    {
      title: "PUBLICACIÓN",
      key: "publication",
      width: 310,
      onCell: (row) => ({
        rowSpan: row.publicationRowSpan,
        style: groupCellStyle(
          row,
          true,
        ),
      }),
      render: (_, row) =>
        row.publicationRowSpan > 0 ? (
          <PromotionViewportLoader
            itemId={row.publication.itemId}
            onVisible={() =>
              loadOptions(row.publication)
            }
          >
            <PublicationCell
              publication={row.publication}
            />
          </PromotionViewportLoader>
        ) : null,
    },
    {
      title: "",
      key: "selection",
      width: 42,
      onCell: (row) => ({
        style: groupCellStyle(row),
      }),
      render: (_, row) =>
        row.state === "loading" ? (
          <FieldSkeleton
            label="Cargando selección"
            width={18}
          />
        ) : (
          <SelectionCell
            row={row}
            selections={selections}
            onToggle={toggleSelection}
          />
        ),
    },
    {
      title: "PROMOCIÓN",
      key: "promotion",
      width: 245,
      onCell: (row) => ({
        style: groupCellStyle(row),
      }),
      render: (_, row) => (
        <PromotionCell
          row={row}
          onRetry={() =>
            loadOptions(row.publication)
          }
        />
      ),
    },
    {
      title: "DESCUENTO",
      key: "discount",
      width: 200,
      onCell: (row) => ({
        style: groupCellStyle(row),
      }),
      render: (_, row) =>
        row.state === "loading" ? (
          <FieldSkeleton
            label="Cargando descuento"
          />
        ) : row.option ? (
          <DiscountCell
            option={row.option}
          />
        ) : null,
    },
    {
      title: "PRECIO FINAL",
      key: "price",
      width: 150,
      onCell: (row) => ({
        style: groupCellStyle(row),
      }),
      render: (_, row) =>
        row.state === "loading" ? (
          <FieldSkeleton
            label="Cargando precio final"
          />
        ) : row.option ? (
          <FinalPriceCell
            option={row.option}
          />
        ) : null,
    },
    {
      title: "RECIBÍS",
      key: "net",
      width: 160,
      onCell: (row) => ({
        style: groupCellStyle(row),
      }),
      render: (_, row) =>
        row.state === "loading" ? (
          <FieldSkeleton
            label="Cargando importe neto"
          />
        ) : row.option ? (
          <NetCell option={row.option} />
        ) : null,
    },
    {
      title: "TAREAS Y RECOMENDACIONES",
      key: "tasks",
      width: 260,
      onCell: (row) => ({
        style: groupCellStyle(
          row,
          false,
          true,
        ),
      }),
      render: (_, row) =>
        row.state === "loading" ? (
          <FieldSkeleton
            label="Cargando tareas"
          />
        ) : row.option ? (
          <TaskAction
            publication={row.publication}
            option={row.option}
            onDeactivate={(option) =>
              setDeactivating({
                publication:
                  row.publication,
                option,
              })
            }
            onDeal={setDeal}
            onLegacy={() =>
              setLegacyRow(
                row.publication,
              )
            }
          />
        ) : null,
    },
  ];

  return (
    <>
      <Table<DisplayRow>
        rowKey="key"
        dataSource={rows}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 1367 }}
      />

      <PromotionDeactivationModal
        key={
          `deactivate:${
            deactivating?.publication
              .itemId ?? "none"
          }:${
            deactivating?.option.type ??
            ""
          }:${
            deactivating?.option.id ?? ""
          }:${
            deactivating?.option
              .offerId ?? ""
          }`
        }
        selection={deactivating}
        open={deactivating !== null}
        onClose={() =>
          setDeactivating(null)
        }
      />

      <PromotionOptionsModal
        key={
          `apply:${
            legacyRow?.itemId ?? "none"
          }`
        }
        row={legacyRow}
        open={legacyRow !== null}
        onClose={() =>
          setLegacyRow(null)
        }
      />

      {deal ? (
        <DealPromotionModal
          key={deal.item.itemId}
          campaign={deal.campaign}
          item={deal.item}
          onClose={() =>
            setDeal(null)
          }
        />
      ) : null}
    </>
  );
}

function displayRows(
  publications:
    readonly PromotionRow[],
  cache:
    ReturnType<
      typeof usePromotionGlobalStore.getState
    >["optionsByItem"],
): DisplayRow[] {
  return publications.flatMap(
    (publication) => {
      const entry =
        cache[publication.itemId];

      if (
        !entry ||
        entry.status === "loading"
      ) {
        return [
          placeholderRow(
            publication,
            "loading",
          ),
        ];
      }

      if (entry.status === "error") {
        return [
          placeholderRow(
            publication,
            "error",
          ),
        ];
      }

      if (entry.options.length === 0) {
        return [
          placeholderRow(
            publication,
            "empty",
          ),
        ];
      }

      const options = [
        ...entry.options,
      ]
        .filter(hasVisibleAction)
        .sort(
          (left, right) =>
            statusOrder(left.status) -
            statusOrder(right.status),
        );

      /*
       * Mercado Libre no muestra propuestas
       * que el vendedor no puede ejecutar.
       *
       * Si después del filtro esta publicación
       * no tiene ninguna promoción accionable,
       * no agregamos filas vacías.
       */
      if (options.length === 0) {
        return [];
      }

      return options.map(
        (option, index) => ({
          key: promotionSelectionKey(
            publication.itemId,
            option,
          ),
          publication,
          option,
          state: "option" as const,
          publicationRowSpan:
            index === 0
              ? options.length
              : 0,
          firstInGroup:
            index === 0,
          lastInGroup:
            index ===
            options.length - 1,
        }),
      );
    },
  );
}

function placeholderRow(
  publication: PromotionRow,
  state: Exclude<
    DisplayState,
    "option"
  >,
): DisplayRow {
  return {
    key:
      `${publication.itemId}:${state}`,
    publication,
    option: null,
    state,
    publicationRowSpan: 1,
    firstInGroup: true,
    lastInGroup: true,
  };
}

function statusOrder(
  status: string | null,
): number {
  if (status === "started") return 0;
  if (status === "candidate") return 1;
  if (status === "pending") return 2;

  return 3;
}

function PromotionCell({
  row,
  onRetry,
}: Readonly<{
  row: DisplayRow;
  onRetry: () => void;
}>) {
  if (row.state === "loading") {
    return (
      <FieldSkeleton
        label="Cargando promoción"
      />
    );
  }

  if (row.state === "error") {
    return (
      <div>
        <div>
          No se pudieron cargar.
        </div>

        <Button
          size="small"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (row.state === "empty") {
    return "Sin promociones disponibles";
  }

  return row.option ? (
    <PromotionContent
      option={row.option}
    />
  ) : null;
}

function SelectionCell({
  row,
  selections,
  onToggle,
}: Readonly<{
  row: DisplayRow;
  selections:
    ReturnType<
      typeof usePromotionGlobalStore.getState
    >["selections"];
  onToggle: (
    selection:
      ReturnType<
        typeof promotionSelection
      >,
  ) => void;
}>) {
  const option = row.option;

  if (
    !option ||
    !isSelectable(option)
  ) {
    return null;
  }

  const selection =
    promotionSelection(
      row.publication,
      option,
    );

  return (
    <Checkbox
      aria-label={
        `Seleccionar ${
          optionName(option)
        }`
      }
      checked={Boolean(
        selections[selection.key],
      )}
      onChange={() =>
        onToggle(selection)
      }
    />
  );
}

function TaskAction({
  publication,
  option,
  onDeactivate,
  onDeal,
  onLegacy,
}: Readonly<{
  publication: PromotionRow;
  option: PromotionOption;
  onDeactivate: (
    option: PromotionOption,
  ) => void;
  onDeal: (
    selection: DealSelection,
  ) => void;
  onLegacy: () => void;
}>) {
  const canDeactivate =
    (option.status === "started" ||
      option.status === "pending") &&
    option.canRemove &&
    promotionOptionToRemovalSelection(
      option,
    );

  return (
    <div>
      <RecommendationText
        option={option}
      />

      {canDeactivate ? (
        <Button
          type="link"
          size="small"
          style={{ paddingInline: 0 }}
          onClick={() =>
            onDeactivate(option)
          }
        >
          Dejar de participar
        </Button>
      ) : null}

      {option.status === "candidate" &&
      option.canApply &&
      option.type === "DEAL" &&
      option.id ? (
        <Button
          size="small"
          type="primary"
          onClick={() =>
            onDeal(
              dealSelection(
                publication,
                option,
                option.id!,
              ),
            )
          }
        >
          Participar
        </Button>
      ) : null}

      {option.status === "candidate" &&
      option.canApply &&
      option.type !== "DEAL" &&
      completeLegacyOption(option) ? (
        <Button
          size="small"
          type="primary"
          onClick={onLegacy}
        >
          Participar
        </Button>
      ) : null}

      {!canDeactivate &&
      !(
        option.status === "candidate" &&
        option.canApply
      ) ? (
        <span>{missingValue}</span>
      ) : null}
    </div>
  );
}

function hasVisibleAction(
  option: PromotionOption,
): boolean {
  /*
   * Activas y programadas:
   * sólo visibles si existe una baja real.
   */
  if (
    option.status === "started" ||
    option.status === "pending"
  ) {
    return Boolean(
      option.canRemove &&
        promotionOptionToRemovalSelection(
          option,
        ),
    );
  }

  /*
   * Propuestas nuevas:
   * sólo visibles si realmente podemos
   * ofrecerle al usuario el botón Participar.
   */
  if (
    option.status !== "candidate" ||
    !option.canApply
  ) {
    return false;
  }

  if (option.type === "DEAL") {
    return Boolean(option.id);
  }

  return completeLegacyOption(option);
}

function isSelectable(
  option: PromotionOption,
): boolean {
  return (
    option.canApply &&
    option.status === "candidate"
  );
}

function dealSelection(
  publication: PromotionRow,
  option: PromotionOption,
  promotionId: string,
): DealSelection {
  return {
    campaign: {
      id: promotionId,
      name: option.name,
      type: "DEAL",
      status:
        option.status ?? "candidate",
      startDate: option.startDate,
      finishDate:
        option.finishDate,
      deadlineDate: null,
    },

    item: {
      itemId: publication.itemId,
      title: publication.title,
      thumbnail:
        publication.thumbnail,
      sku: publication.sku,
      stock: publication.stock,
      freeShipping:
        publication.freeShipping,
      installmentLabel:
        publication.installmentLabel,
      status: option.status,
      eligible: option.canApply,
      currentPrice:
        option.originalPrice ??
        publication.price,
      promotionPrice:
        option.promotionPrice,
      minPromotionPrice:
        option.minPromotionPrice,
      maxPromotionPrice:
        option.maxPromotionPrice,
      suggestedPromotionPrice:
        option.suggestedPromotionPrice,
      requiresPriceSelection:
        option.requiresPriceSelection,
      sellerDiscountAmount:
        option.sellerDiscountAmount,
      mercadoLibreBaseContributionAmount:
        option
          .mercadoLibreBaseContributionAmount,
      mercadoLibreBoostAmount:
        option.mercadoLibreBoostAmount,
      mercadoLibreContributionAmount:
        option
          .mercadoLibreContributionAmount,
      estimatedNetAmount:
        option.estimatedNetAmount,
    },
  };
}

function completeLegacyOption(
  option: PromotionOption,
): boolean {
  if (
    option.type === "PRICE_DISCOUNT"
  ) {
    return (
      option.promotionPrice !== null &&
      Boolean(
        option.startDate &&
          option.finishDate,
      )
    );
  }

  if (
    option.type ===
    "SELLER_CAMPAIGN"
  ) {
    return (
      Boolean(option.id) &&
      option.promotionPrice !== null
    );
  }

  if (option.type === "SMART") {
    return Boolean(
      option.id &&
        option.offerId,
    );
  }

  return false;
}

function FieldSkeleton({
  label,
  width = 88,
}: Readonly<{
  label: string;
  width?: number;
}>) {
  return (
    <span aria-label={label}>
      <SkeletonInput
        active
        size="small"
        style={{
          width,
          minWidth: width,
        }}
      />
    </span>
  );
}

function groupCellStyle(
  row: DisplayRow,
  publication = false,
  lastColumn = false,
): CSSProperties {
  const candidate =
    row.option?.status === "candidate";

  return {
    background:
      publication
        ? "#fff"
        : candidate
          ? "#f4faff"
          : "#fff",

    borderTop:
      row.firstInGroup
        ? "8px solid #f5f5f5"
        : undefined,

    borderBottom:
      publication ||
      row.lastInGroup
        ? "1px solid #e5e7eb"
        : undefined,

    borderLeft:
      publication
        ? "1px solid #f0f0f0"
        : undefined,

    borderRight:
      lastColumn
        ? "1px solid #f0f0f0"
        : undefined,

    verticalAlign:
      publication
        ? "top"
        : "middle",

    paddingTop: 14,
    paddingBottom: 14,
  };
}
