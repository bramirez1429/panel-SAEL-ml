"use server";

import { AppError } from "@/shared/errors/app-error";
import type { MercadolibreSyncActionResult } from "@/modules/mercadolibre-sync/domain/mercadolibre-sync.model";
import {
  createGetMercadolibreSyncStatusQuery,
  createStartMercadolibreSyncCommand,
} from "@/modules/mercadolibre-sync/mercadolibre-sync.composition.server";

export async function startMercadolibreSyncAction(): Promise<MercadolibreSyncActionResult> {
  try {
    return await createStartMercadolibreSyncCommand().execute();
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error) };
  }
}

export async function getMercadolibreSyncStatusAction(syncId: string): Promise<MercadolibreSyncActionResult> {
  try {
    return await createGetMercadolibreSyncStatusQuery().execute(syncId);
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error) };
  }
}

function safeSyncErrorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : "No se pudo consultar la sincronización.";
}
