import { createMercadoLibreApiRepository, createTiendanubeApiRepository, createTiendaNegocioApiRepository } from "@/modules/integrations/integrations.composition.server";
import type { IntegrationStatus } from "@/modules/integrations/domain/integration.model";
import { IntegrationCard } from "@/modules/integrations/presentation/integration-card.client";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { disconnectMercadoLibre, disconnectTiendanube, disconnectTiendaNegocio } from "./actions";
import styles from "./integraciones.module.css";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [mercadoLibre, tiendanube, tiendaNegocio] = await Promise.all([
    readMercadoLibre(),
    readTiendanube(),
    readTiendaNegocio(),
  ]);
  return <>
    <PageHeader description="Administra las conexiones con tus canales de venta." />
    <div className={styles.grid}>
      <IntegrationCard name="Mercado Libre" description="Conectá tu cuenta para gestionar tus publicaciones." icon="ML" status={mercadoLibre.status} detail={mercadoLibre.sellerId ? `Seller ID: ${mercadoLibre.sellerId}` : null} connectHref="/api/integrations/mercado-libre/connect" disconnectAction={disconnectMercadoLibre} />
      <IntegrationCard name="Tiendanube" description="Conectá tu tienda para replicar productos." icon="TN" status={tiendanube.status} detail={tiendanube.storeId ? `Store ID: ${tiendanube.storeId}` : null} connectHref="/api/integrations/tiendanube/connect" disconnectAction={disconnectTiendanube} />
      <IntegrationCard
        name="Tienda Negocio"
        description="Autorizá tu tienda para sincronizar publicaciones de Mercado Libre."
        icon="TN"
        status={tiendaNegocio.status}
        detail={tiendaNegocio.storeId ? `Store ID: ${tiendaNegocio.storeId}` : null}
        connectHref="/api/integrations/tienda-negocio/connect"
        connectDisabled={!tiendaNegocio.authorizationConfigured}
        connectDisabledReason="Falta configurar la aplicación OAuth de Tienda Negocio en el backend."
        disconnectAction={disconnectTiendaNegocio}
      />
    </div>
  </>;
}

async function readMercadoLibre(): Promise<{ status: IntegrationStatus; sellerId: number | null }> {
  try {
    const result = await createMercadoLibreApiRepository().getConnection();
    if (result.reconnectRequired) {
      return { status: "reconnect-required", sellerId: result.sellerId };
    }
    return result.connected
      ? { status: "connected", sellerId: result.sellerId }
      : { status: "not-connected", sellerId: null };
  }
  catch { return { status: "unknown", sellerId: null }; }
}

async function readTiendanube(): Promise<{ status: IntegrationStatus; storeId: string | null }> {
  try { const result = await createTiendanubeApiRepository().getConnection(); return result.connected ? { status: "connected", storeId: result.storeId } : { status: "not-connected", storeId: null }; }
  catch { return { status: "unknown", storeId: null }; }
}

async function readTiendaNegocio(): Promise<{
  status: IntegrationStatus;
  storeId: string | null;
  authorizationConfigured: boolean;
}> {
  try {
    const result = await createTiendaNegocioApiRepository().getConnection();
    return {
      status: result.connected ? "connected" : "not-connected",
      storeId: result.connected ? result.storeId : null,
      authorizationConfigured: result.authorizationConfigured,
    };
  } catch {
    return { status: "unknown", storeId: null, authorizationConfigured: false };
  }
}
