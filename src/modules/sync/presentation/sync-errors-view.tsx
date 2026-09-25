import { Space, Typography } from "antd";

import type { SyncError } from "../domain/sync.model";
import { IntegrationEventBanner } from "./integration-event-banner";
import { SyncErrorsTable, type LoadSyncErrorsAction, type RetryAllSyncErrorsAction, type RetryOneSyncErrorAction, type RetrySelectedSyncErrorsAction } from "./sync-errors-table.client";
import { SyncMirrorWarning } from "./sync-mirror-warning";

export function SyncErrorsView({
  syncId,
  errors,
  loadErrorsAction,
  retryOneAction,
  retrySelectedAction,
  retryAllAction,
}: Readonly<{
  syncId: string;
  errors: readonly SyncError[];
  loadErrorsAction: LoadSyncErrorsAction;
  retryOneAction: RetryOneSyncErrorAction;
  retrySelectedAction: RetrySelectedSyncErrorsAction;
  retryAllAction: RetryAllSyncErrorsAction;
}>) {
  const possibleApiChanges = errors.filter((error) => error.type === "POSSIBLE_API_CHANGE").length;
  const hasMirrorWriteFailure = errors.some((error) => error.type === "MIRROR_WRITE_FAILED");

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>Errores de sincronización</Typography.Title>
        <Typography.Text type="secondary">Revisá y reintentá las publicaciones que no pudieron sincronizarse.</Typography.Text>
      </div>
      <IntegrationEventBanner events={possibleApiChanges > 0 ? [{ type: "POSSIBLE_API_CHANGE", count: possibleApiChanges }] : []} />
      {hasMirrorWriteFailure ? <SyncMirrorWarning result={{ providerUpdated: true, mirrorUpdated: false }} /> : null}
      <SyncErrorsTable
        initialErrors={errors}
        loadErrorsAction={loadErrorsAction}
        retryAllAction={retryAllAction}
        retryOneAction={retryOneAction}
        retrySelectedAction={retrySelectedAction}
        syncId={syncId}
      />
    </Space>
  );
}
