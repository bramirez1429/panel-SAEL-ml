"use server";

import { AppError } from "@/shared/errors/app-error";
import {
  createUpdatePublicationCommand,
} from "@/modules/publications/publications.composition.server";
import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";
import { changedPublicationFields } from "@/modules/publications/application/publication-edit.validation";
import type { PublicationDetail } from "@/modules/publications/domain/publication.model";
import { createGetPublicationByIdQuery } from "@/modules/publications/publications.composition.server";

export type UpdatePublicationActionResult =
  | Readonly<{ ok: true; confirmed: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null }> }>
  | Readonly<{ ok: false; message: string }>;

export async function updatePublicationAction(
  input: UpdatePublicationInput,
): Promise<UpdatePublicationActionResult> {
  try {
    const changed = await createUpdatePublicationCommand().execute(input);
    // Confirmamos la escritura leyendo de nuevo el detalle y, para familias,
    // también su colección completa antes de informar éxito al cliente.
    if (!changed) return { ok: true, confirmed: {} };

    const changedFields = changedPublicationFields(input.current, input.draft);
    let detail: PublicationDetail | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const freshDetail = await createGetPublicationByIdQuery().execute(input.publicationId);
      detail = freshDetail;
      const confirmed = getConfirmedValues(freshDetail, input);
      if (matchesChangedFields(confirmed, changedFields) || attempt === 2) {
        return { ok: true, confirmed };
      }
      await wait(40);
    }
    return { ok: true, confirmed: detail ? getConfirmedValues(detail, input) : {} };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "No se pudo actualizar la publicación." };
  }
}

function getConfirmedValues(
  detail: PublicationDetail,
  input: UpdatePublicationInput,
): Readonly<{ sku?: string | null; price?: number | null; stock?: number | null }> {
  const variationId = input.target.type === "legacy" ? input.target.variationId : null;
  const variant = input.target.type === "family"
    ? detail.variants.find((item) => item.itemId === input.target.itemId)
    : variationId === null
      ? null
      : detail.variants.find((item) => item.id === String(variationId));
  return {
    sku: variant?.sku ?? (variant ? null : getAttributeValue(detail, "SELLER_SKU")),
    price: variant?.price?.amount ?? (variant ? null : detail.price?.from ?? null),
    stock: variant?.stock ?? (variant ? null : detail.stock),
  };
}

function getAttributeValue(detail: PublicationDetail, id: string): string | null {
  const attribute = detail.attributes.find((item) => item.id.trim().toUpperCase() === id);
  return attribute?.value?.trim() || null;
}

function matchesChangedFields(
  confirmed: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null }>,
  changed: Partial<UpdatePublicationInput["draft"]>,
): boolean {
  return (changed.sku === undefined || confirmed.sku === changed.sku) &&
    (changed.price === undefined || confirmed.price === changed.price) &&
    (changed.stock === undefined || confirmed.stock === changed.stock);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
