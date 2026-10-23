import Link from "next/link";

export function TiendaNegocioSetup({ connected }: Readonly<{ connected: boolean }>) {
  return (
    <section style={{ border: "1px solid #d9d9d9", borderRadius: 12, padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>{connected ? "Tienda Negocio conectada" : "Conectar Tienda Negocio"}</h2>
      <p>
        Ya está preparada la integración por API. Para instalarla en tu tienda,
        primero es necesario registrar nuestra aplicación externa en el portal
        de desarrolladores de Tienda Negocio y autorizar permisos de productos.
      </p>
      {!connected ? <p><Link href="/api/integrations/tienda-negocio/connect">Autorizar Tienda Negocio</Link></p> : null}
      <p>
        Hasta completar OAuth 2.0 y la vinculación segura de la tienda,
        la publicación masiva permanecerá deshabilitada.
        Podés explorar el catálogo origen de Mercado Libre sin cambiar productos.
      </p>
      <p>
        <Link href="https://referidos.tiendanegocio.com" target="_blank" rel="noopener noreferrer">
          Portal de aplicaciones de Tienda Negocio
        </Link>
        {" · "}
        <Link href="https://docs.developers.tiendanegocio.com/docs/authentication" target="_blank" rel="noopener noreferrer">
          Documentación OAuth oficial
        </Link>
      </p>
    </section>
  );
}
