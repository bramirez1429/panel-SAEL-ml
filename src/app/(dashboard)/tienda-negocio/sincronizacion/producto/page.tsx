import Link from "next/link";
import { previewTiendaNegocioProduct } from "@/modules/tienda-negocio/infrastructure/tienda-negocio.repository.server";

export const dynamic = "force-dynamic";

type Props = Readonly<{ searchParams: Promise<{ sourceKey?: string }> }>;

export default async function TiendaNegocioProductPreviewPage({ searchParams }: Props) {
  const { sourceKey } = await searchParams;
  if (!sourceKey || !/^(?:item:MLA\d+|family:[1-9]\d*)$/.test(sourceKey)) {
    return <main><p role="alert">Producto de Mercado Libre inválido.</p></main>;
  }
  const preview = await previewTiendaNegocioProduct(sourceKey).catch(() => null);

  return <main style={{ maxWidth: 920, marginInline: "auto", padding: "24px" }}>
    <p><Link href="/tienda-negocio/sincronizacion">← Volver al catálogo</Link></p>
    <h1>Vista previa · Tienda Negocio</h1>
    {!preview ? <p role="alert">No se pudo normalizar esta publicación de Mercado Libre.</p> : (
      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 24 }}>
        <h2>{preview.name}</h2>
        <dl>
          <dt>Variantes</dt><dd>{preview.variantCount}</dd>
          <dt>Imágenes originales</dt><dd>{preview.imageCount}</dd>
          <dt>Stock total</dt><dd>{preview.totalStock}</dd>
          <dt>Precios de origen</dt><dd>{preview.prices.join(" · ")}</dd>
          <dt>Atributos</dt><dd>{preview.attributes.join(", ") || "Sin variantes"}</dd>
          <dt>Estado previsto</dt><dd>Borrador (sin publicar)</dd>
        </dl>
        <p>{preview.note}</p>
      </section>
    )}
  </main>;
}
