"use server";

import { AppError } from "@/shared/errors/app-error";
import type { MercadolibreActiveSyncActionResult, MercadolibreSyncActionResult } from "@/modules/mercadolibre-sync/domain/mercadolibre-sync.model";
import {
  createCancelMercadolibreSyncCommand,
  createGetMercadolibreActiveSyncQuery,
  createGetMercadolibreSyncStatusQuery,
  createStartMercadolibreSyncCommand,
} from "@/modules/mercadolibre-sync/mercadolibre-sync.composition.server";

export async function startMercadolibreSyncAction(): Promise<MercadolibreSyncActionResult> {
  try {
    return await createStartMercadolibreSyncCommand().execute();
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error, "No se pudo encolar la sincronización.") };
  }
}

export async function getMercadolibreSyncStatusAction(syncId: string): Promise<MercadolibreSyncActionResult> {
  try {
    return await createGetMercadolibreSyncStatusQuery().execute(syncId);
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error, "No se pudo consultar la sincronización.") };
  }
}

export async function getMercadolibreActiveSyncAction(): Promise<MercadolibreActiveSyncActionResult> {
  try {
    return await createGetMercadolibreActiveSyncQuery().execute();
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error, "No se pudo recuperar la sincronización activa.") };
  }
}

export async function cancelMercadolibreSyncAction(syncId: string): Promise<MercadolibreSyncActionResult> {
  try {
    return await createCancelMercadolibreSyncCommand().execute(syncId);
  } catch (error: unknown) {
    return { ok: false, message: safeSyncErrorMessage(error, "No se pudo cancelar la sincronización.") };
  }
}

function safeSyncErrorMessage(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.message : fallback;
}
