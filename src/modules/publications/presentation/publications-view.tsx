import type { PublicationsPage } from "../domain/publication.model";

import { PublicationsFilters } from "./publications-filters.client";
import {
  PUBLICATIONS_PAGE_SIZE,
  type PublicationsUrlState,
} from "./publications-search-params";
import { PublicationsTable } from "./publications-table.client";
import styles from "./publications-view.module.css";

type PublicationsViewProps = Readonly<{ filters: PublicationsUrlState }> &
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
          <PublicationsTable page={emptyPage} loading />
        </>
      ) : null}

      {props.state === "empty" || props.state === "success" ? (
        <>
          <section
            className={styles.summary}
            aria-label="Resumen de publicaciones"
          >
            <p className={styles.summaryText}>
              Publicaciones encontradas: <strong>{props.page.total}</strong>
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

          <PublicationsTable page={props.page} />
        </>
      ) : null}
    </div>
  );
}

const emptyPage: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: PUBLICATIONS_PAGE_SIZE,
  count: 0,
  total: 0,
  totalPages: 0,
};
