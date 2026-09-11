import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsFilters } from "./publications-filters.client";
import { PUBLICATIONS_PAGE_SIZE, type PublicationsUrlState } from "./publications-search-params";
import { PublicationsTable } from "./publications-table.client";
import type { InlineStockUpdateAction } from "./publication-stock-cell.client";
import type { DeleteVariationAction } from "./publication-product-row.client";
import type { ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeCategory, TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import styles from "./publications-view.module.css";

type PublicationsViewProps = Readonly<{
  filters: PublicationsUrlState;
  tiendanubeStatusBySourceKey?: Readonly<Record<string, TiendanubeReplicationState>>;
  replicateAction?: ReplicatePublicationAction;
  categories?: readonly TiendanubeCategory[];
  updateAction?: InlineStockUpdateAction;
  deleteVariationAction?: DeleteVariationAction;
}> & (Readonly<{ state: "loading" }> | Readonly<{ state: "error"; errorMessage: string }> | Readonly<{ state: "empty" | "success"; page: PublicationsPage }>);

/** Presenta modelos de dominio; la lectura se resuelve en el Server Component de la ruta. */
export function PublicationsView(props: PublicationsViewProps) {
  const hasFilters = Boolean(props.filters.search || props.filters.type || props.filters.status);
  const tableProps = {
    tiendanubeStatusBySourceKey: props.tiendanubeStatusBySourceKey,
    replicateAction: props.replicateAction,
    categories: props.categories,
    updateAction: props.updateAction,
    deleteVariationAction: props.deleteVariationAction,
  };

  return (
    <div className={styles.view} data-dashboard-full-width="true">
      <PublicationsFilters filters={props.filters} />
      {props.state === "error" ? <section className={styles.error} role="alert"><strong>No se pudieron cargar las publicaciones.</strong><p>{props.errorMessage}</p></section> : null}
      {props.state === "loading" ? <><p className={styles.summaryText}>Cargando publicaciones…</p><PublicationsTable page={emptyPage} loading {...tableProps} /></> : null}
      {props.state === "empty" || props.state === "success" ? <><section className={styles.summary} aria-label="Resumen de publicaciones"><p className={styles.summaryText}>Publicaciones en esta página: <strong>{props.page.count}</strong></p>{hasFilters ? <p className={styles.filteredCount}>Coincidencias en esta página: {props.page.count}</p> : null}</section><PublicationsTable page={props.page} {...tableProps} /></> : null}
    </div>
  );
}

const emptyPage: PublicationsPage = { publications: [], page: 1, pageSize: PUBLICATIONS_PAGE_SIZE, cursor: null, nextCursor: null, done: true, count: 0, productsCount: 0 };
