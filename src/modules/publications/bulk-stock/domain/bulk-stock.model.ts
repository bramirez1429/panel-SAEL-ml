export const BULK_STOCK_PRODUCT_TYPES = [
  "BUZO_MUJER",
  "BUZO_NENA",
  "REMERA_MUJER",
  "REMERA_NENA",
] as const;

export type BulkStockProductType = (typeof BULK_STOCK_PRODUCT_TYPES)[number];

export type BulkStockSize = Readonly<{
  size: string;
  quantity: number;
}>;

export type BulkStockPreviewRequest = Readonly<{
  productType: BulkStockProductType;
  sizes: readonly BulkStockSize[];
}>;

export type BulkStockPublicationType = "USER_PRODUCT" | "LEGACY";

export type BulkStockPreviewSummary = Readonly<{
  found: number;
  editable: number;
  active: number;
  paused: number;
  outOfStock: number;
  unchanged: number;
  userProduct: number;
  legacy: number;
}>;

export type BulkStockVariant = Readonly<{
  key: string;
  itemId: string;
  familyId: string | null;
  variationId: string | null;
  userProductId: string | null;
  model: BulkStockPublicationType;
  title: string;
  color: string | null;
  size: string;
  publicationType: BulkStockPublicationType;
  currentStock: number;
  newStock: number;
  currentQuantity: number;
  requestedQuantity: number;
  currentStatus: string | null;
  status: string;
  editable: boolean;
  needsChange: boolean;
  reason: string | null;
  storeId: string | null;
  networkNodeId: string | null;
}>;

export type BulkStockPreview = Readonly<{
  previewId: string | null;
  summary: BulkStockPreviewSummary;
  variants: readonly BulkStockVariant[];
}>;

export type BulkStockJobTarget = Readonly<{
  identifier: string;
  title: string | null;
  color: string | null;
  size: string;
  itemId: string;
  userProductId: string | null;
  variationId: string | null;
  familyId: string | null;
  model: BulkStockPublicationType;
  currentQuantity: number;
  requestedQuantity: number;
  currentStatus: string | null;
  needsChange: boolean;
  editable: boolean;
  reason?: string;
  storeId?: string;
  networkNodeId?: string;
}>;

export type CreateBulkStockJobRequest = Readonly<{
  targets: readonly BulkStockJobTarget[];
}>;

export type BulkStockJobState = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type BulkStockJobItemState = "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR" | "SKIPPED";

export type BulkStockJobItem = Readonly<{
  key: string;
  identifier?: string;
  title: string;
  color: string | null;
  size: string;
  previousStock: number | null;
  newStock: number | null;
  familyId?: string | null;
  model?: BulkStockPublicationType;
  previousStatus?: string | null;
  editable?: boolean;
  reason?: string | null;
  storeId?: string | null;
  networkNodeId?: string | null;
  status: BulkStockJobItemState;
  message: string | null;
  itemId: string | null;
  variationId: string | null;
  userProductId: string | null;
}>;

export type BulkStockJob = Readonly<{
  jobId: string;
  status: BulkStockJobState;
  processed: number;
  total: number;
  succeeded: number;
  errors: number;
  skipped: number;
  pending: number;
  items: readonly BulkStockJobItem[];
}>;

export type BulkStockActionResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; message: string }>;

export type PreviewBulkStockAction = (
  request: BulkStockPreviewRequest,
) => Promise<BulkStockActionResult<BulkStockPreview>>;

export type CreateBulkStockJobAction = (
  request: CreateBulkStockJobRequest,
) => Promise<BulkStockActionResult<Readonly<{ jobId: string }>>>;

export type GetBulkStockJobAction = (
  jobId: string,
) => Promise<BulkStockActionResult<BulkStockJob>>;

export function isBulkStockJobRunning(status: BulkStockJobState): boolean {
  return status === "PENDING" || status === "PROCESSING";
}
