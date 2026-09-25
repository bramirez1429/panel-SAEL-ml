import { Alert } from "antd";

import { AppError } from "@/shared/errors/app-error";
import type { SyncError, SyncOverview } from "@/modules/sync/domain/sync.model";
import { createSyncRepository } from "@/modules/sync/sync.composition.server";
import { SyncErrorsView } from "@/modules/sync/presentation/sync-errors-view";
import {
  getOpenSyncErrorsAction,
  retryAllSyncErrorsAction,
  retrySelectedSyncErrorsAction,
  retrySyncErrorAction,
} from "@/modules/sync/presentation/sync.actions";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function SyncErrorsPage({ searchParams }: Props) {
  const requestedSyncId = singleValue((await searchParams).syncId);
  const result = await loadSyncErrors(requestedSyncId);

  if (!result.syncId) {
    return <Alert title="Todavía no hay una sincronización para revisar." showIcon type="info" />;
  }
  if (result.error) {
    return <Alert title={result.error} showIcon type="error" />;
  }

  return (
    <SyncErrorsView
      errors={result.errors}
      loadErrorsAction={getOpenSyncErrorsAction}
      retryAllAction={retryAllSyncErrorsAction}
      retryOneAction={retrySyncErrorAction}
      retrySelectedAction={retrySelectedSyncErrorsAction}
      syncId={result.syncId}
    />
  );
}

async function loadSyncErrors(requestedSyncId: string | undefined): Promise<Readonly<{
  syncId: string | null;
  errors: readonly SyncError[];
  error: string | null;
}>> {
  const repository = createSyncRepository();
  let syncId = requestedSyncId ?? null;
  try {
    let overview: SyncOverview | null = null;
    if (!requestedSyncId) overview = await repository.getOverview();
    syncId = requestedSyncId ?? overview?.activeSync?.id ?? overview?.latestSync?.id ?? null;
    if (!syncId) return { syncId: null, errors: [], error: null };
    return { syncId, errors: await repository.getOpenErrors(syncId), error: null };
  } catch (error: unknown) {
    return {
      syncId,
      errors: [],
      error: error instanceof AppError
        ? error.message
        : "No se pudieron cargar los errores de sincronización.",
    };
  }
}

function singleValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
