import type { CSSProperties } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

export const dynamic = "force-dynamic";

const mlVariantSchema = z.object({
  itemId: z.string(),
  variationId: z.string().nullable(),
  title: z.string(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  sku: z.string(),
  stock: z.number().nullable(),
});
const tnVariantSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  sku: z.string(),
  stock: z.number().nullable(),
  status: z.string(),
});
const skuResponseSchema = z.object({
  sku: z.string(),
  mercadoLibre: z.object({ error: z.boolean(), variants: z.array(mlVariantSchema) }),
  tiendanube: z.object({ error: z.boolean(), variants: z.array(tnVariantSchema) }),
});
const linksSchema = z.array(z.object({
  mlItemId: z.string(),
  mlVariationId: z.string().nullable(),
  tnProductId: z.string(),
  tnVariantId: z.string(),
}));

type SkuResponse = z.infer<typeof skuResponseSchema>;
type SavedLink = z.infer<typeof linksSchema>[number];
type Params = Record<string, string | string[] | undefined>;
type MlVariant = z.infer<typeof mlVariantSchema>;
type TnVariant = z.infer<typeof tnVariantSchema>;

const surface: CSSProperties = {
  padding: "clamp(18px, 2.5vw, 28px)",
  background: "#fff",
  border: "1px solid #e2e8f2",
  borderRadius: 18,
  boxShadow: "0 8px 24px rgb(24 48 98 / 5%)",
};
const softText: CSSProperties = { color: "#6a7892", fontSize: 13, lineHeight: 1.5 };
const primaryButton: CSSProperties = {
  border: 0, borderRadius: 10, padding: "10px 16px", color: "#fff",
  background: "#315dd5", cursor: "pointer", font: "inherit",
  fontWeight: 700, fontSize: 13,
};
const inputStyle: CSSProperties = {
  boxSizing: "border-box", width: "100%", minHeight: 44, padding: "9px 12px",
  border: "1px solid #cad5e6", borderRadius: 10,
  background: "#fff", color: "#213350", font: "inherit", fontSize: 14,
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function stockValue(value: number | null): string {
  return value === null ? "Sin dato" : String(value);
}

function variantText(color: string | null, size: string | null): string {
  return [color, size].filter(Boolean).join(" · ") || "Sin atributos";
}

async function loadBySku(sku: string): Promise<SkuResponse> {
  const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  const result = await client.get(`/sales/stock-by-sku?sku=${encodeURIComponent(sku)}`);
  return skuResponseSchema.parse(result);
}

async function loadSavedLinks(): Promise<SavedLink[]> {
  const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  return linksSchema.parse(await client.get("/sales/variant-links"));
}

async function saveLink(form: FormData): Promise<void> {
  "use server";

  const sku = String(form.get("sku") ?? "").trim().slice(0, 100);
  const itemId = String(form.get("mlItemId") ?? "");
  const variationId = String(form.get("mlVariationId") ?? "");
  const tnVariant = String(form.get("tnVariant") ?? "");
  const params = new URLSearchParams({ sku });
  if (!sku || !/^MLA\d+$/.test(itemId) ||
    (variationId !== "" && !/^\d+$/.test(variationId)) ||
    !/^[1-9]\d*:[1-9]\d*$/.test(tnVariant)) {
    params.set("resultado", "invalid");
    redirect("/stock-unificado?" + params);
  }

  const [tnProductId, tnVariantId] = tnVariant.split(":");
  try {
    const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    await client.post("/sales/variant-links", {
      mlItemId: itemId,
      ...(variationId ? { mlVariationId: variationId } : {}),
      tnProductId,
      tnVariantId,
    });
    params.set("resultado", "ok");
  } catch {
    params.set("resultado", "error");
  }
  revalidatePath("/stock-unificado");
  redirect("/stock-unificado?" + params);
}

function messageFor(value: string): string | null {
  if (value === "ok") return "Vinculación por SKU guardada. Ninguna existencia fue modificada.";
  if (value === "invalid") return "Revisá los datos antes de vincular.";
  if (value === "error") return "No se pudo vincular. Ambos SKU deben ser idénticos y la pareja debe estar libre.";
  return null;
}

function ResultCard({
  channel, title, subtitle, sku, stock, id,
}: Readonly<{
  channel: string; title: string; subtitle: string;
  sku: string; stock: number | null; id: string;
}>) {
  return (
    <div style={{ border: "1px solid #e4e9f3", borderRadius: 13, padding: 15, display: "grid", gap: 7 }}>
      <span style={{ color: "#677da6", fontWeight: 800, fontSize: 11 }}>{channel}</span>
      <strong style={{ fontSize: 14, color: "#263b64" }}>{title}</strong>
      <span style={softText}>{subtitle}</span>
      <span style={softText}>SKU: <strong>{sku}</strong></span>
      <span style={{ ...softText, overflowWrap: "anywhere" }}>{id}</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={softText}>Stock actual</span>
        <strong style={{ fontSize: 24, color: "#304771" }}>{stockValue(stock)}</strong>
      </div>
    </div>
  );
}

export default async function StockUnificadoPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Params> }>) {
  const params = await searchParams;
  const sku = first(params.sku).trim().slice(0, 100);
  const notice = messageFor(first(params.resultado));
  const [searchResult, linksResult] = sku
    ? await Promise.allSettled([loadBySku(sku), loadSavedLinks()])
    : [null, null];

  const data = searchResult?.status === "fulfilled" ? searchResult.value : null;
  const failed = Boolean(searchResult && searchResult.status === "rejected");
  const links = linksResult?.status === "fulfilled" ? linksResult.value : null;
  const ml = data?.mercadoLibre.variants ?? [];
  const tn = data?.tiendanube.variants ?? [];
  const complete = Boolean(data && !data.mercadoLibre.error && !data.tiendanube.error);
  const oneToOne = complete && ml.length === 1 && tn.length === 1;
  const mlVariant: MlVariant | null = oneToOne ? ml[0] : null;
  const tnVariant: TnVariant | null = oneToOne ? tn[0] : null;
  const alreadyLinked = Boolean(mlVariant && tnVariant && links?.some(
    (link) => link.mlItemId === mlVariant.itemId &&
      link.mlVariationId === mlVariant.variationId &&
      link.tnProductId === tnVariant.productId &&
      link.tnVariantId === tnVariant.variantId,
  ));
  const conflictingLink = Boolean(mlVariant && tnVariant && links?.some(
    (link) =>
      (link.mlItemId === mlVariant.itemId && link.mlVariationId === mlVariant.variationId) ||
      (link.tnProductId === tnVariant.productId && link.tnVariantId === tnVariant.variantId),
  ));
  const sameSku = Boolean(mlVariant && tnVariant && mlVariant.sku.trim() === tnVariant.sku.trim() &&
    mlVariant.sku.trim() !== "");
  const canLink = oneToOne && sameSku && !conflictingLink && links !== null;
  const difference = oneToOne && mlVariant?.stock !== null && tnVariant?.stock !== null
    ? (mlVariant!.stock! - tnVariant!.stock!) : null;

  return (
    <main data-dashboard-full-width="true" style={{ display: "grid", gap: 18, minWidth: 0, maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ display: "grid", gap: 8 }}>
        <Link href="/dashboard" style={{ ...softText, textDecoration: "none" }}>← Volver al dashboard</Link>
        <div>
          <span style={{ fontSize: 11, letterSpacing: ".07em", fontWeight: 800, color: "#697a9c" }}>INVENTARIO · BÚSQUEDA POR SKU</span>
          <h1 style={{ margin: "6px 0", fontSize: "clamp(22px, 2.5vw, 30px)", color: "#1d2e53" }}>Control de stock ML + Tiendanube</h1>
          <p style={{ ...softText, margin: 0 }}>Buscá un SKU en ambos canales y compará los productos y sus existencias.</p>
        </div>
      </header>

      <section style={{ ...surface, display: "grid", gap: 12 }}>
        <form method="get" action="/stock-unificado" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: 7, flex: "1 1 300px", fontSize: 13, fontWeight: 700, color: "#263b64" }}>
            Buscar por SKU en Mercado Libre y Tiendanube
            <input style={inputStyle} name="sku" defaultValue={sku} placeholder="Ej.: REMERA-NEGRO-M" required maxLength={100} />
          </label>
          <button type="submit" style={primaryButton}>Buscar SKU</button>
          <Link href="/stock-unificado" style={{ ...softText, padding: 10 }}>Limpiar</Link>
        </form>
        <p style={{ ...softText, margin: 0 }}>Una sola búsqueda consulta las dos plataformas. El SKU debe coincidir exactamente; no se buscan productos por nombre, color ni talle.</p>
      </section>

      {notice ? <p role="status" style={{ ...surface, margin: 0, background: "#f1f6ff", color: "#315b89" }}>{notice}</p> : null}

      {!sku ? (
        <section style={surface}><p style={{ ...softText, margin: 0 }}>Ingresá un SKU para consultar los productos y el stock en las dos plataformas.</p></section>
      ) : (
        <>
          {failed ? <p role="alert" style={surface}>No se pudo completar la búsqueda. Revisá la conexión con el backend.</p> : null}
          {data ? (
            <>
              <section style={{ ...surface, display: "grid", gap: 14 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#23375e", fontSize: 19 }}>Resultados para el SKU <strong>{sku}</strong></h2>
                  <p style={softText}>Sólo aparecen las variantes cuyo SKU es exactamente el buscado.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
                  <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: "#263b64" }}>Mercado Libre ({ml.length})</h3>
                    {data.mercadoLibre.error ? <p role="alert">No se pudo consultar Mercado Libre. No podemos confirmar coincidencias.</p> :
                      ml.length === 0 ? <p style={softText}>No se encontró este SKU en Mercado Libre.</p> :
                      ml.map((item) => (
                        <ResultCard key={item.itemId + ":" + (item.variationId ?? "item")} channel="MERCADO LIBRE"
                          title={item.title} subtitle={variantText(item.color, item.size)} sku={item.sku}
                          stock={item.stock} id={"ML: " + item.itemId + (item.variationId ? " · Variación " + item.variationId : "")} />
                      ))}
                  </div>
                  <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: "#263b64" }}>Tiendanube ({tn.length})</h3>
                    {data.tiendanube.error ? <p role="alert">No se pudo consultar Tiendanube. No podemos confirmar coincidencias.</p> :
                      tn.length === 0 ? <p style={softText}>No se encontró este SKU en Tiendanube.</p> :
                      tn.map((item) => (
                        <ResultCard key={item.productId + ":" + item.variantId} channel="TIENDANUBE"
                          title={item.name} subtitle={variantText(item.color, item.size)} sku={item.sku}
                          stock={item.stock} id={"TN: " + item.productId + " · Variante " + item.variantId + " · " + item.status} />
                      ))}
                  </div>
                </div>
              </section>

              <section style={{ ...surface, display: "grid", gap: 10 }}>
                <h2 style={{ margin: 0, color: "#23375e", fontSize: 19 }}>Comparación y vinculación</h2>
                {oneToOne && sameSku ? (
                  <>
                    <strong style={{ color: "#287d59" }}>SKU idéntico encontrado en los dos canales.</strong>
                    <p style={{ ...softText, margin: 0 }}>
                      Stock ML: <strong>{stockValue(mlVariant?.stock ?? null)}</strong>
                      {" · "}Stock TN: <strong>{stockValue(tnVariant?.stock ?? null)}</strong>
                      {" · "}{difference === null ? "No hay datos suficientes para calcular la diferencia." :
                        difference === 0 ? "Los stocks coinciden." : "Diferencia ML − TN: " + difference}
                    </p>
                    {alreadyLinked ? <strong style={{ color: "#287d59" }}>Estas variantes ya están vinculadas.</strong> :
                      conflictingLink ? <p style={softText}>Existe una vinculación anterior con otra variante; no se reemplaza automáticamente.</p> :
                      links === null ? <p style={softText}>No se pudieron consultar los vínculos guardados. No se permite guardar para evitar duplicados.</p> :
                      canLink && mlVariant && tnVariant ? (
                        <form action={saveLink} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                          <input type="hidden" name="sku" value={sku} />
                          <input type="hidden" name="mlItemId" value={mlVariant.itemId} />
                          <input type="hidden" name="mlVariationId" value={mlVariant.variationId ?? ""} />
                          <input type="hidden" name="tnVariant" value={tnVariant.productId + ":" + tnVariant.variantId} />
                          <span style={{ ...softText, flex: 1 }}>Confirmá si querés guardar esta vinculación.</span>
                          <button style={primaryButton} type="submit">Vincular por SKU</button>
                        </form>
                      ) : null}
                  </>
                ) : !complete ? (
                  <p style={softText}>La búsqueda no terminó correctamente en ambos canales. No se permite vincular.</p>
                ) : ml.length > 1 || tn.length > 1 ? (
                  <p style={softText}>SKU duplicado: hay más de una variante en al menos un canal. Corregí los SKU para evitar una vinculación equivocada.</p>
                ) : <p style={softText}>Todavía no hay una pareja con este SKU. Asigná exactamente el mismo código en ambos canales.</p>}
              </section>
            </>
          ) : null}
        </>
      )}

      <p style={{ ...softText, textAlign: "center", margin: "0 0 16px" }}>
        Búsqueda y comparación de solo lectura. Guardar una vinculación no modifica las existencias ni activa sincronización automática.
      </p>
    </main>
  );
}
