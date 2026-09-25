import type {
  RetrySyncErrorsResult,
  StartSyncResult,
  SyncError,
  SyncJob,
  SyncOverview,
} from "./sync.model";

export interface SyncRepository {
  getOverview(): Promise<SyncOverview>;
  startFullSync(): Promise<StartSyncResult>;
  getStatus(syncId: string): Promise<SyncJob>;
  getOpenErrors(syncId: string): Promise<readonly SyncError[]>;
  retryOne(syncId: string, errorId: string): Promise<RetrySyncErrorsResult>;
  retrySelected(syncId: string, errorIds: readonly string[]): Promise<RetrySyncErrorsResult>;
  retryAll(syncId: string): Promise<RetrySyncErrorsResult>;
}
