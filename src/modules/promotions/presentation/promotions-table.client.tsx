"use client";

import { Button, Checkbox, Image, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import SkeletonInput from "antd/es/skeleton/Input";
import { useState, type CSSProperties, type ReactNode } from "react";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import type { PromotionCampaignItem } from "../domain/promotion-campaign-items.model";
import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { DealPromotionModal } from "./deal-promotion-modal.client";
import { PromotionDeactivationModal } from "./promotion-deactivation-modal.client";
import { promotionSelection, promotionSelectionKey, usePromotionGlobalStore } from "./promotion-global.store";
import { getPromotionOptions } from "./promotion-options.action";
import { enqueuePromotionOptionsLoad } from "./promotion-options.queue.client";
import { PromotionOptionsModal } from "./promotion-options-modal.client";
import { PromotionViewportLoader } from "./promotion-viewport-loader.client";

type Props = Readonly<{ page: PromotionsPage }>;
type DealSelection = Readonly<{ campaign: PromotionCampaign; item: PromotionCampaignItem }>;
type DisplayState = "loading" | "error" | "empty" | "option";
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
const moneyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PromotionsTable({ page }: Props) {
  const [deal, setDeal] = useState<DealSelection | null>(null);
  const [legacyRow, setLegacyRow] = useState<PromotionRow | null>(null);
  const [deactivating, setDeactivating] = useState<PromotionRow | null>(null);
  const optionsByItem = usePromotionGlobalStore((state) => state.optionsByItem);
  const selections = usePromotionGlobalStore((state) => state.selections);
  const startOptionsLoad = usePromotionGlobalStore((state) => state.startOptionsLoad);
  const saveOptions = usePromotionGlobalStore((state) => state.saveOptions);
  const failOptions = usePromotionGlobalStore((state) => state.failOptions);
  const toggleSelection = usePromotionGlobalStore((state) => state.toggleSelection);

  function loadOptions(publication: PromotionRow): void {
    const cached = optionsByItem[publication.itemId];
    if (cached?.status === "loading" || cached?.status === "success") return;
    startOptionsLoad(publication.itemId);
    enqueuePromotionOptionsLoad(async () => {
      try {
        saveOptions(publication.itemId, await getPromotionOptions(publication.itemId));
      } catch {
        failOptions(publication.itemId);
      }
    });
  }

  const rows = displayRows(page.publications, optionsByItem);
  const columns: TableColumnsType<DisplayRow> = [
    {
      title: "PUBLICACIÓN", key: "publication", width: 300,
      onCell: (row) => ({ rowSpan: row.publicationRowSpan, style: groupCellStyle(row, true) }),
      render: (_, row) => row.publicationRowSpan > 0
        ? <PromotionViewportLoader itemId={row.publication.itemId} onVisible={() => loadOptions(row.publication)}>
          <PublicationCell publication={row.publication} />
        </PromotionViewportLoader>
        : null,
    },
    {
      title: "", key: "selection", width: 44,
      onCell: (row) => ({ style: groupCellStyle(row) }),
      render: (_, row) => row.state === "loading"
        ? <FieldSkeleton label="Cargando selección" width={18} />
        : <SelectionCell row={row} selections={selections} onToggle={toggleSelection} />,
    },
    {
      title: "PROMOCIÓN", key: "promotion",
      onCell: (row) => ({ style: groupCellStyle(row) }),
      render: (_, row) => <PromotionCell row={row} onRetry={() => loadOptions(row.publication)} />,
    },
    { title: "DESCUENTO", key: "discount", onCell: (row) => ({ style: groupCellStyle(row) }), render: (_, row) => row.state === "loading" ? <FieldSkeleton label="Cargando descuento" /> : row.option ? discountText(row.option) : null },
    { title: "PRECIO FINAL", key: "price", onCell: (row) => ({ style: groupCellStyle(row) }), render: (_, row) => row.state === "loading" ? <FieldSkeleton label="Cargando precio final" /> : row.option ? promotionPrice(row.option) : null },
    { title: "RECIBÍS", key: "net", onCell: (row) => ({ style: groupCellStyle(row) }), render: (_, row) => row.state === "loading" ? <FieldSkeleton label="Cargando importe neto" /> : row.option ? netText(row.option) : null },
    {
      title: "TAREAS Y RECOMENDACIONES", key: "tasks", width: 210,
      onCell: (row) => ({ style: groupCellStyle(row, false, true) }),
      render: (_, row) => row.state === "loading" ? <FieldSkeleton label="Cargando tareas" /> : row.option ? <TaskAction
        publication={row.publication}
        option={row.option}
        onDeactivate={() => setDeactivating(row.publication)}
        onDeal={setDeal}
        onLegacy={() => setLegacyRow(row.publication)}
      /> : null,
    },
  ];

  return <>
    <Table<DisplayRow> rowKey="key" dataSource={rows} columns={columns} pagination={false} size="small" />
    <PromotionDeactivationModal key={`deactivate:${deactivating?.itemId ?? "none"}`} row={deactivating} open={deactivating !== null} onClose={() => setDeactivating(null)} />
    <PromotionOptionsModal key={`apply:${legacyRow?.itemId ?? "none"}`} row={legacyRow} open={legacyRow !== null} onClose={() => setLegacyRow(null)} />
    {deal ? <DealPromotionModal key={deal.item.itemId} campaign={deal.campaign} item={deal.item} onClose={() => setDeal(null)} /> : null}
  </>;
}

function displayRows(
  publications: readonly PromotionRow[],
  cache: ReturnType<typeof usePromotionGlobalStore.getState>["optionsByItem"],
): DisplayRow[] {
  return publications.flatMap((publication) => {
    const entry = cache[publication.itemId];
    if (!entry || entry.status === "loading") return [placeholderRow(publication, "loading")];
    if (entry.status === "error") return [placeholderRow(publication, "error")];
    if (entry.options.length === 0) return [placeholderRow(publication, "empty")];
    const options = [...entry.options].sort((left, right) => statusOrder(left.status) - statusOrder(right.status));
    return options.map((option, index) => ({
      key: promotionSelectionKey(publication.itemId, option),
      publication,
      option,
      state: "option" as const,
      publicationRowSpan: index === 0 ? options.length : 0,
      firstInGroup: index === 0,
      lastInGroup: index === options.length - 1,
    }));
  });
}

function placeholderRow(publication: PromotionRow, state: Exclude<DisplayState, "option">): DisplayRow {
  return { key: `${publication.itemId}:${state}`, publication, option: null, state, publicationRowSpan: 1, firstInGroup: true, lastInGroup: true };
}

function statusOrder(status: string | null): number {
  if (status === "started") return 0;
  if (status === "candidate") return 1;
  if (status === "pending") return 2;
  return 3;
}

function PublicationCell({ publication }: Readonly<{ publication: PromotionRow }>) {
  return <Space align="start">
    {publication.thumbnail ? <Image alt={publication.title} src={publication.thumbnail} width={56} height={56} preview={false} /> : null}
    <div>
      <Typography.Text strong>{publication.title}</Typography.Text><br />
      <Typography.Text type="secondary">{publication.itemId}</Typography.Text><br />
      {publication.familyId ? <Typography.Text type="secondary">Familia {publication.familyId}</Typography.Text> : null}
      <div>{money(publication.price)}</div>
    </div>
  </Space>;
}

function PromotionCell({ row, onRetry }: Readonly<{ row: DisplayRow; onRetry: () => void }>) {
  if (row.state === "loading") return <FieldSkeleton label="Cargando promoción" />;
  if (row.state === "error") return <Space orientation="vertical"><Typography.Text type="danger">No se pudieron cargar.</Typography.Text><Button size="small" onClick={onRetry}>Reintentar</Button></Space>;
  if (row.state === "empty") return "Sin promociones disponibles";
  const option = row.option;
  if (!option) return null;
  return <>
    {option.status === "started" ? <Tag color="green">ACTIVA</Tag> : null}
    {option.status === "pending" ? <Tag>Programada</Tag> : null}
    <div>{optionName(option)}</div>
  </>;
}

function SelectionCell({ row, selections, onToggle }: Readonly<{
  row: DisplayRow;
  selections: ReturnType<typeof usePromotionGlobalStore.getState>["selections"];
  onToggle: (selection: ReturnType<typeof promotionSelection>) => void;
}>) {
  const option = row.option;
  if (!option || !isSelectable(option)) return null;
  const selection = promotionSelection(row.publication, option);
  return <Checkbox
    aria-label={`Seleccionar ${optionName(option)}`}
    checked={Boolean(selections[selection.key])}
    onChange={() => onToggle(selection)}
  />;
}

function TaskAction({ publication, option, onDeactivate, onDeal, onLegacy }: Readonly<{
  publication: PromotionRow;
  option: PromotionOption;
  onDeactivate: () => void;
  onDeal: (selection: DealSelection) => void;
  onLegacy: () => void;
}>) {
  if (option.status === "started" || option.status === "pending") {
    return <Button type="link" size="small" onClick={onDeactivate}>Dejar de participar</Button>;
  }
  if (option.status !== "candidate" || !option.canApply) return missingValue;
  if (option.type === "DEAL" && option.id) {
    const promotionId = option.id;
    return <Button size="small" type="primary" onClick={() => onDeal(dealSelection(publication, option, promotionId))}>Participar</Button>;
  }
  return option.type !== "DEAL" && completeLegacyOption(option)
    ? <Button size="small" type="primary" onClick={onLegacy}>Participar</Button>
    : missingValue;
}

function isSelectable(option: PromotionOption): boolean {
  return option.canApply && option.status === "candidate";
}

function optionName(option: PromotionOption): string {
  return option.name ?? "Promoción de Mercado Libre";
}

function dealSelection(publication: PromotionRow, option: PromotionOption, promotionId: string): DealSelection {
  return {
    campaign: { id: promotionId, name: option.name, type: "DEAL", status: option.status ?? "candidate", startDate: option.startDate, finishDate: option.finishDate, deadlineDate: null },
    item: { itemId: publication.itemId, title: publication.title, thumbnail: publication.thumbnail, status: option.status, eligible: option.canApply, currentPrice: option.originalPrice ?? publication.price, promotionPrice: option.promotionPrice, minPromotionPrice: option.minPromotionPrice, maxPromotionPrice: option.maxPromotionPrice, suggestedPromotionPrice: option.suggestedPromotionPrice, requiresPriceSelection: option.requiresPriceSelection, sellerDiscountAmount: option.sellerDiscountAmount, mercadoLibreBaseContributionAmount: option.mercadoLibreBaseContributionAmount, mercadoLibreBoostAmount: option.mercadoLibreBoostAmount, mercadoLibreContributionAmount: option.mercadoLibreContributionAmount, estimatedNetAmount: option.estimatedNetAmount },
  };
}

function completeLegacyOption(option: PromotionOption): boolean {
  if (option.type === "PRICE_DISCOUNT") return option.promotionPrice !== null && Boolean(option.startDate && option.finishDate);
  if (option.type === "SELLER_CAMPAIGN") return Boolean(option.id) && option.promotionPrice !== null;
  if (option.type === "SMART") return Boolean(option.id && option.offerId);
  return false;
}

function discountText(option: PromotionOption): string {
  if (option.sellerDiscountAmount !== null) return money(option.sellerDiscountAmount);
  if (option.discountPercent !== null) return `${option.discountPercent}%`;
  return option.requiresPriceSelection === true ? "A definir" : missingValue;
}

function promotionPrice(option: PromotionOption): ReactNode {
  if (option.promotionPrice !== null && option.promotionPrice > 0) return money(option.promotionPrice);
  if (option.requiresPriceSelection !== true) return missingValue;
  const suggested = option.suggestedPromotionPrice !== null && option.suggestedPromotionPrice > 0 ? option.suggestedPromotionPrice : null;
  const range = option.minPromotionPrice !== null && option.maxPromotionPrice !== null ? `Rango ${money(option.minPromotionPrice)} - ${money(option.maxPromotionPrice)}` : null;
  return <div>{suggested !== null ? `${money(suggested)} sugerido` : "A definir"}{range ? <><br /><small>{range}</small></> : null}</div>;
}

function netText(option: PromotionOption): ReactNode {
  if (option.estimatedNetAmount !== null) return money(option.estimatedNetAmount);
  if (option.requiresPriceSelection === true && option.suggestedEstimatedNetAmount !== null) {
    return <div>{`≈ ${money(option.suggestedEstimatedNetAmount)}`}<br /><small>con precio sugerido</small></div>;
  }
  return option.requiresPriceSelection === true ? "Se calcula al elegir precio" : "No disponible";
}

function FieldSkeleton({ label, width = 88 }: Readonly<{ label: string; width?: number }>) {
  return <span aria-label={label}><SkeletonInput active size="small" style={{ width, minWidth: width }} /></span>;
}

function groupCellStyle(row: DisplayRow, publication = false, lastColumn = false): CSSProperties {
  return {
    background: "#fff",
    borderTop: row.firstInGroup ? "8px solid #f5f5f5" : undefined,
    borderBottom: publication || row.lastInGroup ? "1px solid #e5e7eb" : undefined,
    borderLeft: publication ? "1px solid #f0f0f0" : undefined,
    borderRight: lastColumn ? "1px solid #f0f0f0" : undefined,
    verticalAlign: publication ? "top" : "middle",
  };
}

function money(value: number): string {
  return moneyFormatter.format(value);
}
