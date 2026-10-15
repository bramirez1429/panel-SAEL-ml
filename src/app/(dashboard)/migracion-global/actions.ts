"use server";

import {
  createGetActiveTiendanubeMigrationQuery,
  createGetTiendanubeMigrationResultsQuery,
  createGetTiendanubeMigrationStatusQuery,
  createStartTiendanubeMigrationCommand,
  createResumeOneTiendanubeMigrationCommand,
} from "@/modules/tiendanube-migration/tiendanube-migration.composition.server";
import type {
  TiendanubeActiveMigrationActionResult,
  TiendanubeMigrationActionResult,
  TiendanubeMigrationOutcome,
  TiendanubeMigrationResultsActionResult,
} from "@/modules/tiendanube-migration/domain/tiendanube-migration.model";
import { AppError } from "@/shared/errors/app-error";

export async function startTiendanubeMigrationAction(): Promise<TiendanubeMigrationActionResult> {
  try {
    return await createStartTiendanubeMigrationCommand().execute();
  } catch (error: unknown) {
    return { ok: false, message: errorMessage(error, "No se pudo iniciar la migración global.") };
  }
}

export async function resumeOneTiendanubeMigrationAction(
  jobId: string
): Promise<TiendanubeMigrationActionResult> {
  try {
    return await createResumeOneTiendanubeMigrationCommand().execute(jobId);
  } catch (error: unknown) {
    return {
      ok: false,
      message: errorMessage(error, "No se pudo probar un producto.")
    };
  }
}

export async function getActiveTiendanubeMigrationAction(): Promise<TiendanubeActiveMigrationActionResult> {
  try {
    return await createGetActiveTiendanubeMigrationQuery().execute();
  } catch (error: unknown) {
    return { ok: false, message: errorMessage(error, "No se pudo recuperar la migración activa.") };
  }
}

export async function getTiendanubeMigrationStatusAction(jobId: string): Promise<TiendanubeMigrationActionResult> {
  try {
    return await createGetTiendanubeMigrationStatusQuery().execute(jobId);
  } catch (error: unknown) {
    return { ok: false, message: errorMessage(error, "No se pudo consultar el estado de la migración.") };
  }
}

export async function getTiendanubeMigrationResultsAction(
  jobId: string,
  outcome: TiendanubeMigrationOutcome,
  page: number,
  pageSize: number,
): Promise<TiendanubeMigrationResultsActionResult> {
  try {
    return await createGetTiendanubeMigrationResultsQuery().execute(jobId, outcome, page, pageSize);
  } catch (error: unknown) {
    return { ok: false, message: errorMessage(error, "No se pudieron recuperar los resultados de la migración.") };
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.message : fallback;
}
