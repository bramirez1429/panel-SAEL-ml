import { Space, Typography } from "antd";
import type { TiendanubeMigrationProgress } from "../domain/tiendanube-migration.model";

export function MigrationCounters({ progress }: Readonly<{ progress: TiendanubeMigrationProgress }>) {
  return <Space direction="vertical" size={2}>
    <Typography.Text strong>Procesados: {progress.processedItems} / {progress.totalItems}</Typography.Text>
    <Typography.Text type="success">Aprobados: {progress.approvedItems}</Typography.Text>
    <Typography.Text type="danger">Rechazados: {progress.rejectedItems}</Typography.Text>
  </Space>;
}
