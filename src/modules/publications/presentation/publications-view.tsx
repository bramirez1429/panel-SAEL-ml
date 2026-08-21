import type { PublicationsPage } from "../domain/publication.model";

import styles from "./publications-view.module.css";

type PublicationsViewProps = Readonly<{
  page: PublicationsPage | null;
}>;

/**
 * Presenta únicamente modelos de dominio. No conoce el endpoint ni ejecuta
 * fetch; la carga se resuelve antes, desde el Server Component de la ruta.
 */
export function PublicationsView({ page }: PublicationsViewProps) {
  return (
    <section className={styles.summary} aria-label="Resumen de publicaciones">
      {page ? (
        <p className={styles.summaryText}>
          Publicaciones encontradas: <strong>{page.total}</strong>
        </p>
      ) : (
        <p className={styles.errorText}>
          No fue posible cargar las publicaciones desde el backend.
        </p>
      )}
    </section>
  );
}
