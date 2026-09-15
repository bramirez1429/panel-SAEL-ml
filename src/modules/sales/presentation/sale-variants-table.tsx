import { Table, Tag } from "antd";
import type { TableColumnsType } from "antd";

import type {
  SaleVariant,
  SaleVariantsResponse,
} from "../domain/sales.model";
import { SaleVariantStatus } from "./sale-variant-status";

type Props = Readonly<{
  detail: SaleVariantsResponse;
}>;

export function SaleVariantsTable({ detail }: Props) {
  const columns: TableColumnsType<SaleVariant> = [
    {
      title: "Color",
      render: (_, variant) => (
        <>
          {variant.color ?? "—"}
          {isSoldVariant(variant, detail) && (
            <Tag color="blue" style={{ marginLeft: 6 }}>
              Vendida
            </Tag>
          )}
        </>
      ),
    },
    {
      title: "Talle",
      render: (_, variant) => variant.size ?? "—",
    },
    {
      title: "SKU",
      render: (_, variant) => variant.sku ?? "Sin SKU",
    },
    {
      title: "ML",
      render: (_, variant) => variant.ml?.stock ?? "—",
    },
    {
      title: "TN",
      render: (_, variant) => variant.tiendaNube?.stock ?? "—",
    },
    {
      title: "Diferencia",
      render: (_, variant) => variant.stockDifference ?? "—",
    },
    {
      title: "Estado",
      render: (_, variant) => (
        <SaleVariantStatus variant={variant} />
      ),
    },
  ];

  return (
    <Table<SaleVariant>
      columns={columns}
      dataSource={[...detail.variants]}
      pagination={false}
      rowKey={variantKey}
      scroll={{ x: 700 }}
      size="small"
    />
  );
}

function isSoldVariant(
  variant: SaleVariant,
  detail: SaleVariantsResponse,
) {
  const sale = detail.sale;

  if (sale.mlItemId) {
    return (
      variant.ml?.itemId === sale.mlItemId &&
      variant.ml?.variationId === sale.mlVariationId
    );
  }

  return (
    variant.tiendaNube?.productId === sale.tnProductId &&
    variant.tiendaNube?.variantId === sale.tnVariantId
  );
}

function variantKey(variant: SaleVariant) {
  return [
    variant.ml?.itemId,
    variant.ml?.variationId,
    variant.tiendaNube?.productId,
    variant.tiendaNube?.variantId,
    variant.color,
    variant.size,
  ]
    .filter(Boolean)
    .join(":");
}

