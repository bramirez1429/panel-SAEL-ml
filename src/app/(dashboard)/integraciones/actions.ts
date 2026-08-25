"use server";

import { AppError } from "@/shared/errors/app-error";
import { createMercadoLibreApiRepository, createTiendanubeApiRepository } from "@/modules/integrations/integrations.composition.server";

export async function disconnectMercadoLibre(): Promise<{ ok: true } | { ok: false; message: string }> {
  try { await createMercadoLibreApiRepository().disconnect(); return { ok: true }; }
  catch (error: unknown) { return { ok: false, message: error instanceof AppError ? error.message : "No se pudo desconectar Mercado Libre." }; }
}

export async function disconnectTiendanube(): Promise<{ ok: true } | { ok: false; message: string }> {
  try { await createTiendanubeApiRepository().disconnect(); return { ok: true }; }
  catch (error: unknown) { return { ok: false, message: error instanceof AppError ? error.message : "No se pudo desconectar Tiendanube." }; }
}
