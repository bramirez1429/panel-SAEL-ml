"use server";

import { AppError } from "@/shared/errors/app-error";
import {
  createUpdatePublicationCommand,
} from "@/modules/publications/publications.composition.server";
import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";
import { createGetPublicationByIdQuery } from "@/modules/publications/publications.composition.server";

export type UpdatePublicationActionResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; message: string }>;

export async function updatePublicationAction(
  input: UpdatePublicationInput,
): Promise<UpdatePublicationActionResult> {
  try {
    const changed = await createUpdatePublicationCommand().execute(input);
    // Confirmamos la escritura leyendo de nuevo el detalle y, para familias,
    // también su colección completa antes de informar éxito al cliente.
    if (changed) {
      await createGetPublicationByIdQuery().execute(input.publicationId);
    }
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "No se pudo actualizar la publicación." };
  }
}
