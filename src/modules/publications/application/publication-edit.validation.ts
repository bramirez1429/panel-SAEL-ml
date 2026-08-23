import { z } from "zod";

export const publicationEditDraftSchema = z.object({
  price: z.number().finite().positive().nullable(),
  stock: z.number().int().nonnegative().nullable(),
  sku: z.string().nullable(),
});

export type PublicationEditDraft = z.infer<typeof publicationEditDraftSchema>;
export type PublicationEditSnapshot = Readonly<{ price: number | null; stock: number | null; sku: string | null }>;
export type PublicationEditChanges = Partial<PublicationEditDraft>;

export function getPublicationEditChanges(current: PublicationEditSnapshot, draft: PublicationEditDraft): PublicationEditChanges {
  const sku = draft.sku?.trim() ?? "";
  const currentSku = current.sku?.trim() ?? null;
  return {
    ...(draft.price !== current.price ? { price: draft.price } : {}),
    ...(draft.stock !== current.stock ? { stock: draft.stock } : {}),
    ...(currentSku === null && sku === "" ? {} : sku !== currentSku ? { sku } : {}),
  };
}

export function validatePublicationEditChanges(changes: PublicationEditChanges): { success: true } | { success: false; message: string } {
  if (changes.price !== undefined && !z.number().finite().positive().safeParse(changes.price).success) {
    return { success: false, message: "El precio debe ser un número mayor a cero." };
  }
  if (changes.stock !== undefined && !z.number().int().nonnegative().safeParse(changes.stock).success) {
    return { success: false, message: "El stock debe ser un entero mayor o igual a cero." };
  }
  if (changes.sku !== undefined && !z.string().trim().min(1).safeParse(changes.sku).success) {
    return { success: false, message: "El SKU no puede quedar vacío." };
  }
  return { success: true };
}

export function changedPublicationFields(current: PublicationEditSnapshot, draft: PublicationEditDraft): PublicationEditChanges {
  return getPublicationEditChanges(current, draft);
}
