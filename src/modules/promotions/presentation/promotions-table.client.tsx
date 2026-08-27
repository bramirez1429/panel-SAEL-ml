"use client";
import { Image, Modal, Table, Tag } from "antd";
import { useState } from "react";
import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
type Props = Readonly<{ page: PromotionsPage; mode: "Masivo" | "Individual"; selected?: React.Key[]; onSelectionChange?: (keys: React.Key[]) => void }>;
const groupLabel: Record<PromotionRow["productGroup"], string> = { WOMEN_TSHIRT: "Remeras Mujer", WOMEN_SWEATSHIRT: "Buzos Mujer", GIRLS_TSHIRT: "Remeras Niña", GIRLS_SWEATSHIRT: "Buzos Niña" };
export function PromotionsTable({ page, mode, selected, onSelectionChange }: Props) {
  const [visible, setVisible] = useState<PromotionRow | null>(null);
  const [localSelected, setLocalSelected] = useState<React.Key[]>([]);
  const selectedKeys = selected ?? localSelected;
  return <>
  <Table<PromotionRow> rowKey="itemId" dataSource={[...page.publications]} pagination={false} rowSelection={{ type: mode === "Masivo" ? "checkbox" : "radio", selectedRowKeys: selectedKeys, onChange: (keys) => { const next = mode === "Masivo" ? keys : keys.slice(-1); setLocalSelected(next); onSelectionChange?.(next); } }} columns={[
    { title: "Imagen", render: (_: unknown, row: PromotionRow) => row.thumbnail ? <Image alt={row.title} src={row.thumbnail} width={40} preview={false} /> : "—" },
    { title: "Producto", dataIndex: "title" }, { title: "MLA", dataIndex: "itemId" }, { title: "Tipo", render: (_: unknown, row: PromotionRow) => groupLabel[row.productGroup] },
    { title: "Precio normal", render: (_: unknown, row: PromotionRow) => `$${row.price.toLocaleString("es-AR")}` },
    { title: "Promoción actual", render: (_: unknown, row: PromotionRow) => row.currentPromotion?.name ?? row.currentPromotion?.type ?? "Sin promoción" },
    { title: "Descuento", render: (_: unknown, row: PromotionRow) => row.currentPromotion?.discountPercent == null ? "—" : `${row.currentPromotion.discountPercent}%` },
    { title: "Precio promoción", render: (_: unknown, row: PromotionRow) => row.currentPromotion?.promotionPrice == null ? "—" : `$${row.currentPromotion.promotionPrice.toLocaleString("es-AR")}` },
    { title: "A recibir aprox.", render: (_: unknown, row: PromotionRow) => row.saleEstimate ? `$${row.saleEstimate.estimatedNetAmount.toLocaleString("es-AR")}` : "—" },
    { title: "Otras promociones", render: (_: unknown, row: PromotionRow) => row.availablePromotions.length ? <Tag role="button" onClick={() => setVisible(row)}>{`Ver ${row.availablePromotions.length} disponibles`}</Tag> : "—" },
    { title: "Estado promoción", render: (_: unknown, row: PromotionRow) => <Tag>{row.promotionStatus === "NONE" ? "Sin promoción" : row.promotionStatus === "ACTIVE" ? "Activa" : row.promotionStatus === "AVAILABLE" ? "Disponible" : "Pendiente"}</Tag> },
  ]} /><Modal title="Promociones disponibles" open={visible !== null} onCancel={() => setVisible(null)} footer={null}>{visible?.availablePromotions.map((promotion) => <div key={promotion.id ?? promotion.type ?? promotion.name}><strong>{promotion.name ?? "Promoción"}</strong> {promotion.type ?? ""}{promotion.discountPercent == null ? "" : ` · ${promotion.discountPercent}% OFF`}</div>)}</Modal>
  </>;
}
