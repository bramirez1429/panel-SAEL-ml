import { Card, Typography } from "antd";

import type { TiendanubeMigrationOutcome, TiendanubeMigrationResult } from "../domain/tiendanube-migration.model";

export function MigrationResultCard({ outcome, result }: Readonly<{ outcome: TiendanubeMigrationOutcome; result: TiendanubeMigrationResult }>) {
  return <Card size="small">
    <Typography.Text strong>{result.title}</Typography.Text>
    <Typography.Paragraph type="secondary">MLA: {result.mlaIds.join(", ") || "—"}<br />Family ID: {result.familyId ?? "—"}<br />MLAU: {result.mlauIds.join(", ") || "—"}</Typography.Paragraph>
    {outcome === "REJECTED" ? <Typography.Text type="danger">Motivo: {result.rejectionReason ?? "Sin detalle informado"}</Typography.Text> : <Typography.Text type="success">Tiendanube ID: {result.tiendanubeProductId ?? "—"}<br />{creationResult(result.action)}</Typography.Text>}
  </Card>;
}

function creationResult(action: TiendanubeMigrationResult["action"]): string {
  if (action === "CREATED") return "Producto creado";
  if (action === "LINKED") return "Vinculación existente";
  return "Resultado no informado";
}
