"use client";

import { useTransition, type ReactNode } from "react";
import { Button, Image, Space, Table, Tag } from "antd";
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
import { PublicationStatus } from "./publication-status";
import styles from "./publications-view.module.css";
import { TiendanubeReplicationCell, TiendanubeRereplicationCell, type ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";

type PublicationsTableProps = Readonly<{
  page: PublicationsPage;
  loading?: boolean;
  tiendanubeStatusBySourceKey?: Readonly<Record<string, TiendanubeReplicationState>>;
  replicateAction?: ReplicatePublicationAction;
}>;

const missingValue = <span title="Dato no disponible">—</span>;

const salesChannelLabels: Record<SalesChannel, string> = {
  MERCADO_LIBRE: "Mercado Libre",
};

function createColumns(
  searchParams: URLSearchParams,
  tiendanubeStatusBySourceKey: Readonly<Record<string, TiendanubeReplicationState>>,
  replicateAction: ReplicatePublicationAction,
): TableColumnsType<Publication> {
  return [
  {
    title: "Tiendanube",
    key: "tiendanube",
    render: (_, publication) => (
      <TiendanubeReplicationCell
        action={replicateAction}
        initialState={tiendanubeStatusBySourceKey[publication.group.key] ?? {
          sourceKey: publication.group.key,
          status: "NOT_REPLICATED",
          tiendanubeProductId: null,
        }}
        sourceKey={publication.group.key}
      />
    ),
    width: 120,
  },
  {
    title: "Volver a replicar",
    key: "rereplicate",
    render: (_, publication) => {
      const replicationState = tiendanubeStatusBySourceKey[publication.group.key] ?? {
        sourceKey: publication.group.key,
        status: "NOT_REPLICATED" as const,
        tiendanubeProductId: null,
      };
      return (
        <TiendanubeRereplicationCell
          action={replicateAction}
          initialState={replicationState}
          sourceKey={publication.group.key}
        />
      );
    },
    width: 120,
  },
  {
    title: "Imagen",
    key: "thumbnail",
    render: (_, publication) =>
      publication.thumbnailUrl ? (
        <Image
          alt={`Imagen de ${publication.title}`}
          height={48}
          preview={false}
          src={publication.thumbnailUrl}
          width={48}
        />
      ) : (
        <span className={styles.thumbnailPlaceholder} title="Imagen no disponible">
          —
        </span>
      ),
    width: 60,
  },
  {
    title: "Producto",
    dataIndex: "title",
    key: "product",
    ellipsis: true,
    render: (title: Publication["title"]) => (
      <span className={styles.productTitle}>{title}</span>
    ),
    width: 180,
  },
  {
    title: "Canal",
    key: "channel",
    render: (_, publication) => salesChannelLabels[publication.channel],
    width: 100,
  },
  {
    title: "Tipo",
    key: "type",
    render: (_, publication) =>
      publication.group.type === "USER_PRODUCT" ? (
        <Space orientation="vertical" size={0}>
          <Tag color="blue">Familia</Tag>
          <small>{publication.group.familyId ?? "—"}</small>
          {publication.group.userProductId ? (
            <small>{publication.group.userProductId}</small>
          ) : null}
        </Space>
      ) : (
        <Tag>Anterior</Tag>
      ),
    width: 85,
  },
  {
    title: "Variantes",
    key: "variants",
    align: "right",
    render: (_, publication) =>
      publication.group.type === "USER_PRODUCT"
        ? publication.group.childrenCount
        : missingValue,
    width: 75,
  },
  {
    title: "Precio",
    key: "price",
    align: "right",
    render: (_, publication) => formatPrice(publication),
    width: 125,
  },
  {
    title: "Stock",
    dataIndex: "stock",
    key: "stock",
    align: "right",
    width: 65,
  },
  {
    title: "Vendidos",
    dataIndex: "sold",
    key: "sold",
    align: "right",
    render: (sold: Publication["sold"]) =>
      sold === null ? missingValue : sold,
    width: 75,
  },
  {
    title: "Estado",
    key: "status",
    render: (_, publication) =>
      <PublicationStatus status={publication.status} />,
    width: 95,
  },
  {
    title: "Acciones",
    key: "actions",
    render: (_, publication) => (
      <Link
        className={styles.detailLink}
        href={createDetailHref(publication.id, searchParams)}
      >
        Ver detalle
      </Link>
    ),
    width: 95,
  },
  ];
}

export function PublicationsTable({
  page,
  loading = false,
  tiendanubeStatusBySourceKey = {},
  replicateAction = async () => ({ ok: false as const, message: "La replicación no está disponible." }),
}: PublicationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const columns = createColumns(searchParams, tiendanubeStatusBySourceKey, replicateAction);

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
        scroll={{ x: "max-content" }}
        size="small"
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

function createDetailHref(
  publicationId: string,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  const returnTo = query ? `/publicaciones?${query}` : "/publicaciones";
  return `/publicaciones/${encodeURIComponent(publicationId)}?returnTo=${encodeURIComponent(returnTo)}`;
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
