"use server";

import { ApiError } from "@/shared/api/api-error";
import { AppError } from "@/shared/errors/app-error";
import {
  createGetTiendanubeProductByMlQuery,
  createGetTiendanubeReplicationStatusQuery,
  createReplicatePublicationCommand,
} from "@/modules/tiendanube/tiendanube.composition.server";
import type {
  ReplicationOptions,
  TiendanubeProductByMl,
  TiendanubeReplicationState,
} from "@/modules/tiendanube/domain/tiendanube-replication.model";

export type ReplicatePublicationActionResult =
  | Readonly<{ ok: true; action: "created" | "updated" }>
  | Readonly<{ ok: false; message: string }>;

/** Server Action que transporta sourceKey sin exponer credenciales ni infraestructura al navegador. */
export async function replicatePublicationAction(sourceKey: string, options: ReplicationOptions): Promise<ReplicatePublicationActionResult> {
  if (!sourceKey.trim()) return { ok: false, message: "La clave sourceKey está vacía." };
  try {
    const action = await createReplicatePublicationCommand().execute(sourceKey, options);
    return { ok: true, action };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 409 && /más de 3 atributos/i.test(error.message)) {
      return { ok: false, message: "Esta publicación usa más atributos de variación de los permitidos por Tiendanube." };
    }
    if (error instanceof AppError) return { ok: false, message: error.message };
    return { ok: false, message: "No se pudo replicar la publicación en Tiendanube." };
  }
}

export async function getTiendanubeReplicationStateAction(
  sourceKey: string,
): Promise<TiendanubeReplicationState> {
  const fallback: TiendanubeReplicationState = {
    sourceKey,
    status: "UNKNOWN",
    tiendanubeProductId: null,
  };
  if (!sourceKey.trim()) return fallback;

  try {
    const states = await createGetTiendanubeReplicationStatusQuery().execute([sourceKey]);
    return states.find((state) => state.sourceKey === sourceKey) ?? {
      sourceKey,
      status: "NOT_REPLICATED",
      tiendanubeProductId: null,
    };
  } catch {
    return fallback;
  }
}

export type GetTiendanubeProductByMlActionResult =
  | Readonly<{ ok: true; product: TiendanubeProductByMl }>
  | Readonly<{ ok: false }>;

export async function getTiendanubeProductByMlAction(
  itemId: string,
): Promise<GetTiendanubeProductByMlActionResult> {
  if (!itemId.trim()) return { ok: false };

  try {
    return {
      ok: true,
      product: await createGetTiendanubeProductByMlQuery().execute(itemId),
    };
  } catch {
    return { ok: false };
  }
}
