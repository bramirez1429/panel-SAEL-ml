"use server";

import { revalidatePath } from "next/cache";
import type { SimilarPublicationCreateInput } from "@/modules/publications/domain/similar-publication.model";
import {
  createCreateSimilarPublicationCommand,
  createUploadSimilarPublicationPictureCommand,
} from "@/modules/publications/publications.composition.server";
import type {
  CreateSimilarPublicationAction,
  UploadSimilarPublicationPictureAction,
} from "@/modules/publications/presentation/similar-publication-action.types";
import { AppError } from "@/shared/errors/app-error";

export const createSimilarPublicationAction: CreateSimilarPublicationAction = async (
  input: SimilarPublicationCreateInput,
) => {
  try {
    const result = await createCreateSimilarPublicationCommand().execute(input);
    if (result.status !== "FAILED") revalidatePath("/publicaciones");
    return { ok: true, result };
  } catch (error: unknown) {
    return { ok: false, message: safeMessage(error, "No se pudo crear la publicación en Mercado Libre.") };
  }
};

export const uploadSimilarPublicationPictureAction: UploadSimilarPublicationPictureAction = async (
  formData: FormData,
) => {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "Seleccioná una imagen válida." };
  }
  try {
    const picture = await createUploadSimilarPublicationPictureCommand().execute(file);
    return { ok: true, picture };
  } catch (error: unknown) {
    return { ok: false, message: safeMessage(error, "No se pudo subir la imagen.") };
  }
};

function safeMessage(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.message : fallback;
}
