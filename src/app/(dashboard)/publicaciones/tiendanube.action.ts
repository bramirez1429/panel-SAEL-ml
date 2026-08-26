"use server";

import { ApiError } from "@/shared/api/api-error";
import { AppError } from "@/shared/errors/app-error";
import { createReplicatePublicationCommand } from "@/modules/tiendanube/tiendanube.composition.server";
import type { ReplicationOptions } from "@/modules/tiendanube/domain/tiendanube-replication.model";

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
