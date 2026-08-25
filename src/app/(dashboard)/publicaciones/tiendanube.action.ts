"use server";

import { ApiError } from "@/shared/api/api-error";
import { AppError } from "@/shared/errors/app-error";
import { createReplicatePublicationCommand } from "@/modules/tiendanube/tiendanube.composition.server";

export type ReplicatePublicationActionResult =
  | Readonly<{ ok: true; action: "created" | "updated" }>
  | Readonly<{ ok: false; message: string }>;

export async function replicatePublicationAction(sourceId: string): Promise<ReplicatePublicationActionResult> {
  try {
    const action = await createReplicatePublicationCommand().execute(sourceId);
    return { ok: true, action };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 409 && /m[aá]s de 3 atributos/i.test(error.message)) {
      return { ok: false, message: "Esta publicación usa más atributos de variación de los permitidos por Tiendanube." };
    }
    if (error instanceof AppError) return { ok: false, message: error.message };
    return { ok: false, message: "No se pudo replicar la publicación en Tiendanube." };
  }
}
