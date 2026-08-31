import { PublicationSearchBar } from "./publication-search-bar.client";
import styles from "./promotions-search-topbar.module.css";

type Props = Readonly<{ initialSearch: string }>;

export function PromotionsSearchTopbar({ initialSearch }: Props) {
  return <section
    aria-label="Búsqueda y filtros de promociones"
    className={styles.topbar}
    data-testid="promotions-search-topbar"
  >
    <PublicationSearchBar initialSearch={initialSearch} />
  </section>;
}
