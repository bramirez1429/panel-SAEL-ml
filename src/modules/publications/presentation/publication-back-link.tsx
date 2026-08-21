import Link from "next/link";

import styles from "./publication-detail-view.module.css";

export function BackToPublicationsLink() {
  return (
    <Link className={styles.backLink} href="/publicaciones">
      ← Volver a Publicaciones
    </Link>
  );
}
