export type TiendanubeMigrationStatus = "PENDING" | "DISCOVERING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type TiendanubeMigrationOutcome = "APPROVED" | "REJECTED";

export type TiendanubeMigrationProduct = Readonly<{
  title: string;
  mlaIds: readonly string[];
  familyId: string | null;
  mlauIds: readonly string[];
}>;

export type TiendanubeMigrationCurrentProduct = TiendanubeMigrationProduct;

export type TiendanubeMigrationProgress = Readonly<{
  jobId: string;
  status: TiendanubeMigrationStatus;
  totalProducts: number | null;
  processedProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  currentProduct: TiendanubeMigrationCurrentProduct | null;
}>;

export type TiendanubeMigrationResult = TiendanubeMigrationProduct & Readonly<{
  id: string;
  rejectionReason: string | null;
  tiendanubeProductId: string | null;
  action: "CREATED" | "LINKED" | null;
}>;

export type TiendanubeMigrationResultsPage = Readonly<{
  items: readonly TiendanubeMigrationResult[];
  page: number;
  pageSize: number;
  total: number;
}>;

export type TiendanubeMigrationActionResult = TiendanubeMigrationProgress | Readonly<{ ok: false; message: string }>;
export type TiendanubeActiveMigrationActionResult = TiendanubeMigrationProgress | null | Readonly<{ ok: false; message: string }>;
export type TiendanubeMigrationResultsActionResult = TiendanubeMigrationResultsPage | Readonly<{ ok: false; message: string }>;
