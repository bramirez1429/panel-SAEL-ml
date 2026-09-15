import { Tag } from "antd";

import type { SaleVariant } from "../domain/sales.model";

type Props = Readonly<{
  variant: SaleVariant;
}>;

export function SaleVariantStatus({ variant }: Props) {
  if (
    variant.mappingStatus === "UNLINKED" ||
    variant.mappingStatus === "AMBIGUOUS"
  ) {
    return <Tag color="warning">Revisar vínculo</Tag>;
  }

  if (variant.hasStockDifference === true) {
    return <Tag color="error">Stock diferente</Tag>;
  }

  if (variant.stockStatus === "OUT_OF_STOCK") {
    return <Tag color="error">Sin stock</Tag>;
  }

  if (variant.stockStatus === "LOW") {
    return <Tag color="warning">Stock bajo</Tag>;
  }

  if (variant.stockStatus === "OK") {
    return <Tag color="success">OK</Tag>;
  }

  return <Tag>Sin datos</Tag>;
}

