import Link from "next/link";
import type { TiendaNegocioCatalogPage } from "../domain/tienda-negocio.model";

export function TiendaNegocioCatalog({ page }: Readonly<{ page: TiendaNegocioCatalogPage }>) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2>Catálogo de origen: Mercado Libre</h2>
      <p>
        Estos productos se encontraron en Mercado Libre.
        Todavía no se enviaron a Tienda Negocio.
        Las familias USER_PRODUCT se agrupan para evitar productos duplicados.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              {["Producto", "Modelo", "Publicaciones MLA", "Variantes MLAU"].map((label) => (
                <th key={label} scope="col" style={{ padding: 12, borderBottom: "1px solid #ddd" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.products.map((product) => (
              <tr key={product.sourceKey}>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <Link href={`/tienda-negocio/sincronizacion/producto?sourceKey=${encodeURIComponent(product.sourceKey)}`}>{product.title || product.sourceKey}</Link>
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {product.familyId ? "Familia" : "Clásico"}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {product.mlaIds.join(", ")}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  {product.mlauIds.join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page.products.length === 0 ? <p>No hay productos en esta página.</p> : null}
      {page.nextCursor ? (
        <p style={{ marginTop: 16 }}>
          <Link href={`/tienda-negocio/sincronizacion?cursor=${encodeURIComponent(page.nextCursor)}`}>
            Explorar siguiente página →
          </Link>
        </p>
      ) : <p>Exploración finalizada.</p>}
    </section>
  );
}
