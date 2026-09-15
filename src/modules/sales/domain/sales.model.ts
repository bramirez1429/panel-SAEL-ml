export type SaleChannel = "MERCADOLIBRE" | "TIENDANUBE";

export type SaleMappingStatus =
  | "LINKED"
  | "AUTO_LINKED"
  | "UNLINKED"
  | "AMBIGUOUS";

export type StockStatus = "OUT_OF_STOCK" | "LOW" | "OK" | null;

export type RecentSaleSummary = Readonly<{
  saleId: string;
  channel: SaleChannel;
  soldAt: string;
  quantity: number;
  productName: string;
  sku: string | null;

  mlItemId: string | null;
  mlVariationId: string | null;
  userProductId: string | null;
  familyId: string | null;

  tnProductId: string | null;
  tnVariantId: string | null;

  color: string | null;
  size: string | null;

  mlStock: number | null;
  tiendaNubeStock: number | null;

  stockDifference: number | null;
  mappingStatus: SaleMappingStatus;
  lowStockCount: number;
  hasStockDifference: boolean | null;
}>;

export type RecentSalesResponse = Readonly<{
  hours: number;
  items: readonly RecentSaleSummary[];
}>;

export type SaleVariant = Readonly<{
  sku: string | null;
  color: string | null;
  size: string | null;

  ml: Readonly<{
    itemId: string;
    variationId: string | null;
    userProductId: string | null;
    familyId: string | null;
    stock: number | null;
  }> | null;

  tiendaNube: Readonly<{
    productId: string;
    variantId: string;
    stock: number | null;
  }> | null;

  difference: number | null;
  stockDifference: number | null;
  hasStockDifference: boolean | null;

  mappingStatus: SaleMappingStatus;
  stockStatus: StockStatus;
}>;

export type SaleVariantsResponse = Readonly<{
  sale: Readonly<{
    id: string;
    channel: SaleChannel;
    externalOrderId: string;
    externalOrderItemId: string;
    soldAt: string;
    quantity: number;
    productName: string;
    sku: string | null;

    mlItemId: string | null;
    mlVariationId: string | null;
    userProductId: string | null;
    familyId: string | null;

    tnProductId: string | null;
    tnVariantId: string | null;

    color: string | null;
    size: string | null;

    mappingStatus: SaleMappingStatus;
    createdAt: string;
    updatedAt: string;
  }>;

  variants: readonly SaleVariant[];
}>;


export type SalesSyncResult = Readonly<{
  hours: number;
  mercadoLibre: Readonly<{
    found: number;
    processed: number;
    failed: number;
  }>;
}>;
