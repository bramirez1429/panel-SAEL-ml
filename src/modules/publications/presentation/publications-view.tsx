import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsFilters } from "./publications-filters.client";
import { PUBLICATIONS_PAGE_SIZE, type PublicationsUrlState } from "./publications-search-params";
import { PublicationsTable } from "./publications-table.client";
import type { InlineStockUpdateAction } from "./publication-stock-cell.client";
import type { DeleteVariationAction } from "./publication-product-row.client";
import type { LoadPublicationVariantsAction } from "@/app/(dashboard)/publicaciones/load-publication-variants.action";
import type { ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeCategory, TiendanubeReplicationState } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import styles from "./publications-view.module.css";
import { BulkStockButton } from "../bulk-stock/presentation/bulk-stock-button.client";
import type {
  CreateBulkStockJobAction,
  GetBulkStockJobAction,
  PreviewBulkStockAction,
} from "../bulk-stock/domain/bulk-stock.model";

type PublicationsViewProps = Readonly<{
  filters: PublicationsUrlState;
  tiendanubeStatusBySourceKey?: Readonly<Record<string, TiendanubeReplicationState>>;
  replicateAction?: ReplicatePublicationAction;
  categories?: readonly TiendanubeCategory[];
  categoriesError?: string | null;
  updateAction?: InlineStockUpdateAction;
  deleteVariationAction?: DeleteVariationAction;
  loadVariantsAction?: LoadPublicationVariantsAction;
  previewBulkStockAction?: PreviewBulkStockAction;
  createBulkStockJobAction?: CreateBulkStockJobAction;
  getBulkStockJobAction?: GetBulkStockJobAction;
}> & (Readonly<{ state: "loading" }> | Readonly<{ state: "error"; errorMessage: string }> | Readonly<{ state: "empty" | "success"; page: PublicationsPage }>);

/** Presenta modelos de dominio; la lectura se resuelve en el Server Component de la ruta. */
export function PublicationsView(props: PublicationsViewProps) {
  const hasFilters = Boolean(props.filters.search || props.filters.type || props.filters.status || props.filters.quickFilters.length);
  const tableProps = {
    tiendanubeStatusBySourceKey: props.tiendanubeStatusBySourceKey,
    replicateAction: props.replicateAction,
    categories: props.categories,
    categoriesError: props.categoriesError,
    updateAction: props.updateAction,
    deleteVariationAction: props.deleteVariationAction,
    loadVariantsAction: props.loadVariantsAction,
  };

  return (
    <div className={styles.view} data-dashboard-full-width="true">
      {props.previewBulkStockAction && props.createBulkStockJobAction && props.getBulkStockJobAction ? (
        <div className={styles.bulkStockAction}>
          <BulkStockButton
            createJobAction={props.createBulkStockJobAction}
            getJobAction={props.getBulkStockJobAction}
            previewAction={props.previewBulkStockAction}
          />
        </div>
      ) : null}
      <PublicationsFilters filters={props.filters} />
      {props.state === "error" ? <section className={styles.error} role="alert"><strong>No se pudieron cargar las publicaciones.</strong><p>{props.errorMessage}</p></section> : null}
      {props.state === "loading" ? <><p className={styles.summaryText}>Cargando publicaciones…</p><PublicationsTable page={emptyPage} loading {...tableProps} /></> : null}
      {props.state === "empty" || props.state === "success" ? <><section className={styles.summary} aria-label="Resumen de publicaciones"><p className={styles.summaryText}>Publicaciones en esta página: <strong>{props.page.count}</strong></p>{hasFilters ? <p className={styles.filteredCount}>Coincidencias en esta página: {props.page.count}</p> : null}</section><PublicationsTable page={props.page} {...tableProps} /></> : null}
    </div>
  );
}

const emptyPage: PublicationsPage = { publications: [], page: 1, pageSize: PUBLICATIONS_PAGE_SIZE, cursor: null, nextCursor: null, done: true, count: 0, productsCount: 0 };
