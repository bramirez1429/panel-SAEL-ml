import { Card, Descriptions, Space, Tag, Typography } from "antd";

import type { RecentSaleSummary } from "../domain/sales.model";
import { SaleVariants } from "./sale-variants.client";

type Props = Readonly<{
  sale: RecentSaleSummary;
}>;

export function SaleCard({ sale }: Props) {
  return (
    <Card
      title={sale.productName || "Producto"}
      extra={<MappingTag status={sale.mappingStatus} />}
    >
      <Typography.Text type="secondary">
        {channelLabel(sale.channel)} · {formatDate(sale.soldAt)}
      </Typography.Text>

      <Descriptions
        column={{ xs: 1, sm: 2, md: 4 }}
        size="small"
        style={{ marginTop: 16 }}
      >
        <Descriptions.Item label="Vendida">
          {[sale.color, sale.size].filter(Boolean).join(" / ") || "—"}
        </Descriptions.Item>

        <Descriptions.Item label="Cantidad">
          {sale.quantity}
        </Descriptions.Item>

        <Descriptions.Item label="SKU">
          {sale.sku ?? "Sin SKU"}
        </Descriptions.Item>

        <Descriptions.Item label="MLA">
          {sale.mlItemId ?? "—"}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap style={{ marginTop: 12 }}>
        <Tag>ML: {sale.mlStock ?? "—"}</Tag>
        <Tag>TN: {sale.tiendaNubeStock ?? "—"}</Tag>

        {sale.hasStockDifference === true ? (
          <Tag color="error">Diferencia de stock</Tag>
        ) : (
          <Tag color="success">Sincronizado</Tag>
        )}

        {sale.lowStockCount > 0 && (
          <Tag color="warning">
            {sale.lowStockCount} con stock bajo
          </Tag>
        )}
      </Space>

      <SaleVariants saleId={sale.saleId} />
    </Card>
  );
}

function MappingTag({
  status,
}: Readonly<{ status: RecentSaleSummary["mappingStatus"] }>) {
  if (status === "LINKED") return <Tag color="success">Vinculado</Tag>;
  if (status === "AUTO_LINKED") return <Tag color="processing">Auto vinculado</Tag>;
  if (status === "AMBIGUOUS") return <Tag color="warning">Revisar</Tag>;

  return <Tag>Sin vincular</Tag>;
}

function channelLabel(channel: RecentSaleSummary["channel"]) {
  return channel === "MERCADOLIBRE" ? "Mercado Libre" : "Tienda Nube";
}

function formatDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

