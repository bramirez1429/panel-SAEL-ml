import { createMercadoLibreApiRepository, createTiendanubeApiRepository, createTiendaNegocioApiRepository } from "@/modules/integrations/integrations.composition.server";
import type { IntegrationStatus } from "@/modules/integrations/domain/integration.model";
import { IntegrationCard } from "@/modules/integrations/presentation/integration-card.client";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { disconnectMercadoLibre, disconnectTiendanube, disconnectTiendaNegocio } from "./actions";
import styles from "./integraciones.module.css";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<{ tiendaNegocio?: string; reason?: string }>;
}>;

export default async function IntegrationsPage({ searchParams }: Props) {
  const { tiendaNegocio: authorizationResult, reason } = await searchParams;
  const [mercadoLibre, tiendanube, tiendaNegocio] = await Promise.all([
    readMercadoLibre(),
    readTiendanube(),
    readTiendaNegocio(),
  ]);
  return <>
    <PageHeader description="Administra las conexiones con tus canales de venta." />
    {authorizationResult === "connected" ? (
      <p role="status">Tienda Negocio se autorizó correctamente.</p>
    ) : null}
    {authorizationResult === "error" ? (
      <p role="alert">{getAuthorizationError(reason)}</p>
    ) : null}
    <div className={styles.grid}>
      <IntegrationCard name="Mercado Libre" description="Conectá tu cuenta para gestionar tus publicaciones." icon="ML" status={mercadoLibre.status} detail={mercadoLibre.sellerId ? `Seller ID: ${mercadoLibre.sellerId}` : null} connectHref="/api/integrations/mercado-libre/connect" disconnectAction={disconnectMercadoLibre} />
      <IntegrationCard name="Tiendanube" description="Conectá tu tienda para replicar productos." icon="TN" status={tiendanube.status} detail={tiendanube.storeId ? `Store ID: ${tiendanube.storeId}` : null} connectHref="/api/integrations/tiendanube/connect" disconnectAction={disconnectTiendanube} />
      <IntegrationCard
        name="Tienda Negocio"
        description="Autorizá tu tienda para sincronizar publicaciones de Mercado Libre."
        icon="NG"
        status={tiendaNegocio.status}
        detail={tiendaNegocio.storeId ? `Store ID: ${tiendaNegocio.storeId}` : tiendaNegocio.detail}
        connectHref="/api/integrations/tienda-negocio/connect"
        connectDisabled={tiendaNegocio.authorizationConfigured === false}
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
  authorizationConfigured: boolean | null;
  detail: string | null;
}> {
  try {
    const result = await createTiendaNegocioApiRepository().getConnection();
    return {
      status: result.connected ? "connected" : "not-connected",
      storeId: result.connected ? result.storeId : null,
      authorizationConfigured: result.authorizationConfigured,
      detail: null,
    };
  } catch (error: unknown) {
    logTiendaNegocioStatusError(error);
    return {
      status: "unknown",
      storeId: null,
      authorizationConfigured: null,
      detail: "No se pudo consultar Tienda Negocio. Revisá la comunicación con el backend e intentá nuevamente.",
    };
  }
}

function logTiendaNegocioStatusError(error: unknown): void {
  const details = error instanceof ApiError
    ? { code: error.code, status: error.status }
    : { name: error instanceof Error ? error.name : "UnknownError" };
  console.error("[integrations] Unable to read Tienda Negocio connection status", details);
}

function getAuthorizationError(reason?: string): string {
  switch (reason) {
    case "start":
      return "No pudimos iniciar la autorización. Comprobá la sesión del panel y el backend.";
    case "session":
      return "La sesión de instalación de Tienda Negocio no se encontró o venció. Volvé a conectar desde este panel.";
    case "missing_code":
      return "Tienda Negocio regresó sin el código de autorización. Revisá la URL de redirección configurada en la aplicación.";
    case "rejected":
      return "La autorización fue rechazada o cancelada en Tienda Negocio.";
    case "exchange":
      return "Recibimos la autorización, pero el backend no pudo obtener o guardar el token. Revisá el backend y sus registros.";
    default:
      return "No se pudo completar la autorización de Tienda Negocio. Revisá la configuración OAuth.";
  }
}
