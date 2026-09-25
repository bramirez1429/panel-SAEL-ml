"use client";

import { message, Table } from "antd";
import type { TableColumnsType } from "antd";
import { useSearchParams } from "next/navigation";

import type { Publication, PublicationsPage } from "../domain/publication.model";
import { PublicationProductRow } from "./publication-product-row.client";
import type { DeleteVariationAction } from "./publication-product-row.client";
import type { InlineStockUpdateAction } from "./publication-stock-cell.client";
import { PublicationsPagination } from "./publications-pagination.client";
import styles from "./publications-view.module.css";
import type { ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeCategory, TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { LoadPublicationVariantsAction } from "@/app/(dashboard)/publicaciones/load-publication-variants.action";

type PublicationsTableProps = Readonly<{
  page: PublicationsPage;
  loading?: boolean;
  tiendanubeStatusBySourceKey?: Readonly<Record<string, TiendanubeReplicationState>>;
  replicateAction?: ReplicatePublicationAction;
  categories?: readonly TiendanubeCategory[];
  updateAction?: InlineStockUpdateAction;
  deleteVariationAction?: DeleteVariationAction;
  loadVariantsAction?: LoadPublicationVariantsAction;
}>;

export function PublicationsTable({ page, loading = false, tiendanubeStatusBySourceKey = {}, replicateAction = async () => ({ ok: false as const, message: "La replicación no está disponible." }), categories = [], updateAction, deleteVariationAction, loadVariantsAction }: PublicationsTableProps) {
  const searchParams = useSearchParams();
  const returnTo = createReturnTo(searchParams);
  const [messageApi, messageContext] = message.useMessage();
  const columns: TableColumnsType<Publication> = [{
    key: "publication",
    render: (_, publication) => (
      <PublicationProductRow
        publication={publication}
        tiendanubeState={tiendanubeStatusBySourceKey[publication.group.key] ?? { sourceKey: publication.group.key, status: "NOT_REPLICATED", tiendanubeProductId: null }}
        replicateAction={replicateAction}
        categories={categories}
        updateAction={updateAction}
        deleteVariationAction={deleteVariationAction}
        loadVariantsAction={loadVariantsAction}
        detailHref={createDetailHrefFromReturnTo(publication.id, returnTo)}
        similarHref={createSimilarHrefFromReturnTo(publication.group.key, returnTo)}
        onStockError={(error) => void messageApi.error(error)}
      />
    ),
  }];
  return (
    <>{messageContext}<div className={styles.tableCard} aria-busy={loading} aria-label="Tabla de publicaciones" role="region">
      <Table<Publication>
        className={styles.productsTable}
        columns={columns}
        dataSource={[...page.publications]}
        loading={loading}
        locale={{ emptyText: "No se encontraron publicaciones." }}
        pagination={false}
        rowKey="id"
        showHeader={false}
        scroll={{ x: 1080 }}
      />
      {!loading && page.productsCount > 0 ? <PublicationsPagination page={page} /> : null}
    </div></>
  );
}

export function createDetailHref(publicationId: string, searchParams: URLSearchParams): string {
  return createDetailHrefFromReturnTo(publicationId, createReturnTo(searchParams));
}

function createDetailHrefFromReturnTo(publicationId: string, returnTo: string): string {
  return `/publicaciones/${encodeURIComponent(publicationId)}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function createSimilarHref(sourceKey: string, searchParams: URLSearchParams): string {
  return createSimilarHrefFromReturnTo(sourceKey, createReturnTo(searchParams));
}

function createSimilarHrefFromReturnTo(sourceKey: string, returnTo: string): string {
  const params = new URLSearchParams({ sourceKey, returnTo });
  return `/publicaciones/similar?${params.toString()}`;
}

function createReturnTo(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `/publicaciones?${query}` : "/publicaciones";
}
