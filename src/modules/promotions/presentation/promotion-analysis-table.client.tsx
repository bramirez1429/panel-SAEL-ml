"use client";

import { Image, Table } from "antd";
import { useMemo, useState } from "react";

import type { PromotionAnalysisPage, PromotionAnalysisPublication } from "../domain/promotion-analysis.model";

type Props = Readonly<{ page: PromotionAnalysisPage }>;

export function PromotionAnalysisTable({ page }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const selected = useMemo(() => page.publications.filter((publication) => selectedKeys.includes(publication.sourceKey)), [page.publications, selectedKeys]);
  const eligibleVariants = selected.reduce((total, publication) => total + publication.eligibleItems, 0);
  return <>
    {selected.length > 0 ? <p aria-live="polite">{selected.length} publicaciones seleccionadas · {eligibleVariants} variantes elegibles</p> : null}
    <Table<PromotionAnalysisPublication>
      rowKey="sourceKey" dataSource={[...page.publications]} pagination={false} size="middle"
      rowSelection={{ type: "checkbox", selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
      expandable={{ expandedRowRender: () => "Ver detalle de variantes", rowExpandable: () => true }}
      columns={[
        { title: "Imagen", render: (_: unknown, row) => row.thumbnail ? <Image alt={row.title} src={row.thumbnail} width={40} preview={false} /> : "—" },
        { title: "Publicación", dataIndex: "title", ellipsis: true },
        { title: "Modelo", render: (_: unknown, row) => row.model === "LEGACY" ? "Anterior" : "Familia" },
        { title: "Elegibles", render: (_: unknown, row) => `${row.eligibleItems}/${row.totalItems}` },
        { title: "Precio promo", render: (_: unknown, row) => promotionPrice(row) },
        { title: "Aporte ML", render: (_: unknown, row) => amountRange(row.summary.minMercadoLibreContributionAmount, row.summary.maxMercadoLibreContributionAmount) },
        { title: "Vos recibís aprox.", render: (_: unknown, row) => amountRange(row.summary.minEstimatedNetAmount, row.summary.maxEstimatedNetAmount) },
        { title: "Acción", render: (_: unknown, row) => actionLabel(row) },
      ]}
    />
  </>;
}

function promotionPrice(publication: PromotionAnalysisPublication): string {
  const { minPromotionPrice: min, maxPromotionPrice: max } = publication.summary;
  if (min === null && max === null) return "Requiere definir precio";
  return amountRange(min, max, "Requiere definir precio", "desde ");
}

function amountRange(min: number | null, max: number | null, missing = "—", fromPrefix = ""): string {
  const validMin = min !== null && min > 0 ? min : null;
  const validMax = max !== null && max > 0 ? max : null;
  if (validMin !== null && validMax !== null) {
    return validMin === validMax ? money(validMin) : `${money(validMin)} - ${money(validMax)}`;
  }
  if (validMin !== null) return money(validMin);
  if (validMax !== null) return `${fromPrefix}${money(validMax)}`;
  return missing;
}

function money(value: number): string { return `$${value.toLocaleString("es-AR")}`; }

function actionLabel(publication: PromotionAnalysisPublication): string {
  if (publication.eligibleItems === 0) return "Sin elegibles";
  if (publication.model === "LEGACY" && publication.eligibleItems === 1) return "Aplicar";
  return `Aplicar a ${publication.eligibleItems}`;
}
