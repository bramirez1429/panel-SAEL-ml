import { Typography } from "antd";

import type { TiendanubeMigrationCurrentProduct } from "../domain/tiendanube-migration.model";

export function MigrationCurrentProduct({ product }: Readonly<{ product: TiendanubeMigrationCurrentProduct | null }>) {
  if (!product) return null;
  return <div>
    <Typography.Text strong>Procesando: {product.title}</Typography.Text>
    <Typography.Paragraph type="secondary">MLA: {product.mlaIds.join(", ") || "—"} · Family: {product.familyId ?? "—"} · MLAU: {product.mlauIds.join(", ") || "—"}</Typography.Paragraph>
  </div>;
}
