import { Typography } from "antd";

export function MigrationCurrentProduct({ sourceKey }: Readonly<{ sourceKey: string | null }>) {
  if (!sourceKey) return null;
  return <Typography.Text strong>Procesando: {sourceKey}</Typography.Text>;
}
