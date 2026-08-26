import type { PublicationsPage } from "../domain/publication.model";

import { PublicationsFilters } from "./publications-filters.client";
import {
  PUBLICATIONS_PAGE_SIZE,
  type PublicationsUrlState,
} from "./publications-search-params";
import { PublicationsTable } from "./publications-table.client";
import type { ReplicatePublicationAction } from "@/modules/tiendanube/presentation/tiendanube-replication-cell.client";
import type { TiendanubeCategory, TiendanubeReplicationState, TiendanubeStoreSummary } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import styles from "./publications-view.module.css";

type PublicationsViewProps = Readonly<{ filters: PublicationsUrlState }> &
  Readonly<{ tiendanubeStatusBySourceKey?: Readonly<Record<string, TiendanubeReplicationState>>; replicateAction?: ReplicatePublicationAction }> &
  Readonly<{ categories?: readonly TiendanubeCategory[]; storeSummary?: TiendanubeStoreSummary | null }> &
  (
    | Readonly<{ state: "loading" }>
    | Readonly<{ state: "error"; errorMessage: string }>
    | Readonly<{ state: "empty" | "success"; page: PublicationsPage }>
  );

/**
 * Presenta únicamente modelos de dominio. No conoce el endpoint ni ejecuta
 * fetch; la carga se resuelve antes, desde el Server Component de la ruta.
 */
export function PublicationsView(props: PublicationsViewProps) {
  const hasFilters = Boolean(
    props.filters.search || props.filters.type || props.filters.status,
  );

  return (
    <div className={styles.view}>
      <PublicationsFilters filters={props.filters} />

      {props.state === "error" ? (
        <section className={styles.error} role="alert">
          <strong>No se pudieron cargar las publicaciones.</strong>
          <p>{props.errorMessage}</p>
        </section>
      ) : null}

      {props.state === "loading" ? (
        <>
          <p className={styles.summaryText}>Cargando publicaciones…</p>
          <PublicationsTable page={emptyPage} loading tiendanubeStatusBySourceKey={props.tiendanubeStatusBySourceKey} replicateAction={props.replicateAction} categories={props.categories} storeSummary={props.storeSummary} />
        </>
      ) : null}

      {props.state === "empty" || props.state === "success" ? (
        <>
          <section
            className={styles.summary}
            aria-label="Resumen de publicaciones"
          >
            <p className={styles.summaryText}>
              Publicaciones en esta página: <strong>{props.page.count}</strong>
            </p>
            {hasFilters ? (
              <p className={styles.filteredCount}>
                Coincidencias en esta página: {props.page.count}
              </p>
            ) : null}
          </section>

          {hasFilters ? (
            <p className={styles.filterNotice} role="note">
              El backend todavía no filtra el catálogo completo; estos filtros
              se aplican únicamente a la página actual.
            </p>
          ) : null}

          <PublicationsTable page={props.page} tiendanubeStatusBySourceKey={props.tiendanubeStatusBySourceKey} replicateAction={props.replicateAction} categories={props.categories} storeSummary={props.storeSummary} />
        </>
      ) : null}
    </div>
  );
}

const emptyPage: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: PUBLICATIONS_PAGE_SIZE,
  cursor: null,
  nextCursor: null,
  done: true,
  count: 0,
  productsCount: 0,
};
