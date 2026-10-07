export type MercadolibreSyncStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type MercadolibreSyncProgress = Readonly<{
  ok: true;
  syncId: string;
  status: MercadolibreSyncStatus;
  totalItems: number;
  processedItems: number;
  productsSaved: number;
  childrenSaved: number;
  errorsCount: number;
  lastError: string | null;
  hasMore: boolean;
}>;

export type MercadolibreSyncActionResult =
  | MercadolibreSyncProgress
  | Readonly<{ ok: false; message: string }>;
