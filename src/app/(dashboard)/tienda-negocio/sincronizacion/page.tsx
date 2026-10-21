import { TiendaNegocioCatalog } from "@/modules/tienda-negocio/presentation/tienda-negocio-catalog";
import { TiendaNegocioSetup } from "@/modules/tienda-negocio/presentation/tienda-negocio-setup";
import {
  getTiendaNegocioCatalog,
  getTiendaNegocioStatus,
} from "@/modules/tienda-negocio/infrastructure/tienda-negocio.repository.server";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<{ cursor?: string | string[]; conexion?: string }>;
}>;

export default async function TiendaNegocioPage({ searchParams }: Props) {
  const { cursor: rawCursor, conexion } = await searchParams;
  const cursor = typeof rawCursor === "string" && rawCursor.length <= 2048
    ? rawCursor
    : undefined;

  const [status, catalog] = await Promise.allSettled([
    getTiendaNegocioStatus(),
    getTiendaNegocioCatalog(cursor),
  ]);

  return (
    <main style={{ maxWidth: 1200, marginInline: "auto", padding: "16px 24px 48px" }}>
      <h1>Sincronización Tienda Negocio</h1>
      <p style={{ color: "#777" }}>
        Migración independiente de Tiendanube · Mercado Libre → Tienda Negocio
      </p>
      {conexion === "error" ? (
        <p role="alert">No se completó la autorización. Revisá la configuración OAuth de la aplicación.</p>
      ) : null}
      {conexion === "connected" ? (
        <p role="status">Conexión autorizada correctamente.</p>
      ) : null}
      <TiendaNegocioSetup
        connected={status.status === "fulfilled" && status.value.connected}
      />
      <p aria-live="polite">
        {status.status === "fulfilled"
          ? status.value.connected
            ? "Tienda Negocio conectada."
            : "Pendiente de vincular Tienda Negocio."
          : "No se pudo consultar la conexión de Tienda Negocio."}
      </p>
      {catalog.status === "fulfilled" ? (
        <TiendaNegocioCatalog page={catalog.value} />
      ) : (
        <p role="alert">
          No se pudo obtener el catálogo de Mercado Libre. Revisá que tu cuenta siga conectada.
        </p>
      )}
    </main>
  );
}
