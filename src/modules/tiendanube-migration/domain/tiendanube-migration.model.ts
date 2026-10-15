export type TiendanubeMigrationStatus = "DISCOVERING" | "QUEUED" | "RUNNING" | "WAITING_RECONCILIATION" | "PAUSED" | "COMPLETED" | "COMPLETED_WITH_REJECTIONS";

export type TiendanubeMigrationOutcome = "APPROVED" | "REJECTED";

export type TiendanubeMigrationProduct = Readonly<{
  sourceKey: string;
  title: string | null;
  mlaIds: readonly string[];
  familyId: string | null;
  mlauIds: readonly string[];
}>;

export type TiendanubeMigrationProgress = Readonly<{
  id: string;
  status: TiendanubeMigrationStatus;
  totalItems: number;
  processedItems: number;
  approvedItems: number;
  rejectedItems: number;
  currentSourceKey: string | null;
}>;

export type TiendanubeMigrationResult = TiendanubeMigrationProduct & Readonly<{
  id: string;
  status: "PENDING" | "PROCESSING" | "RECONCILING" | "APPROVED" | "REJECTED";
  outcome: "CREATED" | "ALREADY_EXISTS" | null;
  tiendanubeProductId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  updatedAt: string;
  action: "CREATED" | "LINKED" | null;
}>;

export type TiendanubeMigrationResultsPage = Readonly<{
  items: readonly TiendanubeMigrationResult[];
  page: number;
  limit: number;
  total: number;
}>;

export type TiendanubeMigrationActionResult = TiendanubeMigrationProgress | Readonly<{ ok: false; message: string }>;
export type TiendanubeActiveMigrationActionResult = TiendanubeMigrationProgress | null | Readonly<{ ok: false; message: string }>;
export type TiendanubeMigrationResultsActionResult = TiendanubeMigrationResultsPage | Readonly<{ ok: false; message: string }>;
