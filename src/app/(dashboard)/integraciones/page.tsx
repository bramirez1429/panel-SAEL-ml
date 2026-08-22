import { createMercadoLibreApiRepository } from "@/modules/integrations/integrations.composition.server";
import { MercadoLibreIntegrationCard } from "@/modules/integrations/presentation/mercado-libre-integration-card";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  let status: "connected" | "not-connected" = "not-connected";
  try {
    status = (await createMercadoLibreApiRepository().hasConnection())
      ? "connected"
      : "not-connected";
  } catch {
    status = "not-connected";
  }

  return (
    <>
      <PageHeader
        description="Administra las conexiones con tus canales de venta."
      />
      <MercadoLibreIntegrationCard status={status} />
    </>
  );
}
