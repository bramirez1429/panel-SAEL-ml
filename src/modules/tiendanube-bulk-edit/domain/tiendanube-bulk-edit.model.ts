export type TiendanubeBulkEditField = "price" | "promotionalPrice" | "stock";

export type TiendanubeBulkEditRequest = Readonly<{
  categoryId: string;
  changes: Readonly<{
    price?: string;
    promotionalPrice?: string;
    stock?: number;
    locationId?: string;
  }>;
}>;

export type TiendanubeBulkEditCategorySummary = Readonly<{
  categoryId: string;
  productCount: number;
  variantCount: number;
  locations: readonly Readonly<{ id: string }>[];
  products: readonly Readonly<{
    id: string;
    name: string;
    variants: readonly Readonly<{
      id: string;
      sku: string | null;
      size: string | null;
      color: string | null;
      price: string;
      promotionalPrice: string | null;
      stock: number | null;
    }>[];
  }>[];
}>;

export type TiendanubeBulkEditPreview = Readonly<{
  id: string;
  categoryId: string;
  productCount: number;
  variantCount: number;
  products: TiendanubeBulkEditCategorySummary["products"];
  locations: TiendanubeBulkEditCategorySummary["locations"];
  changes: Readonly<Partial<Record<TiendanubeBulkEditField, string | number>>>;
  preservedFields: readonly TiendanubeBulkEditField[];
  incompatibilities: readonly Readonly<{ variantId: string; reason: string }>[];
  generatedAt: string;
  expiresAt: string;
}>;

export type TiendanubeBulkEditStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "PAUSED" | "FAILED";

export type TiendanubeBulkEditJob = Readonly<{
  id: string;
  status: TiendanubeBulkEditStatus;
  totalProducts: number;
  totalVariants: number;
  completedVariants: number;
  failedVariants: number;
  pendingVariants: number;
}>;

export type TiendanubeBulkEditFailure = Readonly<{
  productName: string;
  productId: string;
  sku: string | null;
  variant: string | null;
  variantId: string;
  error: string;
}>;
