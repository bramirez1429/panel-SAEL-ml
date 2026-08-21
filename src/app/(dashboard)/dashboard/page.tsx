import { createGetBackendStatusQuery } from "@/modules/backend-status/backend-status.composition.server";
import type { BackendStatus } from "@/modules/backend-status/domain/backend-status.model";
import { BackendStatusView } from "@/modules/backend-status/presentation/backend-status-view";
import { AppError } from "@/shared/errors/app-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";

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
  const backendStatus = await loadBackendStatus();

  return (
    <>
      <PageHeader
        description="Resumen general del panel de gestión."
      />
      <BackendStatusView status={backendStatus} />
    </>
  );
}
