"use client";
import { Button, Image, Table, Tag, message } from "antd";
import { useState } from "react";
import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import { PromotionOptionsModal } from "./promotion-options-modal.client";
type Props = Readonly<{ page: PromotionsPage; mode: "Masivo" | "Individual"; selected?: React.Key[]; onSelectionChange?: (keys: React.Key[]) => void }>;
const groupLabel: Record<PromotionRow["productGroup"], string> = { WOMEN_TSHIRT: "Remeras Mujer", WOMEN_SWEATSHIRT: "Buzos Mujer", GIRLS_TSHIRT: "Remeras Niña", GIRLS_SWEATSHIRT: "Buzos Niña" };
export function PromotionsTable({ page, mode, selected, onSelectionChange }: Props) {
  const [visible, setVisible] = useState<PromotionRow | null>(null); const [loading, setLoading] = useState<string | null>(null);
  const deactivate = async (row: PromotionRow) => { setLoading(row.itemId); const { deactivatePromotion } = await import("./deactivate-promotion.action"); const result = await deactivatePromotion(row.itemId); setLoading(null); if (result.ok) message.success("Promoción desactivada."); else message.error(result.message); };
  const [localSelected, setLocalSelected] = useState<React.Key[]>([]);
  const selectedKeys = selected ?? localSelected;
  return <>
  <Table<PromotionRow> rowKey="itemId" dataSource={[...page.publications]} pagination={false} rowSelection={{ type: mode === "Masivo" ? "checkbox" : "radio", selectedRowKeys: selectedKeys, onChange: (keys) => { const next = mode === "Masivo" ? keys : keys.slice(-1); setLocalSelected(next); onSelectionChange?.(next); } }} columns={[
    { title: "Imagen", render: (_: unknown, row: PromotionRow) => row.thumbnail ? <Image alt={row.title} src={row.thumbnail} width={40} preview={false} /> : "—" },
    { title: "Producto", dataIndex: "title" }, { title: "MLA", dataIndex: "itemId" }, { title: "Tipo", render: (_: unknown, row: PromotionRow) => groupLabel[row.productGroup] },
    { title: "Precio normal", render: (_: unknown, row: PromotionRow) => `$${row.price.toLocaleString("es-AR")}` },
    { title: "Promoción actual", render: (_: unknown, row: PromotionRow) => row.currentPromotion ? <>{row.currentPromotion.name ?? ""} {row.currentPromotion.type ?? ""} {row.currentPromotion.discountPercent == null ? "" : `${row.currentPromotion.discountPercent}%`} {row.currentPromotion.promotionPrice == null ? "" : `$${row.currentPromotion.promotionPrice.toLocaleString("es-AR")}`}</> : "Sin promoción" },
    { title: "Descuento", render: (_: unknown, row: PromotionRow) => row.currentPromotion?.discountPercent == null ? "—" : `${row.currentPromotion.discountPercent}%` },
    { title: "Precio promoción", render: (_: unknown, row: PromotionRow) => row.currentPromotion?.promotionPrice == null ? "—" : `$${row.currentPromotion.promotionPrice.toLocaleString("es-AR")}` },
    { title: "Otras promociones", render: (_: unknown, row: PromotionRow) => row.availablePromotionsCount > 0 ? <Tag role="button" onClick={() => setVisible(row)}>{`Elegir promoción (${row.availablePromotionsCount})`}</Tag> : "—" },
    { title: "Estado promoción", render: (_: unknown, row: PromotionRow) => <><Tag>{row.promotionStatus === "NONE" ? "Sin promoción" : row.promotionStatus === "ACTIVE" ? "Activa" : row.promotionStatus === "AVAILABLE" ? "Disponible" : "Pendiente"}</Tag>{row.currentPromotion ? <Button size="small" loading={loading === row.itemId} onClick={() => void deactivate(row)}>Desactivar promoción</Button> : null}</> },
  ]} /><PromotionOptionsModal row={visible} open={visible !== null} onClose={() => setVisible(null)} />
  </>;
}
