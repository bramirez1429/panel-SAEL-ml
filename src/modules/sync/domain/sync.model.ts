export const SYNC_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export type SyncJob = Readonly<{
  id: string;
  status: SyncStatus;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
}>;

export type IntegrationEventType =
  | "POSSIBLE_API_CHANGE"
  | "SCHEMA_MISMATCH"
  | "UNKNOWN_PROVIDER_ERROR"
  | "PROVIDER_BEHAVIOR_CHANGE";

export type IntegrationEvent = Readonly<{
  type: IntegrationEventType;
  count: number;
}>;

export type SyncOverview = Readonly<{
  activeSync: SyncJob | null;
  latestSync: SyncJob | null;
  lastSuccessfulSyncAt: string | null;
  nextAutomaticSyncAt: string;
  openErrorsCount: number;
  integrationEvents: readonly IntegrationEvent[];
}>;

export type SyncErrorType =
  | "PUBLICATION_ERROR"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_TEMPORARY_ERROR"
  | "POSSIBLE_API_CHANGE"
  | "MIRROR_WRITE_FAILED";

export type SyncError = Readonly<{
  id: string;
  syncId: string | null;
  itemId: string;
  familyId: string | null;
  type: SyncErrorType;
  code: string | null;
  message: string;
  attempts: number;
  status: "OPEN" | "RETRYING" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}>;

export type StartSyncResult = Readonly<{
  syncId: string;
  status: "PENDING" | "RUNNING";
  created: boolean;
}>;

export type CancelSyncResult = Readonly<{
  syncId: string;
  status: "CANCELLED";
  hasMore: false;
}>;

export type RetrySyncErrorsResult = Readonly<{
  syncId: string;
  retriedItems: number;
  resolvedItems: number;
  openErrorsCount: number;
}>;

export type MirrorWriteResult = Readonly<{
  providerUpdated: boolean;
  mirrorUpdated: boolean;
  warning?: string;
}>;

export type SyncActionResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; message: string }>;

export function isSyncActive(status: SyncStatus): boolean {
  return status === "PENDING" || status === "RUNNING";
}
