"use server";

import { AppError } from "@/shared/errors/app-error";

import { createSyncRepository } from "../sync.composition.server";
import type {
  RetrySyncErrorsResult,
  StartSyncResult,
  SyncActionResult,
  SyncError,
  SyncOverview,
} from "../domain/sync.model";

export async function getSyncOverviewAction(): Promise<SyncActionResult<SyncOverview>> {
  return safely(() => createSyncRepository().getOverview());
}

export async function startSyncAction(): Promise<SyncActionResult<StartSyncResult>> {
  return safely(() => createSyncRepository().startFullSync());
}

export async function getOpenSyncErrorsAction(
  syncId: string,
): Promise<SyncActionResult<readonly SyncError[]>> {
  return safely(() => createSyncRepository().getOpenErrors(syncId));
}

export async function retrySyncErrorAction(
  syncId: string,
  errorId: string,
): Promise<SyncActionResult<RetrySyncErrorsResult>> {
  return safely(() => createSyncRepository().retryOne(syncId, errorId));
}

export async function retrySelectedSyncErrorsAction(
  syncId: string,
  errorIds: readonly string[],
): Promise<SyncActionResult<RetrySyncErrorsResult>> {
  return safely(() => createSyncRepository().retrySelected(syncId, errorIds));
}

export async function retryAllSyncErrorsAction(
  syncId: string,
): Promise<SyncActionResult<RetrySyncErrorsResult>> {
  return safely(() => createSyncRepository().retryAll(syncId));
}

async function safely<T>(operation: () => Promise<T>): Promise<SyncActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof AppError
        ? error.message
        : "No se pudo completar la operación de sincronización.",
    };
  }
}
