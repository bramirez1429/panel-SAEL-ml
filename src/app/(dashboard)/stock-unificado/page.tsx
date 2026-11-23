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
  return value?.trim() ?? "";
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
  if (result === "ok") return "SKU iguales: vinculación guardada. No modificamos el stock.";
  if (result === "invalid") return "Revisá las variantes y sus SKU antes de vincular.";
  if (result === "error") return "No se pudo vincular. Ambos SKU deben ser idénticos, no estar vacíos ni tener vinculaciones incompatibles.";
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
  const uniqueTnBySku = (sku: string | null): TnVariant | null => {
    const normalized = cleanSku(sku);
    if (!normalized || rows.filter((row) => cleanSku(row.sku) === normalized).length !== 1) return null;
    const candidates = tnVariants.filter((candidate) => cleanSku(candidate.sku) === normalized);
    return candidates.length === 1 ? (candidates[0] ?? null) : null;
  };
  const matchedCount = rows.filter((item) => uniqueTnBySku(item.sku) !== null).length;
  const unequalCount = rows.filter((item) => {
    const match = uniqueTnBySku(item.sku);
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
            <p style={{ ...softText, margin: 0 }}>Vinculá sólo variantes con SKU idénticos y compará el stock de ambos canales.</p>
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
          No se pudieron consultar los vínculos guardados. Podés revisar coincidencias de SKU, pero no guardar nuevas vinculaciones hasta recuperar la conexión.
        </p>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          ["Variantes ML cargadas", rows.length],
          ["Variantes TN cargadas", tnVariants.length],
          ["SKU coincidentes", matchedCount],
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
          <p style={{ ...softText, margin: 0 }}>El sistema identifica SKU idénticos. Si hay una coincidencia única, podés guardarla con un clic. No se permite elegir SKU diferentes.</p>
        </div>

        {ml === null ? <p role="alert">No se pudieron cargar las publicaciones de Mercado Libre.</p> : null}
        {ml && ml.failed > 0 ? <p role="alert" style={{ color: "#a45b25" }}>{ml.failed} publicación(es) no pudieron cargar sus variantes. No se muestran como sin vincular.</p> : null}
        {ml && rows.length === 0 ? <p style={softText}>No se encontraron variantes en este lote.</p> : null}

        {rows.map((item) => {
          const savedLink = linkByMl.get(item.key);
          const savedTn = savedLink ? tnByKey.get(savedLink.tnProductId + ":" + savedLink.tnVariantId) : null;
          const matchedTn = uniqueTnBySku(item.sku);
          const hasValidSavedLink = Boolean(savedLink && savedTn &&
            matchedTn?.key === savedTn.key && cleanSku(item.sku) === cleanSku(savedTn.sku));
          const hasIncompatibleLink = Boolean(savedLink && savedTn && cleanSku(item.sku) !== cleanSku(savedTn.sku));
          const canLink = Boolean(matchedTn && !savedLink && !linkByTn.has(matchedTn.key) && links !== null);
          const sku = cleanSku(item.sku);
          const isDuplicate = sku !== "" && (rows.filter((row) => cleanSku(row.sku) === sku).length > 1 ||
            tnVariants.filter((variant) => cleanSku(variant.sku) === sku).length > 1);
          const difference = matchedTn && item.stock !== null && matchedTn.stock !== null
            ? item.stock - matchedTn.stock : null;
          const status = hasValidSavedLink ? "Vinculada por SKU" :
            hasIncompatibleLink ? "Vínculo incompatible" :
            savedLink ? "Vínculo sin verificar" :
            isDuplicate ? "SKU duplicado" :
            matchedTn ? "SKU coincidente" : "Sin coincidencia";
          return (
            <article key={item.key} style={{ padding: 16, border: "1px solid #e4e9f3", borderRadius: 13, background: hasValidSavedLink ? "#f8fbff" : "#fff" }}>
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
                  <span style={{ color: hasValidSavedLink || matchedTn ? "#287d59" : "#8b651f", fontSize: 12, fontWeight: 700 }}>{status}</span>
                </div>
              </div>

              {matchedTn && !hasIncompatibleLink ? (
                <div style={{ ...softText, borderTop: "1px solid #e2e8f2", marginTop: 12, paddingTop: 12 }}>
                  Tiendanube: <strong>{matchedTn.name}</strong> · {matchedTn.description}
                  {" · "}SKU <strong>{matchedTn.sku}</strong>
                  {" · "}Stock TN: <strong>{stockValue(matchedTn.stock)}</strong>
                  {difference !== null ? (
                    <strong style={{ color: difference === 0 ? "#287d59" : "#b34d35" }}>
                      {" · "}{difference === 0 ? "Stocks coinciden" : "Diferencia ML − TN: " + difference}
                    </strong>
                  ) : <span>{" · "}Stock no disponible para comparar</span>}
                </div>
              ) : null}

              {canLink && matchedTn ? (
                <form action={saveLink} style={{ borderTop: "1px solid #e2e8f2", paddingTop: 12, marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                  <input type="hidden" name="mlItemId" value={item.itemId} />
                  <input type="hidden" name="mlVariationId" value={item.variationId ?? ""} />
                  <input type="hidden" name="tnVariant" value={matchedTn.key} />
                  <span style={{ ...softText, flex: 1 }}>SKU idéntico en ambos canales. Confirmá para guardar la relación.</span>
                  <button type="submit" style={primaryButton}>Vincular por SKU</button>
                </form>
              ) : !hasValidSavedLink ? (
                <p style={{ ...softText, borderTop: "1px solid #e2e8f2", margin: "12px 0 0", paddingTop: 12 }}>
                  {hasIncompatibleLink
                    ? "Existe una vinculación anterior con otro SKU. No se considera válida; requiere revisión."
                    : savedLink
                      ? "Existe un vínculo guardado, pero su SKU no se puede verificar en los lotes cargados."
                      : isDuplicate
                        ? "SKU duplicado: corregí las referencias para identificar una sola variante por canal."
                        : !sku
                          ? "Asigná un SKU a esta variante y el mismo SKU en Tiendanube."
                          : matchedTn
                            ? "Esta variante de Tiendanube ya está vinculada a otra publicación."
                            : "No hay SKU idéntico en las páginas cargadas. Revisá los SKU o buscá otro lote."}
                </p>
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
        <p style={{ ...softText, margin: 0 }}>Revisá qué variantes tienen el mismo SKU que Mercado Libre y cuáles todavía no coinciden.</p>
        {tn === null ? <p role="alert">No se pudieron cargar los productos de Tiendanube.</p> : null}
        {tn && tnVariants.length === 0 ? <p style={softText}>No hay variantes en esta página.</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {tnVariants.map((item) => {
            const linked = linkByTn.get(item.key);
            const ml = linked ? rows.find((row) =>
              row.itemId === linked.mlItemId && row.variationId === linked.mlVariationId) : null;
            const verified = Boolean(ml && uniqueTnBySku(ml.sku)?.key === item.key);
            const matchedMl = rows.filter((row) => uniqueTnBySku(row.sku)?.key === item.key);
            const label = verified ? "Vinculada por SKU" :
              linked ? "Vínculo guardado sin verificar" :
              matchedMl.length === 1 ? "SKU coincidente" : "Sin coincidencia";
            return (
              <div key={item.key} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", padding: "11px 12px", border: "1px solid #e5eaf3", borderRadius: 11 }}>
                <div style={{ minWidth: 160, display: "grid", gap: 3 }}>
                  <strong style={{ fontSize: 13, color: "#263b64" }}>{item.name}</strong>
                  <span style={softText}>{item.description} · SKU {item.sku ?? "Sin SKU"}</span>
                  <span style={softText}>TN: {item.productId} · Variante: {item.variantId} · {item.status}</span>
                </div>
                <div style={{ textAlign: "right", display: "grid", gap: 3 }}>
                  <strong style={{ color: "#263b64" }}>Stock: {stockValue(item.stock)}</strong>
                  <span style={{ fontSize: 12, color: verified || matchedMl.length === 1 ? "#287d59" : "#8b651f" }}>{label}</span>
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
        Sólo se vinculan SKU idénticos y únicos. No se modifica el stock ni se activa la sincronización automática.
      </p>
    </main>
  );
}
