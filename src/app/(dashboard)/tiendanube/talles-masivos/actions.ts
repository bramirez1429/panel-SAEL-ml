"use server";

import { createGetTiendanubeProductsQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import type { TiendanubeProductsPage } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { AppError } from "@/shared/errors/app-error";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import type { StockUpdate } from "@/modules/tiendanube-size-rename/domain/stock-by-size";
import { z } from "zod";

export type LoadSizeCatalogResult =
  | Readonly<{ ok: true; data: TiendanubeProductsPage }>
  | Readonly<{ ok: false; message: string }>;

/**
 * Consulta el catálogo por páginas. La escritura utiliza una acción independiente
 * de lotes autenticados y se valida nuevamente en el backend.
 */
export async function loadSizeCatalogPageAction(
  search: string,
  page: number,
): Promise<LoadSizeCatalogResult> {
  const query = search.trim();
  if (query.length < 2 || query.length > 80) {
    return { ok: false, message: "Ingresá al menos 2 caracteres para buscar productos." };
  }
  if (!Number.isSafeInteger(page) || page < 1 || page > 200) {
    return { ok: false, message: "Número de página inválido." };
  }

  try {
    const data = await createGetTiendanubeProductsQuery().execute({
      q: query,
      page,
      pageSize: 100,
    });
    return { ok: true, data };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof AppError
        ? error.message
        : "No se pudo consultar el catálogo de Tiendanube.",
    };
  }
}

export type ApplyStockBatchResult =
  | Readonly<{ ok: true; updatedVariantIds: readonly string[]; failedVariantIds: readonly string[] }>
  | Readonly<{ ok: false; message: string }>;

const stockBatchResponseSchema = z.object({
  updatedVariantIds: z.array(z.string()),
  failedVariantIds: z.array(z.string()),
});

export async function applyStockBatchAction(
  updates: readonly StockUpdate[],
): Promise<ApplyStockBatchResult> {
  if (updates.length === 0 || updates.length > 20) {
    return { ok: false, message: "El lote debe contener entre 1 y 20 variantes." };
  }
  try {
    const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    const result = stockBatchResponseSchema.parse(
      await client.post("/tiendanube/size-stock/apply-batch", { updates }),
    );
    return { ok: true, ...result };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof AppError
        ? error.message
        : "No se pudo actualizar el stock de Tiendanube. Revisá el backend y volvé a consultar el catálogo.",
    };
  }
}

/** Read-only capability check: production can lag behind the preview frontend. */
export async function checkSizeStockReadyAction(): Promise<boolean> {
  try {
    const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    const value = z.object({ ready: z.literal(true) }).safeParse(
      await client.get("/tiendanube/size-stock/status"),
    );
    return value.success;
  } catch {
    return false;
  }
}
