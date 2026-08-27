"use client";

import { Button, Image, Table, Tag } from "antd";
import { useState } from "react";

import type { PromotionRow, PromotionsPage } from "../domain/promotion.model";
import { PromotionDeactivationModal } from "./promotion-deactivation-modal.client";
import { PromotionOptionsModal } from "./promotion-options-modal.client";

type Props = Readonly<{
  page: PromotionsPage;
  mode: "Masivo" | "Individual";
  selected?: React.Key[];
  onSelectionChange?: (keys: React.Key[]) => void;
}>;

const groupLabel: Record<PromotionRow["productGroup"], string> = {
  WOMEN_TSHIRT: "Remeras Mujer",
  WOMEN_SWEATSHIRT: "Buzos Mujer",
  GIRLS_TSHIRT: "Remeras Niña",
  GIRLS_SWEATSHIRT: "Buzos Niña",
};

export function PromotionsTable({
  page,
  mode,
  selected,
  onSelectionChange,
}: Props) {
  const [visible, setVisible] = useState<PromotionRow | null>(null);
  const [deactivating, setDeactivating] = useState<PromotionRow | null>(null);
  const [localSelected, setLocalSelected] = useState<React.Key[]>([]);
  const selectedKeys = selected ?? localSelected;

  return (
    <>
      <Table<PromotionRow>
        rowKey="itemId"
        dataSource={[...page.publications]}
        pagination={false}
        rowSelection={{
          type: mode === "Masivo" ? "checkbox" : "radio",
          selectedRowKeys: selectedKeys,
          onChange: (keys) => {
            const next = mode === "Masivo" ? keys : keys.slice(-1);
            setLocalSelected(next);
            onSelectionChange?.(next);
          },
        }}
        columns={[
          {
            title: "Imagen",
            render: (_: unknown, row: PromotionRow) =>
              row.thumbnail ? (
                <Image
                  alt={row.title}
                  src={row.thumbnail}
                  width={40}
                  preview={false}
                />
              ) : (
                "—"
              ),
          },
          { title: "Producto", dataIndex: "title" },
          { title: "MLA", dataIndex: "itemId" },
          {
            title: "Tipo",
            render: (_: unknown, row: PromotionRow) =>
              groupLabel[row.productGroup],
          },
          {
            title: "Precio normal",
            render: (_: unknown, row: PromotionRow) => money(row.price),
          },
          {
            title: "Promoción actual",
            render: (_: unknown, row: PromotionRow) =>
              row.currentPromotion?.name ??
              (row.currentPromotion ? "Promoción activa" : "Sin promoción"),
          },
          {
            title: "Descuento",
            render: (_: unknown, row: PromotionRow) =>
              row.currentPromotion?.discountPercent === null ||
              row.currentPromotion?.discountPercent === undefined
                ? "—"
                : `${row.currentPromotion.discountPercent}%`,
          },
          {
            title: "Precio promoción",
            render: (_: unknown, row: PromotionRow) =>
              money(row.currentPromotion?.promotionPrice ?? null),
          },
          {
            title: "Otras promociones",
            render: (_: unknown, row: PromotionRow) =>
              row.availablePromotionsCount > 0 ? (
                <Tag role="button" onClick={() => setVisible(row)}>
                  {`Elegir promoción (${row.availablePromotionsCount})`}
                </Tag>
              ) : (
                "—"
              ),
          },
          {
            title: "Estado promoción",
            render: (_: unknown, row: PromotionRow) => (
              <>
                <Tag>{statusLabel(row)}</Tag>
                {row.currentPromotion ? (
                  <Button size="small" onClick={() => setDeactivating(row)}>
                    Desactivar promoción
                  </Button>
                ) : null}
              </>
            ),
          },
        ]}
      />
      <PromotionOptionsModal
        row={visible}
        open={visible !== null}
        onClose={() => setVisible(null)}
      />
      <PromotionDeactivationModal
        key={deactivating?.itemId ?? "none"}
        row={deactivating}
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
      />
    </>
  );
}

function statusLabel(row: PromotionRow): string {
  if (row.promotionStatus === "NONE") return "Sin promoción";
  if (row.promotionStatus === "ACTIVE") return "Activa";
  if (row.promotionStatus === "AVAILABLE") return "Disponible";
  return "Pendiente";
}

function money(value: number | null): string {
  return value === null ? "—" : `$${value.toLocaleString("es-AR")}`;
}
