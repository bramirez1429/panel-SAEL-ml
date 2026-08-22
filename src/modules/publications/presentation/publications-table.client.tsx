"use client";

import { useTransition, type ReactNode } from "react";
import { Button, Space, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  Publication,
  PublicationsPage,
  SalesChannel,
} from "../domain/publication.model";
import {
  buildPublicationsUrl,
  parsePublicationsSearchParams,
} from "./publications-search-params";
import styles from "./publications-view.module.css";

type PublicationsTableProps = Readonly<{
  page: PublicationsPage;
  loading?: boolean;
}>;

const missingValue = <span title="Dato no disponible">—</span>;

const salesChannelLabels: Record<SalesChannel, string> = {
  MERCADO_LIBRE: "Mercado Libre",
};

const columns: TableColumnsType<Publication> = [
  {
    title: "Producto",
    dataIndex: "title",
    key: "product",
    ellipsis: true,
    render: (title: Publication["title"]) => (
      <span className={styles.productTitle}>{title}</span>
    ),
    width: 260,
  },
  {
    title: "Canal",
    key: "channel",
    render: (_, publication) => salesChannelLabels[publication.channel],
    width: 130,
  },
  {
    title: "Tipo",
    key: "type",
    render: (_, publication) =>
      publication.group.type === "USER_PRODUCT" ? (
        <Tag color="blue">Familia</Tag>
      ) : (
        <Tag>Legacy</Tag>
      ),
    width: 100,
  },
  {
    title: "Variantes",
    key: "variants",
    align: "right",
    render: (_, publication) =>
      publication.group.type === "USER_PRODUCT"
        ? publication.group.childrenCount
        : missingValue,
    width: 100,
  },
  {
    title: "Precio",
    key: "price",
    align: "right",
    render: (_, publication) => formatPrice(publication),
    width: 170,
  },
  {
    title: "Stock",
    dataIndex: "stock",
    key: "stock",
    align: "right",
    width: 90,
  },
  {
    title: "Vendidos",
    dataIndex: "sold",
    key: "sold",
    align: "right",
    render: (sold: Publication["sold"]) =>
      sold === null ? missingValue : sold,
    width: 100,
  },
  {
    title: "Estado",
    key: "status",
    render: (_, publication) =>
      publication.status ? <Tag>{publication.status}</Tag> : missingValue,
    width: 120,
  },
  {
    title: "Acciones",
    key: "actions",
    render: (_, publication) => (
      <Link
        className={styles.detailLink}
        href={`/publicaciones/${encodeURIComponent(publication.id)}`}
      >
        Ver detalle
      </Link>
    ),
    width: 130,
  },
];

export function PublicationsTable({
  page,
  loading = false,
}: PublicationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToNextPage = () => {
    const current = parsePublicationsSearchParams(
      Object.fromEntries(searchParams.entries()),
    );

    startTransition(() => {
      router.push(
        buildPublicationsUrl(current, {
          page: current.page + 1,
          cursor: page.nextCursor,
        }),
      );
    });
  };

  const hasNextPage = !page.done && page.nextCursor !== null;

  return (
    <div
      className={styles.tableCard}
      aria-busy={loading || isPending}
      aria-label="Tabla de publicaciones"
      role="region"
    >
      <Table<Publication>
        columns={columns}
        dataSource={[...page.publications]}
        loading={loading || isPending}
        locale={{ emptyText: "No se encontraron publicaciones." }}
        pagination={false}
        rowKey="id"
        scroll={{ x: 1170 }}
        size="middle"
      />

      {!loading && page.count > 0 ? (
        <div className={styles.pagination} aria-label="Paginación por cursor">
          <Space>
            <Button
              disabled={page.page <= 1 || isPending}
              onClick={() => router.back()}
            >
              Anterior
            </Button>
            <span>Página {page.page}</span>
            <Button
              disabled={!hasNextPage || isPending}
              loading={isPending}
              onClick={goToNextPage}
              type="primary"
            >
              Siguiente
            </Button>
          </Space>
        </div>
      ) : null}
    </div>
  );
}

function formatPrice(publication: Publication): ReactNode {
  const from = publication.price?.from ?? null;
  const to = publication.price?.to ?? null;
  const currency = publication.price?.currency ?? "";

  if (from === null && to === null) {
    return missingValue;
  }

  const format = (value: number) =>
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
  const formatWithCurrency = (value: number) =>
    currency ? `${currency} ${format(value)}` : format(value);

  if (from !== null && to !== null && from !== to) {
    return `${formatWithCurrency(from)} — ${formatWithCurrency(to)}`;
  }

  const amount = from ?? to;

  return amount === null ? missingValue : formatWithCurrency(amount);
}
