import Link from "next/link";

import styles from "./publication-detail-view.module.css";

type BackToPublicationsLinkProps = Readonly<{
  returnTo?: string;
}>;

export function BackToPublicationsLink({
  returnTo,
}: BackToPublicationsLinkProps) {
  return (
    <Link className={styles.backLink} href={normalizeReturnTo(returnTo)}>
      ← Volver a Publicaciones
    </Link>
  );
}

function normalizeReturnTo(returnTo: string | undefined): string {
  return returnTo?.startsWith("/publicaciones") ? returnTo : "/publicaciones";
}
