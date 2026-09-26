import { createGetBackendStatusQuery } from "@/modules/backend-status/backend-status.composition.server";
import type { BackendStatus } from "@/modules/backend-status/domain/backend-status.model";
import { BackendStatusView } from "@/modules/backend-status/presentation/backend-status-view";
import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { createSyncRepository } from "@/modules/sync/sync.composition.server";
import type { SyncOverview } from "@/modules/sync/domain/sync.model";
import { SyncStatusCard } from "@/modules/sync/presentation/sync-status-card.client";
import {
  cancelSyncAction,
  getSyncOverviewAction,
  startSyncAction,
} from "@/modules/sync/presentation/sync.actions";

export const dynamic = "force-dynamic";

async function loadBackendStatus(): Promise<BackendStatus | null> {
  try {
    return await createGetBackendStatusQuery().execute();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return null;
    }

    throw error;
  }
}

export default async function DashboardPage() {
  const [backendStatus, syncOverview] = await Promise.all([
    loadBackendStatus(),
    loadSyncOverview(),
  ]);

  return (
    <>
      <PageHeader
        description="Resumen general del panel de gestión."
      />
      <BackendStatusView status={backendStatus} />
      <SyncStatusCard
        cancelAction={cancelSyncAction}
        getOverviewAction={getSyncOverviewAction}
        initialOverview={syncOverview}
        startAction={startSyncAction}
      />
    </>
  );
}

async function loadSyncOverview(): Promise<SyncOverview | null> {
  try {
    return await createSyncRepository().getOverview();
  } catch (error: unknown) {
    if (error instanceof AppError) return null;
    throw error;
  }
}
