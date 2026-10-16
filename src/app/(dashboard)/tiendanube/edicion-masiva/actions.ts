"use server";

import { createTiendanubeBulkEditRepository } from "@/modules/tiendanube-bulk-edit/tiendanube-bulk-edit.composition.server";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "@/modules/tiendanube-bulk-edit/domain/tiendanube-bulk-edit.model";
import { AppError } from "@/shared/errors/app-error";

type ActionResult<T> = T | Readonly<{ ok: false; message: string }>;
const errorMessage = (error: unknown, fallback: string): string => error instanceof AppError ? error.message : fallback;

export async function getBulkEditCategorySummaryAction(categoryId: number): Promise<ActionResult<TiendanubeBulkEditCategorySummary>> {
  try { return await createTiendanubeBulkEditRepository().getCategorySummary(categoryId); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo cargar el resumen de la categoría.") }; }
}
export async function previewBulkEditAction(request: TiendanubeBulkEditRequest): Promise<ActionResult<TiendanubeBulkEditPreview>> {
  try { return await createTiendanubeBulkEditRepository().preview(request); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo generar la previsualización.") }; }
}
export async function getActiveBulkEditAction(): Promise<ActionResult<TiendanubeBulkEditJob | null>> {
  try { return await createTiendanubeBulkEditRepository().getActive(); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo recuperar la actualización en curso.") }; }
}
