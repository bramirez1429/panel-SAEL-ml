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
import {
  type CachedPromotionOptions,
  promotionSelection,
  promotionSelectionKey,
  usePromotionGlobalStore,
} from "./promotion-global.store";
import { getPromotionOptions } from "./promotion-options.action";
import { PromotionOptionsModal } from "./promotion-options-modal.client";

type Props = Readonly<{ page: PromotionsPage }>;
type DealSelection = Readonly<{ campaign: PromotionCampaign; item: PromotionCampaignItem }>;

const missingValue = "—";
const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const optionStyle = { minHeight: 72, paddingBlock: 8 } as const;

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

  async function loadOptions(row: PromotionRow): Promise<void> {
    const cached = optionsByItem[row.itemId];
    if (cached?.status === "loading" || cached?.status === "success") return;
    startOptionsLoad(row.itemId);
    try {
      saveOptions(row.itemId, await getPromotionOptions(row.itemId));
    } catch {
      failOptions(row.itemId);
    }
  }

  function toggleExpanded(row: PromotionRow): void {
    const next = new Set(expanded);
    if (next.has(row.itemId)) next.delete(row.itemId);
    else {
      next.add(row.itemId);
      void loadOptions(row);
    }
    setExpanded(next);
  }

  const columns: TableColumnsType<PromotionRow> = [
    { title: "PUBLICACIÓN", key: "publication", width: 300, render: (_, row) => <PublicationCell row={row} expanded={expanded.has(row.itemId)} onToggle={() => toggleExpanded(row)} /> },
    { title: "", key: "selection", width: 44, render: (_, row) => <SelectionCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} selections={selections} onToggle={toggleSelection} /> },
    { title: "PROMOCIÓN", key: "promotion", render: (_, row) => <PromotionCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} onRetry={() => void loadOptions(row)} /> },
    { title: "DESCUENTO", key: "discount", render: (_, row) => <OptionCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} renderOption={discountText} /> },
    { title: "PRECIO FINAL", key: "price", render: (_, row) => <OptionCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} renderOption={promotionPrice} /> },
    { title: "RECIBÍS", key: "net", render: (_, row) => <OptionCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} renderOption={netText} /> },
    { title: "TAREAS Y RECOMENDACIONES", key: "tasks", width: 210, render: (_, row) => <TaskCells row={row} expanded={expanded.has(row.itemId)} cache={optionsByItem[row.itemId]} onDeactivate={() => setDeactivating(row)} onDeal={setDeal} onLegacy={() => setLegacyRow(row)} /> },
  ];

  return <>
    <Table<PromotionRow> rowKey="itemId" dataSource={[...page.publications]} columns={columns} pagination={false} size="small" />
    <PromotionDeactivationModal key={`deactivate:${deactivating?.itemId ?? "none"}`} row={deactivating} open={deactivating !== null} onClose={() => setDeactivating(null)} />
    <PromotionOptionsModal key={`apply:${legacyRow?.itemId ?? "none"}`} row={legacyRow} open={legacyRow !== null} onClose={() => setLegacyRow(null)} />
    {deal ? <DealPromotionModal key={deal.item.itemId} campaign={deal.campaign} item={deal.item} onClose={() => setDeal(null)} /> : null}
  </>;
}

function PublicationCell({ row, expanded, onToggle }: Readonly<{ row: PromotionRow; expanded: boolean; onToggle: () => void }>) {
  return <Space align="start">
    <Button type="text" aria-label={`${expanded ? "Cerrar" : "Expandir"} ${row.itemId}`} onClick={onToggle}>{expanded ? "⌄" : "›"}</Button>
    {row.thumbnail ? <Image alt={row.title} src={row.thumbnail} width={56} height={56} preview={false} /> : null}
    <div>
      <Typography.Text strong>{row.title}</Typography.Text><br />
      <Typography.Text type="secondary">{row.itemId}</Typography.Text><br />
      {row.familyId ? <Typography.Text type="secondary">Familia {row.familyId}</Typography.Text> : null}
      <div>{money(row.price)}</div>
    </div>
  </Space>;
}

function SelectionCells({ row, expanded, cache, selections, onToggle }: Readonly<{
  row: PromotionRow;
  expanded: boolean;
  cache: CachedPromotionOptions | undefined;
  selections: ReturnType<typeof usePromotionGlobalStore.getState>["selections"];
  onToggle: (selection: ReturnType<typeof promotionSelection>) => void;
}>) {
  if (!expanded || cache?.status !== "success") return null;
  return <>{cache.options.map((option) => {
    const selection = promotionSelection(row, option);
    return <div key={selection.key} style={optionStyle}>
      {option.status === "candidate"
        ? <Checkbox aria-label={`Seleccionar ${option.name ?? option.type ?? "promoción"}`} checked={Boolean(selections[selection.key])} disabled={!option.canApply} onChange={() => onToggle(selection)} />
        : null}
    </div>;
  })}</>;
}

function PromotionCells({ row, expanded, cache, onRetry }: Readonly<{
  row: PromotionRow;
  expanded: boolean;
  cache: CachedPromotionOptions | undefined;
  onRetry: () => void;
}>) {
  if (!expanded) return missingValue;
  if (!cache || cache.status === "loading") return <SkeletonInput active size="small" />;
  if (cache.status === "error") return <Space orientation="vertical"><Typography.Text type="danger">No se pudieron cargar.</Typography.Text><Button size="small" onClick={onRetry}>Reintentar</Button></Space>;
  if (cache.options.length === 0) return "Sin promociones disponibles";
  return <>{cache.options.map((option) => {
    return <div key={promotionSelectionKey(row.itemId, option)} style={optionStyle}>
      {option.status === "started" ? <Tag color="green">ACTIVA</Tag> : null}
      {option.status === "pending" ? <Tag>Programada</Tag> : null}
      <div>{option.name ?? "Promoción de Mercado Libre"}</div>
    </div>;
  })}</>;
}

function OptionCells({ row, expanded, cache, renderOption }: Readonly<{
  row: PromotionRow;
  expanded: boolean;
  cache: CachedPromotionOptions | undefined;
  renderOption: (option: PromotionOption) => ReactNode;
}>) {
  if (!expanded || cache?.status !== "success") return null;
  return <>{cache.options.map((option) => <div key={promotionSelectionKey(row.itemId, option)} style={optionStyle}>{renderOption(option)}</div>)}</>;
}

function TaskCells({ row, expanded, cache, onDeactivate, onDeal, onLegacy }: Readonly<{
  row: PromotionRow;
  expanded: boolean;
  cache: CachedPromotionOptions | undefined;
  onDeactivate: () => void;
  onDeal: (selection: DealSelection) => void;
  onLegacy: () => void;
}>) {
  if (!expanded || cache?.status !== "success") return null;
  return <>{cache.options.map((option) => (
    <div key={promotionSelectionKey(row.itemId, option)} style={optionStyle}>
      <TaskAction row={row} option={option} onDeactivate={onDeactivate} onDeal={onDeal} onLegacy={onLegacy} />
    </div>
  ))}</>;
}

function TaskAction({ row, option, onDeactivate, onDeal, onLegacy }: Readonly<{
  row: PromotionRow;
  option: PromotionOption;
  onDeactivate: () => void;
  onDeal: (selection: DealSelection) => void;
  onLegacy: () => void;
}>) {
  if (option.status === "started") return option.canRemove ? <Button size="small" onClick={onDeactivate}>Dejar de participar</Button> : null;
  if (option.status === "pending") return "Programada";
  if (option.status !== "candidate" || !option.canApply) return null;
  if (option.type === "DEAL" && option.id) {
    const promotionId = option.id;
    return <Button size="small" type="primary" onClick={() => onDeal(dealSelection(row, option, promotionId))}>Participar</Button>;
  }
  return option.type !== "DEAL" && completeLegacyOption(option)
    ? <Button size="small" onClick={onLegacy}>Participar</Button>
    : null;
}

function dealSelection(row: PromotionRow, option: PromotionOption, promotionId: string): DealSelection {
  return {
    campaign: { id: promotionId, name: option.name, type: "DEAL", status: option.status ?? "candidate", startDate: option.startDate, finishDate: option.finishDate, deadlineDate: null },
    item: { itemId: row.itemId, title: row.title, thumbnail: row.thumbnail, status: option.status, eligible: option.canApply, currentPrice: option.originalPrice ?? row.price, promotionPrice: option.promotionPrice, minPromotionPrice: option.minPromotionPrice, maxPromotionPrice: option.maxPromotionPrice, suggestedPromotionPrice: option.suggestedPromotionPrice, requiresPriceSelection: option.requiresPriceSelection, sellerDiscountAmount: option.sellerDiscountAmount, mercadoLibreBaseContributionAmount: option.mercadoLibreBaseContributionAmount, mercadoLibreBoostAmount: option.mercadoLibreBoostAmount, mercadoLibreContributionAmount: option.mercadoLibreContributionAmount, estimatedNetAmount: option.estimatedNetAmount },
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
