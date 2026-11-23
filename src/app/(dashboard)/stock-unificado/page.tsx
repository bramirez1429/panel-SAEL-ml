import type { CSSProperties } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createGetPublicationByIdQuery,
  createGetPublicationVariantsQuery,
  createGetPublicationsQuery,
} from "@/modules/publications/publications.composition.server";
import type {
  Publication,
  PublicationAttribute,
  PublicationVariant,
} from "@/modules/publications/domain/publication.model";
import { createGetTiendanubeProductsQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

export const dynamic = "force-dynamic";

const ML_PAGE_SIZE = 8;
const TN_PAGE_SIZE = 15;
const linkSchema = z.array(z.object({
  id: z.string().uuid(),
  mlItemId: z.string(),
  mlVariationId: z.string().nullable(),
  tnProductId: z.string(),
  tnVariantId: z.string(),
  sku: z.string().nullable(),
  matchSource: z.enum(["MANUAL", "SKU", "ATTRIBUTES"]),
}));

type SavedLink = z.infer<typeof linkSchema>[number];
type Params = Record<string, string | string[] | undefined>;
type MlVariant = {
  key: string;
  itemId: string;
  variationId: string | null;
  title: string;
  description: string;
  sku: string | null;
  stock: number | null;
};
type TnVariant = {
  key: string;
  productId: string;
  variantId: string;
  name: string;
  description: string;
  sku: string | null;
  stock: number | null;
  status: string;
};
type MlPage = { variants: MlVariant[]; nextCursor: string | null; done: boolean; failed: number };
type TnPage = { variants: TnVariant[]; hasMore: boolean; page: number };

const surface: CSSProperties = {
  padding: "clamp(18px, 2.5vw, 28px)",
  background: "#fff",
  border: "1px solid #e2e8f2",
  borderRadius: 18,
  boxShadow: "0 8px 24px rgb(24 48 98 / 5%)",
};
const inputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 40,
  padding: "9px 12px",
  border: "1px solid #cad5e6",
  borderRadius: 10,
  background: "white",
  color: "#213350",
  font: "inherit",
  fontSize: 13,
};
const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "10px 16px",
  color: "white",
  background: "#315dd5",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 700,
  fontSize: 13,
};
const softText: CSSProperties = { color: "#6a7892", fontSize: 13, lineHeight: 1.5 };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
function queryText(value: string): string {
  return value.trim().slice(0, 100);
}
function cleanSku(value: string | null): string {
  return value?.trim().normalize("NFKC").toLocaleUpperCase("es") ?? "";
}
function attr(attributes: readonly PublicationAttribute[], ids: readonly string[]): string | null {
  return attributes.find((item) => ids.includes(item.id.toLocaleUpperCase("es")))?.value ?? null;
}
function toMlVariant(publication: Publication, variant: PublicationVariant | null): MlVariant {
  const family = publication.group.type === "USER_PRODUCT";
  const itemId = family ? (variant?.itemId ?? publication.id) : publication.id;
  const variationId = family ? null : (variant?.id ?? null);
  const attributes = variant?.attributes ?? publication.attributes;
  const color = attr(attributes, ["COLOR", "MAIN_COLOR"]);
  const size = attr(attributes, ["SIZE", "TALLE", "CLOTHING_SIZE"]);
  const description = [color, size].filter(Boolean).join(" · ") || (variationId ? "Variación " + variationId : "Sin variantes");
  return {
    key: itemId + ":" + (variationId ?? "item"),
    itemId,
    variationId,
    title: variant?.title ?? publication.title,
    description,
    sku: (variant?.sku ?? attr(attributes, ["SELLER_SKU", "SKU"]))?.trim() || null,
    stock: variant?.stock ?? publication.stock,
  };
}

async function loadMercadoLibre(search: string, cursor: string | null): Promise<MlPage> {
  const page = await createGetPublicationsQuery().execute({
    page: 1,
    pageSize: ML_PAGE_SIZE,
    cursor,
    search,
    type: null,
    status: null,
    quickFilters: [],
  });
  const variants: MlVariant[] = [];
  let failed = 0;
  // Lotes acotados: evita disparar decenas de requests a ML al mismo tiempo.
  for (let index = 0; index < page.publications.length; index += 3) {
    const batch = page.publications.slice(index, index + 3);
    const results = await Promise.allSettled(batch.map(async (publication) => {
      if (publication.group.type === "USER_PRODUCT" && publication.group.familyId) {
        const found = await createGetPublicationVariantsQuery().execute({
          publicationId: publication.id,
          publicationType: "USER_PRODUCT",
          familyId: publication.group.familyId,
        });
        return found.map((variant) => toMlVariant(publication, variant));
      }
      const detail = await createGetPublicationByIdQuery().execute(publication.id);
      return detail.variants.length
        ? detail.variants.map((variant) => toMlVariant(detail, variant))
        : [toMlVariant(detail, null)];
    }));
    results.forEach((result) => {
      if (result.status === "fulfilled") variants.push(...result.value);
      else failed += 1;
    });
  }
  const seen = new Set<string>();
  return {
    variants: variants.filter((variant) => {
      if (seen.has(variant.key)) return false;
      seen.add(variant.key);
      return true;
    }),
    nextCursor: page.nextCursor,
    done: page.done,
    failed,
  };
}

async function loadTiendanube(search: string, page: number): Promise<TnPage> {
  const response = await createGetTiendanubeProductsQuery().execute({
    q: search,
    page,
    pageSize: TN_PAGE_SIZE,
  });
  return {
    page: response.page,
    hasMore: response.hasMore,
    variants: response.products.flatMap((product) => product.variants.map((variant) => ({
      key: product.id + ":" + variant.id,
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      description: [variant.color, variant.size].filter(Boolean).join(" · ") || "Variante única",
      sku: variant.sku?.trim() || null,
      stock: variant.stock,
      status: variant.visible === false ? "Variante oculta" : product.status,
    }))),
  };
}

async function loadSavedLinks(): Promise<SavedLink[]> {
  const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  return linkSchema.parse(await client.get("/sales/variant-links"));
}

async function saveLink(formData: FormData): Promise<void> {
  "use server";

  const itemId = String(formData.get("mlItemId") ?? "");
  const variation = String(formData.get("mlVariationId") ?? "");
  const tn = String(formData.get("tnVariant") ?? "");
  if (!/^MLA\d+$/.test(itemId) ||
      (variation !== "" && !/^\d+$/.test(variation)) ||
      !/^[1-9]\d*:[1-9]\d*$/.test(tn)) {
    redirect("/stock-unificado?resultado=invalid");
  }
  const [tnProductId, tnVariantId] = tn.split(":");
  let outcome = "ok";
  try {
    const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    await client.post("/sales/variant-links", {
      mlItemId: itemId,
      ...(variation ? { mlVariationId: variation } : {}),
      tnProductId,
      tnVariantId,
    });
  } catch {
    outcome = "error";
  }
  revalidatePath("/stock-unificado");
  redirect("/stock-unificado?resultado=" + outcome);
}

function smallLabel(text: string) {
  return <span style={{ fontSize: 11, fontWeight: 800, color: "#697a9c", letterSpacing: ".07em" }}>{text}</span>;
}
function stockValue(stock: number | null) {
  return stock === null ? "Sin dato" : String(stock);
}
function messageFor(result: string): string | null {
  if (result === "ok") return "Vinculación guardada. Los stocks no fueron modificados.";
  if (result === "invalid") return "Revisá la publicación y la variante seleccionada.";
  if (result === "error") return "No se pudo vincular. Verificá que ambas variantes existan y no estén vinculadas a otros productos.";
  return null;
}

export default async function StockUnificadoPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Params> }>) {
  const params = await searchParams;
  const mlSearch = queryText(first(params.ml));
  const tnSearch = queryText(first(params.tn));
  const cursor = first(params.cursor).slice(0, 500) || null;
  const tnPageNumber = Math.min(1000, Math.max(1, Number.parseInt(first(params.tnPage), 10) || 1));
  const notice = messageFor(first(params.resultado));

  const [mlResult, tnResult, linksResult] = await Promise.allSettled([
    loadMercadoLibre(mlSearch, cursor),
    loadTiendanube(tnSearch, tnPageNumber),
    loadSavedLinks(),
  ]);
  const ml = mlResult.status === "fulfilled" ? mlResult.value : null;
  const tn = tnResult.status === "fulfilled" ? tnResult.value : null;
  const links = linksResult.status === "fulfilled" ? linksResult.value : null;
  const tnVariants = tn?.variants ?? [];
  const linkByMl = new Map((links ?? []).map((link) => [
    link.mlItemId + ":" + (link.mlVariationId ?? "item"), link,
  ]));
  const linkByTn = new Map((links ?? []).map((link) => [
    link.tnProductId + ":" + link.tnVariantId, link,
  ]));
  const tnByKey = new Map(tnVariants.map((variant) => [variant.key, variant]));
  const rows = ml?.variants ?? [];
  const linkedCount = rows.filter((item) => linkByMl.has(item.key)).length;
  const unequalCount = rows.filter((item) => {
    const link = linkByMl.get(item.key);
    const match = link ? tnByKey.get(link.tnProductId + ":" + link.tnVariantId) : null;
    return match && item.stock !== null && match.stock !== null && item.stock !== match.stock;
  }).length;

  function pageHref(next: { cursor?: string; tnPage?: number }) {
    const query = new URLSearchParams();
    if (mlSearch) query.set("ml", mlSearch);
    if (tnSearch) query.set("tn", tnSearch);
    if (next.cursor) query.set("cursor", next.cursor);
    if (next.tnPage && next.tnPage > 1) query.set("tnPage", String(next.tnPage));
    return "/stock-unificado?" + query.toString();
  }

  return (
    <main style={{ display: "grid", gap: 18, minWidth: 0, maxWidth: 1400, margin: "0 auto" }} data-dashboard-full-width="true">
      <header style={{ display: "grid", gap: 8 }}>
        <Link href="/dashboard" style={{ ...softText, textDecoration: "none" }}>← Volver al dashboard</Link>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            {smallLabel("INVENTARIO · PRIMERA ETAPA")}
            <h1 style={{ margin: "6px 0", fontSize: "clamp(22px, 2.5vw, 30px)", color: "#1d2e53" }}>Control de stock ML + Tiendanube</h1>
            <p style={{ ...softText, margin: 0 }}>Detectá SKU iguales, vinculá SKU diferentes y compará el stock de cada variante.</p>
          </div>
          <span style={{ color: "#315b89", background: "#eef5ff", padding: "8px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
            Sólo lectura de stock
          </span>
        </div>
      </header>

      <section style={surface}>
        <form method="get" action="/stock-unificado" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", alignItems: "end", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
            Buscar en Mercado Libre
            <input style={inputStyle} name="ml" defaultValue={mlSearch} maxLength={100} placeholder="Título, MLA o familia" />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
            Buscar en Tiendanube
            <input style={inputStyle} name="tn" defaultValue={tnSearch} maxLength={100} placeholder="Nombre de producto" />
          </label>
          <button type="submit" style={primaryButton}>Buscar variantes</button>
          <Link href="/stock-unificado" style={{ ...softText, textAlign: "center", padding: 10 }}>Limpiar filtros</Link>
        </form>
        <p style={{ ...softText, marginBottom: 0 }}>Mostramos lotes para evitar sobrecargar las APIs. Los conteos corresponden a los productos cargados en pantalla, no a todo el catálogo.</p>
      </section>

      {notice ? <p role="status" style={{ ...surface, margin: 0, color: "#315b89", background: "#f1f6ff" }}>{notice}</p> : null}
      {links === null ? (
        <p role="alert" style={{ ...surface, margin: 0, color: "#b04d31", background: "#fff5ef" }}>
          No se pudieron consultar los vínculos guardados. La vinculación está deshabilitada para evitar duplicaciones. Verificá que el backend de esta rama esté disponible.
        </p>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          ["Variantes ML cargadas", rows.length],
          ["Variantes TN cargadas", tnVariants.length],
          ["ML vinculadas visibles", linkedCount],
          ["Diferencias detectadas", unequalCount],
        ].map(([label, count]) => (
          <div key={label} style={surface}>
            {smallLabel(String(label).toUpperCase())}
            <p style={{ fontWeight: 800, fontSize: 26, color: "#263b64", margin: "8px 0 0" }}>{count}</p>
          </div>
        ))}
      </section>

      <section style={{ ...surface, display: "grid", gap: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 5px", color: "#23375e", fontSize: 19 }}>Variantes de Mercado Libre</h2>
          <p style={{ ...softText, margin: 0 }}>Seleccioná la variante equivalente de Tiendanube. Los SKU que coinciden se proponen, pero nunca se vinculan sin tu confirmación.</p>
        </div>

        {ml === null ? <p role="alert">No se pudieron cargar las publicaciones de Mercado Libre.</p> : null}
        {ml && ml.failed > 0 ? <p role="alert" style={{ color: "#a45b25" }}>{ml.failed} publicación(es) no pudieron cargar sus variantes. No se muestran como sin vincular.</p> : null}
        {ml && rows.length === 0 ? <p style={softText}>No se encontraron variantes en este lote.</p> : null}

        {rows.map((item) => {
          const link = linkByMl.get(item.key);
          const matchingTn = link ? tnByKey.get(link.tnProductId + ":" + link.tnVariantId) : null;
          const choices = tnVariants.filter((candidate) => !linkByTn.has(candidate.key));
          const suggestions = choices.filter((candidate) =>
            cleanSku(item.sku) !== "" && cleanSku(item.sku) === cleanSku(candidate.sku));
          const suggested = suggestions.length === 1 ? (suggestions[0]?.key ?? "") : "";
          const difference = matchingTn && item.stock !== null && matchingTn.stock !== null
            ? item.stock - matchingTn.stock : null;
          return (
            <article key={item.key} style={{ padding: 16, border: "1px solid #e4e9f3", borderRadius: 13, background: link ? "#f8fbff" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "grid", gap: 4, minWidth: 180, flex: 1 }}>
                  <strong style={{ color: "#263b64", fontSize: 14 }}>{item.title}</strong>
                  <span style={softText}>{item.description}</span>
                  <span style={{ ...softText, overflowWrap: "anywhere" }}>ML: {item.itemId}{item.variationId ? " · Variación " + item.variationId : ""}</span>
                  <span style={softText}>SKU: <strong>{item.sku ?? "Sin SKU"}</strong></span>
                </div>
                <div style={{ display: "grid", gap: 6, textAlign: "right", alignContent: "start" }}>
                  {smallLabel("STOCK ML")}
                  <strong style={{ fontSize: 25, color: "#304771" }}>{stockValue(item.stock)}</strong>
                  <span style={{ color: link ? "#287d59" : "#8b651f", fontSize: 12, fontWeight: 700 }}>{link ? "Vinculada" : "Sin vincular"}</span>
                </div>
              </div>

              {link ? (
                <div style={{ ...softText, borderTop: "1px solid #e2e8f2", marginTop: 12, paddingTop: 12 }}>
                  Tiendanube: producto <strong>{link.tnProductId}</strong> · variante <strong>{link.tnVariantId}</strong>
                  {" · "}Stock TN: <strong>{stockValue(matchingTn?.stock ?? null)}</strong>
                  {difference !== null ? (
                    <strong style={{ color: difference === 0 ? "#287d59" : "#b34d35" }}>
                      {" · "}{difference === 0 ? "Coinciden" : "Diferencia ML − TN: " + difference}
                    </strong>
                  ) : <span>{" · "}Stock TN fuera del lote actual o sin dato</span>}
                </div>
              ) : links !== null ? (
                <form action={saveLink} style={{ borderTop: "1px solid #e2e8f2", paddingTop: 12, marginTop: 12, display: "grid", gap: 8 }}>
                  <input type="hidden" name="mlItemId" value={item.itemId} />
                  <input type="hidden" name="mlVariationId" value={item.variationId ?? ""} />
                  {suggested ? <span style={{ color: "#2b7557", fontSize: 12, fontWeight: 700 }}>Sugerencia: SKU coincidente. Confirmá antes de guardar.</span>
                    : <span style={softText}>Si el SKU es diferente, elegí manualmente el producto y talle correcto.</span>}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 10 }}>
                    <label style={{ display: "grid", flex: "1 1 280px", gap: 6, fontSize: 12, fontWeight: 700 }}>
                      Variante de Tiendanube
                      <select name="tnVariant" key={item.key + ":" + tnSearch + ":" + tnPageNumber} defaultValue={suggested} required style={inputStyle}>
                        <option value="">Seleccioná producto, color y talle</option>
                        {choices.map((candidate) => (
                          <option value={candidate.key} key={candidate.key}>
                            {candidate.name + " · " + candidate.description + " · SKU " + (candidate.sku ?? "—") + " · Stock " + stockValue(candidate.stock)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={choices.length === 0} style={{ ...primaryButton, opacity: choices.length === 0 ? .5 : 1 }}>
                      Vincular variantes
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          );
        })}

        <nav aria-label="Páginas de Mercado Libre" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <Link href={pageHref({ tnPage: tnPageNumber })} style={softText}>Reiniciar publicaciones</Link>
          {ml?.nextCursor ? <Link href={pageHref({ cursor: ml.nextCursor, tnPage: tnPageNumber })} style={{ fontWeight: 700, fontSize: 13 }}>Siguiente lote ML →</Link> : <span style={softText}>Fin del lote ML</span>}
        </nav>
      </section>

      <section style={{ ...surface, display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#23375e", fontSize: 19 }}>Variantes de Tiendanube</h2>
        <p style={{ ...softText, margin: 0 }}>Identificá las variantes que todavía no tienen una vinculación guardada con Mercado Libre.</p>
        {tn === null ? <p role="alert">No se pudieron cargar los productos de Tiendanube.</p> : null}
        {tn && tnVariants.length === 0 ? <p style={softText}>No hay variantes en esta página.</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {tnVariants.map((item) => {
            const linked = linkByTn.get(item.key);
            return (
              <div key={item.key} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", padding: "11px 12px", border: "1px solid #e5eaf3", borderRadius: 11 }}>
                <div style={{ minWidth: 160, display: "grid", gap: 3 }}>
                  <strong style={{ fontSize: 13, color: "#263b64" }}>{item.name}</strong>
                  <span style={softText}>{item.description} · SKU {item.sku ?? "Sin SKU"}</span>
                  <span style={softText}>TN: {item.productId} · Variante: {item.variantId} · {item.status}</span>
                </div>
                <div style={{ textAlign: "right", display: "grid", gap: 3 }}>
                  <strong style={{ color: "#263b64" }}>Stock: {stockValue(item.stock)}</strong>
                  <span style={{ fontSize: 12, color: linked ? "#287d59" : "#8b651f" }}>
                    {linked ? "Vinculada a " + linked.mlItemId : "Sin vincular"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <nav aria-label="Páginas de Tiendanube" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          {tnPageNumber > 1 ? <Link style={softText} href={pageHref({ cursor: cursor ?? undefined, tnPage: tnPageNumber - 1 })}>← Anterior TN</Link> : <span />}
          <span style={softText}>Página {tnPageNumber}</span>
          {tn?.hasMore ? <Link style={{ fontSize: 13, fontWeight: 700 }} href={pageHref({ cursor: cursor ?? undefined, tnPage: tnPageNumber + 1 })}>Siguiente TN →</Link> : <span />}
        </nav>
      </section>

      <p style={{ ...softText, margin: "0 0 16px", textAlign: "center" }}>
        Esta primera versión sólo guarda vínculos entre variantes y compara los stocks informados por cada plataforma. No modifica existencias ni activa sincronización automática.
      </p>
    </main>
  );
}
