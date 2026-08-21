import { Alert, Card, Skeleton } from "antd";

import styles from "./publication-detail-view.module.css";

export function PublicationDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando detalle de la publicación"
      className={styles.loading}
    >
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} title={false} />
      </Card>
    </div>
  );
}

export function PublicationDetailError({
  message,
}: Readonly<{ message: string }>) {
  return (
    <Alert
      className={styles.error}
      description={message}
      message="No se pudo cargar la publicación."
      role="alert"
      showIcon
      type="error"
    />
  );
}
