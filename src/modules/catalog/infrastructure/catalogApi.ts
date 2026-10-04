import type { CatalogColor, CatalogProduct } from "../domain/catalog.model";
import { catalogColors } from "../domain/catalog.model";

const catalogEndpoint = "/api/catalogo";

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const response = await fetch(catalogEndpoint, { cache: "no-store" });
  return parseProducts(response);
}

export async function createCatalogProduct(
  name: string,
  file: File,
  colors: CatalogColor[],
): Promise<void> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("name", name);
  formData.append("colors", JSON.stringify(colors));

  const response = await fetch(catalogEndpoint, {
    method: "POST",
    body: formData,
  });

  await ensureSuccessful(response);
}

export async function updateCatalogProductColors(
  id: string,
  colors: CatalogColor[],
): Promise<void> {
  const response = await fetch(`${catalogEndpoint}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colors }),
  });

  await ensureSuccessful(response);
}

export async function deleteCatalogProduct(id: string): Promise<void> {
  const response = await fetch(`${catalogEndpoint}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  await ensureSuccessful(response);
}

async function parseProducts(response: Response): Promise<CatalogProduct[]> {
  await ensureSuccessful(response);
  const payload: unknown = await response.json();
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.products)
      ? payload.products
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];

  return items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = item.id;
    const name = item.name;
    const image = item.image ?? item.imageUrl ?? item.url;
    if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string" || typeof image !== "string") {
      return [];
    }
    return [{
      id: String(id),
      name,
      image,
      colors: normalizeColors(item.colors),
    }];
  });
}

function normalizeColors(value: unknown): CatalogColor[] {
  if (!Array.isArray(value)) return [];
  return value.filter((color): color is CatalogColor =>
    typeof color === "string" && catalogColors.includes(color as CatalogColor),
  );
}

async function ensureSuccessful(response: Response): Promise<void> {
  if (response.ok) return;
  if (response.status === 413) {
    throw new Error("La imagen es demasiado pesada. El tamaño máximo permitido es de 4 MB.");
  }
  let detail = "";
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.message === "string") detail = `: ${payload.message}`;
    else if (isRecord(payload) && typeof payload.error === "string") detail = `: ${payload.error}`;
  } catch { /* La respuesta puede no ser JSON. */ }
  throw new Error(`No se pudo completar la operación (${response.status})${detail}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
