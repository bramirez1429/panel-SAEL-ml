import { createMercadoLibreApiRepository, createTiendanubeApiRepository } from "@/modules/integrations/integrations.composition.server";
import type { IntegrationStatus } from "@/modules/integrations/domain/integration.model";
import { IntegrationCard } from "@/modules/integrations/presentation/integration-card.client";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { disconnectMercadoLibre, disconnectTiendanube } from "./actions";
import styles from "./integraciones.module.css";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [mercadoLibre, tiendanube] = await Promise.all([
    readMercadoLibre(),
    readTiendanube(),
  ]);
  return <>
    <PageHeader description="Administra las conexiones con tus canales de venta." />
    <div className={styles.grid}>
      <IntegrationCard name="Mercado Libre" description="Conectá tu cuenta para gestionar tus publicaciones." icon="ML" status={mercadoLibre.status} detail={mercadoLibre.sellerId ? `Seller ID: ${mercadoLibre.sellerId}` : null} connectHref="/api/integrations/mercado-libre/connect" disconnectAction={disconnectMercadoLibre} />
      <IntegrationCard name="Tiendanube" description="Conectá tu tienda para replicar productos." icon="TN" status={tiendanube.status} detail={tiendanube.storeId ? `Store ID: ${tiendanube.storeId}` : null} connectHref="/api/integrations/tiendanube/connect" disconnectAction={disconnectTiendanube} />
    </div>
  </>;
}

async function readMercadoLibre(): Promise<{ status: IntegrationStatus; sellerId: number | null }> {
  try { const result = await createMercadoLibreApiRepository().getConnection(); return result.connected ? { status: "connected", sellerId: result.sellerId } : { status: "not-connected", sellerId: null }; }
  catch { return { status: "unknown", sellerId: null }; }
}

async function readTiendanube(): Promise<{ status: IntegrationStatus; storeId: string | null }> {
  try { const result = await createTiendanubeApiRepository().getConnection(); return result.connected ? { status: "connected", storeId: result.storeId } : { status: "not-connected", storeId: null }; }
  catch { return { status: "unknown", storeId: null }; }
}
