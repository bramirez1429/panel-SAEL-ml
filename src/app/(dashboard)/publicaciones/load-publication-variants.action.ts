"use server";

import type {
  PublicationType,
  PublicationVariant,
} from "@/modules/publications/domain/publication.model";
import { createGetPublicationVariantsQuery } from "@/modules/publications/publications.composition.server";
import { AppError } from "@/shared/errors/app-error";

export type LoadPublicationVariantsAction = (
  input: Readonly<{
    publicationId: string;
    publicationType: PublicationType;
    familyId: string | null;
  }>,
) => Promise<
  | Readonly<{ ok: true; variants: readonly PublicationVariant[] }>
  | Readonly<{ ok: false; message: string }>
>;

export const loadPublicationVariantsAction: LoadPublicationVariantsAction = async (
  input,
) => {
  if (
    (input.publicationType === "LEGACY" && !/^MLA\d+$/.test(input.publicationId)) ||
    (input.publicationType === "USER_PRODUCT" && !/^\d+$/.test(input.familyId ?? ""))
  ) {
    return {
      ok: false,
      message: "No se pudieron identificar las variantes de esta publicación.",
    };
  }

  try {
    const variants = await createGetPublicationVariantsQuery().execute(input);
    return { ok: true, variants };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof AppError
          ? error.message
          : "No se pudieron cargar las variantes.",
    };
  }
};
