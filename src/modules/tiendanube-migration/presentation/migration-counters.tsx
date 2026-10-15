import { Space, Typography } from "antd";

import type { TiendanubeMigrationProgress } from "../domain/tiendanube-migration.model";

export function MigrationCounters({ progress }: Readonly<{ progress: TiendanubeMigrationProgress }>) {
  const total = progress.totalProducts === null ? "—" : progress.totalProducts;
  return <Space direction="vertical" size={2}>
    <Typography.Text strong>Procesados: {progress.processedProducts} / {total}</Typography.Text>
    <Typography.Text type="success">Aprobados: {progress.approvedProducts}</Typography.Text>
    <Typography.Text type="danger">Rechazados: {progress.rejectedProducts}</Typography.Text>
  </Space>;
}
