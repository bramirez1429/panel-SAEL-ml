"use server";

import { createTiendanubeBulkEditRepository } from "@/modules/tiendanube-bulk-edit/tiendanube-bulk-edit.composition.server";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailure, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "@/modules/tiendanube-bulk-edit/domain/tiendanube-bulk-edit.model";
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
export async function createBulkEditJobAction(snapshotId: string): Promise<ActionResult<TiendanubeBulkEditJob>> {
  try { return await createTiendanubeBulkEditRepository().createJob(snapshotId); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo iniciar la actualización.") }; }
}
export async function getBulkEditJobAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>> {
  try { return await createTiendanubeBulkEditRepository().getJob(jobId); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo consultar el progreso.") }; }
}
export async function getBulkEditFailuresAction(jobId: string): Promise<ActionResult<readonly TiendanubeBulkEditFailure[]>> {
  try { return await createTiendanubeBulkEditRepository().getFailures(jobId); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudo obtener el detalle de las variantes fallidas.") }; }
}
export async function retryBulkEditFailuresAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>> {
  try { return await createTiendanubeBulkEditRepository().retryFailures(jobId); } catch (error) { return { ok: false, message: errorMessage(error, "No se pudieron reintentar las variantes fallidas.") }; }
}
