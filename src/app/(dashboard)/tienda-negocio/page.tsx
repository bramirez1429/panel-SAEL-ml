import { z } from "zod";

import { ApiError } from "@/shared/api/api-error";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const previewSchema = z.object({
  sourceKey: z.string(),
  readyForImport: z.boolean(),
  imageUrls: z.array(z.string()),
  warnings: z.array(z.string()),
  product: z.object({
    name: z.object({ es: z.string() }),
    published: z.boolean(),
    properties: z.array(z.object({ title: z.string() })).optional(),
    variants: z.array(z.object({
      sku: z.string().optional(),
      price: z.string(),
      stock: z.number(),
      properties: z.array(z.object({ title: z.string() })),
    })).optional(),
    price: z.string().optional(),
    stock: z.number().optional(),
    sku: z.string().optional(),
  }),
});

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function TiendaNegocioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.sourceKey) ? params.sourceKey[0] : params.sourceKey;
  const query = (raw ?? "").trim();
  const sourceKey = /^MLA\d+$/i.test(query) ? `item:${query.toUpperCase()}` : query;
  let preview: z.infer<typeof previewSchema> | null = null;
  let errorMessage = "";

  if (sourceKey) {
    if (!/^(item:MLA\d+|family:[1-9]\d*)$/.test(sourceKey)) {
      errorMessage = "Ingresá un MLA válido o una familia, por ejemplo MLA123456789 o family:123.";
    } else {
      try {
        const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
        const search = new URLSearchParams({ sourceKey });
        const response = await client.get(`/tiendanegocio/replication/preview-by-source?${search}`);
        const parsed = previewSchema.safeParse(response);
        if (!parsed.success) throw new Error("Respuesta inválida");
        preview = parsed.data;
      } catch (error: unknown) {
        errorMessage = error instanceof ApiError
          ? error.message : "No se pudo cargar la vista previa desde el backend.";
      }
    }
  }

  return (
    <main className={styles.page}>
      <h1>Tienda Negocio · Sincronización SAEL</h1>
      <PageHeader description="Primera etapa: revisá cómo se importaría un producto de Mercado Libre. Esta pantalla todavía no escribe ni publica nada." />
      <form action="/tienda-negocio" method="get" className={styles.form}>
        <label htmlFor="sourceKey">Código de publicación o familia de Mercado Libre</label>
        <div className={styles.fields}>
          <input id="sourceKey" name="sourceKey" defaultValue={query} maxLength={50} placeholder="MLA123456789 o family:123" required />
          <button type="submit">Ver vista previa</button>
        </div>
      </form>
      {errorMessage ? <p role="alert" className={styles.error}>{errorMessage}</p> : null}
      {preview ? (
        <section className={styles.panel}>
          <h2>{preview.product.name.es}</h2>
          <p><strong>Estado:</strong> {preview.readyForImport ? "Lista para revisión" : "Requiere corregir SKU"}. Siempre se creará oculta.</p>
          <h3>Variantes</h3>
          <table className={styles.table}>
            <thead><tr><th>SKU</th><th>Opciones</th><th>Precio de ML</th><th>Stock leído</th></tr></thead>
            <tbody>{preview.product.variants?.length
              ? preview.product.variants.map((item, index) => (
                <tr key={item.sku ?? index}>
                  <td>{item.sku ?? "SIN SKU"}</td>
                  <td>{item.properties.map((property) => property.title).join(" / ")}</td>
                  <td>${item.price}</td>
                  <td>{item.stock}</td>
                </tr>
              ))
              : <tr><td>{preview.product.sku ?? "SIN SKU"}</td><td>Producto simple</td><td>${preview.product.price}</td><td>{preview.product.stock}</td></tr>}
            </tbody>
          </table>
          <h3>Fotografías detectadas: {preview.imageUrls.length}</h3>
          <p>No se cargan todavía: falta implementar la subida y asociación por variante.</p>
          <h3>Revisiones pendientes</h3>
          <ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          <details><summary>Ver payload de Tienda Negocio</summary><pre>{JSON.stringify(preview.product, null, 2)}</pre></details>
        </section>
      ) : null}
    </main>
  );
}
