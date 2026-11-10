import Link from "next/link";
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
      <section aria-labelledby="pricing-calculator-title" style={{ marginTop: 24 }}>
        <Link
          href="/calculadora-precios"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, padding: 22, border: "1px solid #e9dff6",
            borderRadius: 16, background: "linear-gradient(120deg, #fff, #f8f1fc)",
            color: "inherit", textDecoration: "none", boxShadow: "0 6px 24px rgba(75,43,104,.05)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 12, background: "#f0e5fc", color: "#7136ab", fontSize: 25 }}>
              ▦
            </span>
            <span style={{ display: "grid", gap: 4 }}>
              <strong id="pricing-calculator-title" style={{ fontSize: 18 }}>Calculadora de Mercado Libre y Tiendanube</strong>
              <span style={{ fontSize: 13, color: "#656577" }}>Calculá precios sugeridos, comisiones, descuentos, cuotas, envíos y ganancias de SAEL.</span>
            </span>
          </span>
          <span aria-hidden="true" style={{ fontSize: 20, color: "#7136ab", flexShrink: 0 }}>→</span>
        </Link>
      </section>
      <BackendStatusView status={backendStatus} />
    </>
  );
}
