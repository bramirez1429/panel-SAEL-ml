"use server";

import { AppError } from "@/shared/errors/app-error";
import {
  createUpdatePublicationCommand,
} from "@/modules/publications/publications.composition.server";
import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";

export type UpdatePublicationActionResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; message: string }>;

export async function updatePublicationAction(
  input: UpdatePublicationInput,
): Promise<UpdatePublicationActionResult> {
  try {
    await createUpdatePublicationCommand().execute(input);
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "No se pudo actualizar la publicación." };
  }
}
