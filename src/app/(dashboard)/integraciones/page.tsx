import { MercadoLibreIntegrationCard } from "@/modules/integrations/presentation/mercado-libre-integration-card";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/**
 * El OAuth actual del backend guarda una conexión global, sin vincularla al usuario
 * autenticado. Hasta contar con ese contrato, la UI no infiere una conexión propia.
 */
const currentUserMercadoLibreStatus = "not-connected" as const;

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        description="Administra las conexiones con tus canales de venta."
      />
      <MercadoLibreIntegrationCard status={currentUserMercadoLibreStatus} />
    </>
  );
}
