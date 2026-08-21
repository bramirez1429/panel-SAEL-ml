"use client";

import { useTransition, type ReactNode } from "react";
import { Button, Pagination, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
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
    key: "sold",
    align: "right",
    render: () => missingValue,
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
    render: (_, publication) =>
      publication.permalink ? (
        <Button
          href={publication.permalink}
          rel="noreferrer"
          target="_blank"
          type="link"
        >
          Ver
        </Button>
      ) : (
        missingValue
      ),
    width: 100,
  },
];

export function PublicationsTable({
  page,
  loading = false,
}: PublicationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const changePage = (nextPage: number) => {
    const current = parsePublicationsSearchParams(
      Object.fromEntries(searchParams.entries()),
    );

    startTransition(() => {
      router.push(buildPublicationsUrl(current, { page: nextPage }));
    });
  };

  return (
    <div className={styles.tableCard} aria-busy={loading || isPending}>
      <Table<Publication>
        columns={columns}
        dataSource={[...page.publications]}
        loading={loading || isPending}
        locale={{ emptyText: "No se encontraron publicaciones." }}
        pagination={false}
        rowKey="id"
        scroll={{ x: 1170 }}
      />

      {!loading && page.total > 0 ? (
        <Pagination
          className={styles.pagination}
          current={page.page}
          onChange={changePage}
          pageSize={page.pageSize}
          showSizeChanger={false}
          total={page.total}
        />
      ) : null}
    </div>
  );
}

function formatPrice(publication: Publication): ReactNode {
  const from = publication.price?.from ?? null;
  const to = publication.price?.to ?? null;
  const currency = publication.price?.currency;

  if (from === null && to === null) {
    return missingValue;
  }

  const prefix = currency ? `${currency} ` : "";
  const format = (value: number) =>
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);

  if (from !== null && to !== null && from !== to) {
    return `${prefix}${format(from)} – ${prefix}${format(to)}`;
  }

  const amount = from ?? to;

  return amount === null ? missingValue : `${prefix}${format(amount)}`;
}
