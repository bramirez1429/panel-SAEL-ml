"use server";

import type {
  BulkStockActionResult,
  BulkStockCatalogRequest,
  BulkStockSelectionPreviewRequest,
  BulkStockJob,
  BulkStockPreview,
  BulkStockPreviewRequest,
  CreateBulkStockJobRequest,
} from "@/modules/publications/bulk-stock/domain/bulk-stock.model";
import { BULK_STOCK_PRODUCT_TYPES } from "@/modules/publications/bulk-stock/domain/bulk-stock.model";
import {
  validateBulkStockJobRequest,
  validateBulkStockPreviewRequest,
} from "@/modules/publications/bulk-stock/application/bulk-stock.validation";
import { createBulkStockRepository } from "@/modules/publications/publications.composition.server";
import { AppError } from "@/shared/errors/app-error";

export async function loadBulkStockCatalogAction(
  request: BulkStockCatalogRequest,
): Promise<BulkStockActionResult<BulkStockPreview>> {
  if (!request || !BULK_STOCK_PRODUCT_TYPES.includes(request.productType)) {
    return { ok: false, message: "Seleccioná un producto válido." };
  }
  try {
    return { ok: true, data: await createBulkStockRepository().catalog(request) };
  } catch (error: unknown) {
    return actionError(error, "No se pudieron cargar las variantes de Mercado Libre.");
  }
}

export async function previewBulkStockSelectionAction(
  request: BulkStockSelectionPreviewRequest,
): Promise<BulkStockActionResult<BulkStockPreview>> {
  if (!request || !BULK_STOCK_PRODUCT_TYPES.includes(request.productType) ||
    !Number.isSafeInteger(request.quantity) || request.quantity < 0 ||
    !Array.isArray(request.identifiers) || request.identifiers.length === 0 ||
    request.identifiers.length > 1000 ||
    !request.identifiers.every((id) => typeof id === "string" && id.trim().length > 0) ||
    new Set(request.identifiers).size !== request.identifiers.length
  ) {
    return { ok: false, message: "Revisá la selección y la cantidad ingresada." };
  }
  try {
    return { ok: true, data: await createBulkStockRepository().selectionPreview(request) };
  } catch (error: unknown) {
    return actionError(error, "No se pudo preparar la vista previa.");
  }
}

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
