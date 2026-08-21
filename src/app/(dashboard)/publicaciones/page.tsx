import { PageHeader } from "@/shared/ui/page-header/page-header";

import styles from "./publicaciones.module.css";

export default function PublicationsPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Publicaciones"
        description="Gestiona las publicaciones de tus canales de venta."
      />

      <div className={styles.placeholderGrid}>
        <section
          className={styles.placeholder}
          aria-labelledby="publication-filters-placeholder"
        >
          <h2
            className={styles.placeholderTitle}
            id="publication-filters-placeholder"
          >
            Zona futura de filtros
          </h2>
        </section>

        <section
          className={`${styles.placeholder} ${styles.tablePlaceholder}`}
          aria-labelledby="publications-table-placeholder"
        >
          <h2
            className={styles.placeholderTitle}
            id="publications-table-placeholder"
          >
            Zona futura de tabla
          </h2>
        </section>
      </div>
    </div>
  );
}
