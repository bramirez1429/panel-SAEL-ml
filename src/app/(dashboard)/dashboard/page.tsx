import { createGetBackendStatusQuery } from "@/modules/backend-status/backend-status.composition.server";
import type { BackendStatus } from "@/modules/backend-status/domain/backend-status.model";
import { BackendStatusView } from "@/modules/backend-status/presentation/backend-status-view";
import { AppError } from "@/shared/errors/app-error";

import styles from "./dashboard.module.css";

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
      <section
        className={styles.introduction}
        aria-labelledby="dashboard-title"
      >
        <h1 className={styles.title} id="dashboard-title">
          Dashboard
        </h1>
        <p className={styles.description}>Panel de gestión</p>
      </section>
      <BackendStatusView status={backendStatus} />
    </>
  );
}
