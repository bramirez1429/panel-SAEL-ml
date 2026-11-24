import Link from "next/link";

import { createGetBackendStatusQuery } from "@/modules/backend-status/backend-status.composition.server";
import type { BackendStatus } from "@/modules/backend-status/domain/backend-status.model";
import { BackendStatusView } from "@/modules/backend-status/presentation/backend-status-view";
import { DashboardTasks } from "@/modules/dashboard-tasks/presentation/dashboard-tasks.client";
import { AppError } from "@/shared/errors/app-error";
import styles from "./dashboard.module.css";
import { SalesHomeSummary } from "@/modules/sales/operations/sales-operations-view.client";

export const dynamic = "force-dynamic";

async function loadBackendStatus(): Promise<BackendStatus | null> {
  try {
    return await createGetBackendStatusQuery().execute();
  } catch (error: unknown) {
    if (error instanceof AppError) return null;
    throw error;
  }
}

export default async function DashboardPage() {
  const backendStatus = await loadBackendStatus();

  return (
    <div className={styles.page}>
      <SalesHomeSummary />
      <Link href="/calculadora-precios" className={styles.calculatorCard}>
        <span className={styles.calculatorIcon} aria-hidden="true">
          ▦
        </span>
        <span className={styles.calculatorText}>
          <strong>Calculadora de Mercado Libre y Tiendanube</strong>
          <span>Precios, comisiones, descuentos, cuotas, envíos y ganancias de SAEL.</span>
        </span>
        <span className={styles.calculatorArrow} aria-hidden="true">→</span>
      </Link>

      <Link href="/stock-unificado" className={styles.calculatorCard}>
        <span className={styles.calculatorIcon} aria-hidden="true">
          ▤
        </span>
        <span className={styles.calculatorText}>
          <strong>Stock Unificado ML + Tiendanube</strong>
          <span>Compará stock y vinculá variantes de Mercado Libre y Tiendanube sólo cuando tengan el mismo SKU.</span>
        </span>
        <span className={styles.calculatorArrow} aria-hidden="true">→</span>
      </Link>

      <div className={styles.lowerGrid}>
        <DashboardTasks />

        <aside className={styles.backendColumn} aria-label="Conexión del sistema">
          <div className={styles.backendPanel}>
            <span className={styles.systemEyebrow}>ESTADO DEL SISTEMA</span>
            <BackendStatusView status={backendStatus} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
