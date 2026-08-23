import { z } from "zod";

export const publicationEditDraftSchema = z.object({
  price: z.number().finite().positive().nullable(),
  stock: z.number().int().nonnegative().nullable(),
  sku: z.string().trim().min(1).nullable(),
});

export type PublicationEditDraft = z.infer<typeof publicationEditDraftSchema>;
export type PublicationEditSnapshot = Readonly<{
  price: number | null;
  stock: number | null;
  sku: string | null;
}>;

export function changedPublicationFields(
  current: PublicationEditSnapshot,
  draft: PublicationEditDraft,
): Partial<PublicationEditDraft> {
  const normalized = { ...draft, sku: draft.sku?.trim() ?? null };
  return {
    ...(normalized.price !== current.price && normalized.price !== null ? { price: normalized.price } : {}),
    ...(normalized.stock !== current.stock && normalized.stock !== null ? { stock: normalized.stock } : {}),
    ...(normalized.sku !== current.sku && normalized.sku !== null ? { sku: normalized.sku } : {}),
  };
}
