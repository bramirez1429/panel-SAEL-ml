"use client";

import { Button, Image, Table } from "antd";
import type { TableColumnsType } from "antd";
import type { ReactNode } from "react";

import { PublicationStatus } from "./publication-status";
import type { PublicationVariantTableRow } from "./publication-variant-row";
import styles from "./publication-detail-view.module.css";

type PublicationVariantsTableProps = Readonly<{
  rows: readonly PublicationVariantTableRow[];
}>;

const missingValue = <span title="Dato no disponible">—</span>;

const columns: TableColumnsType<PublicationVariantTableRow> = [
  {
    title: "Imagen",
    key: "image",
    render: (_, row) =>
      row.imageUrl ? (
        <Image alt={`Imagen de ${row.publicationId}`} preview={false} src={row.imageUrl} width={48} />
      ) : (
        missingValue
      ),
    width: 80,
  },
  { title: "ID publicación", dataIndex: "publicationId", key: "publicationId" },
  {
    title: "ID producto",
    dataIndex: "userProductId",
    key: "userProductId",
    render: (value: string | null) => value ?? missingValue,
  },
  {
    title: "Estado",
    key: "status",
    render: (_, row) => <PublicationStatus status={row.status} />,
  },
  {
    title: "Precio",
    key: "price",
    render: (_, row) => formatPrice(row.price),
  },
  {
    title: "Stock",
    dataIndex: "stock",
    key: "stock",
    render: (value: number | null) => value ?? missingValue,
  },
  {
    title: "Vendidos",
    dataIndex: "sold",
    key: "sold",
    render: (value: number | null) => value ?? missingValue,
  },
  { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value ?? missingValue },
  { title: "Talle", dataIndex: "size", key: "size", render: (value: string | null) => value ?? missingValue },
  {
    title: "Acción",
    key: "action",
    render: (_, row) =>
      row.permalink ? (
        <Button href={row.permalink} rel="noreferrer" target="_blank" type="link">
          Ver en Mercado Libre
        </Button>
      ) : (
        missingValue
      ),
  },
];

export function PublicationVariantsTable({ rows }: PublicationVariantsTableProps) {
  return (
    <div className={styles.variantTable} aria-label="Variantes de la publicación" role="region">
      <Table<PublicationVariantTableRow>
        columns={columns}
        dataSource={[...rows]}
        pagination={false}
        rowKey="key"
        scroll={{ x: 1050 }}
        size="small"
      />
    </div>
  );
}

function formatPrice(price: PublicationVariantTableRow["price"]): ReactNode {
  if (!price) return missingValue;
  const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(price.amount);
  return price.currency ? `${price.currency} ${amount}` : amount;
}
