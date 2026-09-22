"use server";

import type {
  BulkStockActionResult,
  BulkStockJob,
  BulkStockPreview,
  BulkStockPreviewRequest,
  CreateBulkStockJobRequest,
} from "@/modules/publications/bulk-stock/domain/bulk-stock.model";
import {
  validateBulkStockJobRequest,
  validateBulkStockPreviewRequest,
} from "@/modules/publications/bulk-stock/application/bulk-stock.validation";
import { createBulkStockRepository } from "@/modules/publications/publications.composition.server";
import { AppError } from "@/shared/errors/app-error";

export async function previewBulkStockAction(
  request: BulkStockPreviewRequest,
): Promise<BulkStockActionResult<BulkStockPreview>> {
  const validatedRequest = validateBulkStockPreviewRequest(request);
  if (!validatedRequest) return { ok: false, message: "Revisá el tipo, los talles y el stock ingresado." };

  try {
    return { ok: true, data: await createBulkStockRepository().preview(validatedRequest) };
  } catch (error: unknown) {
    return actionError(error, "No se pudo obtener la vista previa.");
  }
}

export async function createBulkStockJobAction(
  request: CreateBulkStockJobRequest,
): Promise<BulkStockActionResult<Readonly<{ jobId: string }>>> {
  const validatedRequest = validateBulkStockJobRequest(request);
  if (!validatedRequest) {
    return { ok: false, message: "La selección de variantes no es válida." };
  }

  try {
    return { ok: true, data: await createBulkStockRepository().createJob(validatedRequest) };
  } catch (error: unknown) {
    return actionError(error, "No se pudo iniciar el cambio de stock.");
  }
}

export async function getBulkStockJobAction(
  jobId: string,
): Promise<BulkStockActionResult<BulkStockJob>> {
  if (!jobId.trim() || jobId.length > 200) {
    return { ok: false, message: "El identificador del proceso no es válido." };
  }

  try {
    return { ok: true, data: await createBulkStockRepository().getJob(jobId.trim()) };
  } catch (error: unknown) {
    return actionError(error, "No se pudo consultar el progreso.");
  }
}

function actionError<T>(error: unknown, fallback: string): BulkStockActionResult<T> {
  return { ok: false, message: error instanceof AppError ? error.message : fallback };
}
