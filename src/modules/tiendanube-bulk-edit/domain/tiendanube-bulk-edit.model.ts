export type TiendanubeBulkEditField = "price" | "promotionalPrice" | "stock";

export type TiendanubeBulkEditRequest = Readonly<{
  categoryId: number;
  price?: number;
  promotionalPrice?: number;
  stock?: number;
  locationId?: string;
}>;

export type TiendanubeBulkEditCategorySummary = Readonly<{
  productCount: number;
  variantCount: number;
  locations: readonly Readonly<{ id: string; name: string }>[];
  products: readonly Readonly<{
    id: string;
    name: string;
    variants: readonly Readonly<{
      id: string;
      sku: string | null;
      size: string | null;
      color: string | null;
      price: number | null;
      promotionalPrice: number | null;
      stock: number | null;
    }>[];
  }>[];
}>;

export type TiendanubeBulkEditPreview = Readonly<{
  id: string;
  categoryId: number;
  productCount: number;
  variantCount: number;
  changes: Readonly<Partial<Record<TiendanubeBulkEditField, number>>>;
  preservedFields: readonly TiendanubeBulkEditField[];
  incompatibilities: readonly string[];
}>;

export type TiendanubeBulkEditStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "PAUSED" | "FAILED";

export type TiendanubeBulkEditJob = Readonly<{
  id: string;
  status: TiendanubeBulkEditStatus;
  totalProducts: number;
  totalVariants: number;
  updatedVariants: number;
  failedVariants: number;
  pendingVariants: number;
}>;

export type TiendanubeBulkEditFailure = Readonly<{
  id: string;
  productName: string;
  tiendanubeProductId: string;
  variantId: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  field: TiendanubeBulkEditField;
  message: string;
  technicalDetail: string | null;
  status: "PENDING_RETRY" | "FAILED";
  adminUrl: string | null;
}>;

export type TiendanubeBulkEditFailuresPage = Readonly<{
  items: readonly TiendanubeBulkEditFailure[];
  total: number;
}>;
