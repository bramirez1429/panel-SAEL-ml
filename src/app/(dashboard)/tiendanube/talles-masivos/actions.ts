"use server";

import { createGetTiendanubeProductsQuery } from "@/modules/tiendanube/tiendanube.composition.server";
import type { TiendanubeProductsPage } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { AppError } from "@/shared/errors/app-error";

export type LoadSizeCatalogResult =
  | Readonly<{ ok: true; data: TiendanubeProductsPage }>
  | Readonly<{ ok: false; message: string }>;

/**
 * Etapa 1: consultas exclusivamente de lectura. No hay PUT/PATCH/POST.
 * Se pagina para evitar cargar el catálogo completo en una sola solicitud.
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
