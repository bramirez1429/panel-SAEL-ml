"use server";

import { AppError } from "@/shared/errors/app-error";
import { getTiendanubeCategories } from "@/modules/tiendanube/tiendanube.composition.server";
import { createGetReplicationPreviewQuery } from "@/modules/replication/replication.composition.server";

export async function loadReplicationPreviewAction(sourceKey: string) {
  try {
    return { ok: true as const, preview: await createGetReplicationPreviewQuery().execute(sourceKey) };
  } catch (error: unknown) {
    return { ok: false as const, message: error instanceof AppError ? error.message : "No se pudo cargar la información de la publicación." };
  }
}

export async function loadReplicationCategoriesAction() {
  try {
    return { ok: true as const, categories: await getTiendanubeCategories() };
  } catch (error: unknown) {
    return { ok: false as const, message: error instanceof AppError ? error.message : "No se pudieron cargar las categorías de Tiendanube." };
  }
}
