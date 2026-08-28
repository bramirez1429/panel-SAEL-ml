"use client";

import { Button, Checkbox, Image, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import SkeletonInput from "antd/es/skeleton/Input";
import { useState, type ReactNode } from "react";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import type { PromotionCampaignItem } from "../domain/promotion-campaign-items.model";
import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { DealPromotionModal } from "./deal-promotion-modal.client";
import { PromotionDeactivationModal } from "./promotion-deactivation-modal.client";
import { promotionSelection, promotionSelectionKey, usePromotionGlobalStore } from "./promotion-global.store";
import { getPromotionOptions } from "./promotion-options.action";
import { PromotionOptionsModal } from "./promotion-options-modal.client";

type Props = Readonly<{ page: PromotionsPage }>;
type DealSelection = Readonly<{ campaign: PromotionCampaign; item: PromotionCampaignItem }>;
type DisplayState = "collapsed" | "loading" | "error" | "empty" | "option";
type DisplayRow = Readonly<{
  key: string;
  publication: PromotionRow;
  option: PromotionOption | null;
  state: DisplayState;
  publicationRowSpan: number;
}>;

const missingValue = "—";
const moneyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PromotionsTable({ page }: Props) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [deactivating, setDeactivating] = useState<PromotionRow | null>(null);
  const [deal, setDeal] = useState<DealSelection | null>(null);
  const [legacyRow, setLegacyRow] = useState<PromotionRow | null>(null);
  const optionsByItem = usePromotionGlobalStore((state) => state.optionsByItem);
  const selections = usePromotionGlobalStore((state) => state.selections);
  const startOptionsLoad = usePromotionGlobalStore((state) => state.startOptionsLoad);
  const saveOptions = usePromotionGlobalStore((state) => state.saveOptions);
  const failOptions = usePromotionGlobalStore((state) => state.failOptions);
  const toggleSelection = usePromotionGlobalStore((state) => state.toggleSelection);

  async function loadOptions(publication: PromotionRow): Promise<void> {
    const cached = optionsByItem[publication.itemId];
    if (cached?.status === "loading" || cached?.status === "success") return;
    startOptionsLoad(publication.itemId);
    try {
      saveOptions(publication.itemId, await getPromotionOptions(publication.itemId));
    } catch {
      failOptions(publication.itemId);
    }
  }

  function toggleExpanded(publication: PromotionRow): void {
    const next = new Set(expanded);
    if (next.has(publication.itemId)) next.delete(publication.itemId);
    else {
      next.add(publication.itemId);
      void loadOptions(publication);
    }
    setExpanded(next);
  }

  const rows = displayRows(page.publications, expanded, optionsByItem);
  const columns: TableColumnsType<DisplayRow> = [
    {
      title: "PUBLICACIÓN", key: "publication", width: 300,
      onCell: (row) => ({ rowSpan: row.publicationRowSpan }),
      render: (_, row) => row.publicationRowSpan > 0
        ? <PublicationCell publication={row.publication} expanded={expanded.has(row.publication.itemId)} onToggle={() => toggleExpanded(row.publication)} />
        : null,
    },
    {
      title: "", key: "selection", width: 44,
      render: (_, row) => <SelectionCell row={row} selections={selections} onToggle={toggleSelection} />,
    },
    {
      title: "PROMOCIÓN", key: "promotion",
      render: (_, row) => <PromotionCell row={row} onRetry={() => void loadOptions(row.publication)} />,
    },
    { title: "DESCUENTO", key: "discount", render: (_, row) => row.option ? discountText(row.option) : null },
    { title: "PRECIO FINAL", key: "price", render: (_, row) => row.option ? promotionPrice(row.option) : null },
    { title: "RECIBÍS", key: "net", render: (_, row) => row.option ? netText(row.option) : null },
    {
      title: "TAREAS", key: "tasks", width: 210,
      render: (_, row) => row.option ? <TaskAction
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
  expanded: ReadonlySet<string>,
  cache: ReturnType<typeof usePromotionGlobalStore.getState>["optionsByItem"],
): DisplayRow[] {
  return publications.flatMap((publication) => {
    if (!expanded.has(publication.itemId)) return [placeholderRow(publication, "collapsed")];
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
    }));
  });
}

function placeholderRow(publication: PromotionRow, state: Exclude<DisplayState, "option">): DisplayRow {
  return { key: `${publication.itemId}:${state}`, publication, option: null, state, publicationRowSpan: 1 };
}

function statusOrder(status: string | null): number {
  if (status === "started") return 0;
  if (status === "candidate") return 1;
  if (status === "pending") return 2;
  return 3;
}

function PublicationCell({ publication, expanded, onToggle }: Readonly<{ publication: PromotionRow; expanded: boolean; onToggle: () => void }>) {
  return <Space align="start">
    <Button type="text" aria-label={`${expanded ? "Cerrar" : "Expandir"} ${publication.itemId}`} onClick={onToggle}>{expanded ? "⌄" : "›"}</Button>
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
  if (row.state === "collapsed") return missingValue;
  if (row.state === "loading") return <SkeletonInput active size="small" />;
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
  if (option.status === "started") return option.canRemove ? <Button size="small" onClick={onDeactivate}>Dejar de participar</Button> : missingValue;
  if (option.status === "pending") return "Programada";
  if (option.status !== "candidate" || !option.canApply) return missingValue;
  if (option.type === "DEAL" && option.id) {
    const promotionId = option.id;
    return <Button size="small" type="primary" onClick={() => onDeal(dealSelection(publication, option, promotionId))}>Participar</Button>;
  }
  return option.type !== "DEAL" && completeLegacyOption(option)
    ? <Button size="small" onClick={onLegacy}>Participar</Button>
    : missingValue;
}

function isSelectable(option: PromotionOption): boolean {
  return option.canApply && (option.status === "candidate" || option.status === "pending");
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
  return <div>{suggested !== null ? `${money(suggested)} sugerido` : "Definir precio"}{range ? <><br /><small>{range}</small></> : null}</div>;
}

function netText(option: PromotionOption): string {
  if (option.estimatedNetAmount !== null) return money(option.estimatedNetAmount);
  return option.requiresPriceSelection === true ? "Se calcula al elegir precio" : missingValue;
}

function money(value: number): string {
  return moneyFormatter.format(value);
}
