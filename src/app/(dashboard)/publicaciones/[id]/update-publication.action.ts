"use server";

import { AppError } from "@/shared/errors/app-error";
import {
  createUpdatePublicationCommand,
} from "@/modules/publications/publications.composition.server";
import type { UpdatePublicationInput } from "@/modules/publications/application/update-publication.command";
import { changedPublicationFields } from "@/modules/publications/application/publication-edit.validation";
import type { PublicationDetail } from "@/modules/publications/domain/publication.model";
import type { PublicationEditTarget, PublicationEditStatus } from "@/modules/publications/domain/publication-edit.repository";
import { createGetPublicationByIdQuery } from "@/modules/publications/publications.composition.server";
import { revalidatePath } from "next/cache";

export type UpdatePublicationActionResult =
  | Readonly<{ ok: true; confirmed: Readonly<{ sku?: string | null; price?: number | null; stock?: number | null; status?: PublicationEditStatus }> }>
  | Readonly<{ ok: false; message: string }>;
export type UpdatePublicationStatusAction = (input: Readonly<{ publicationId: string; target: PublicationEditTarget; status: PublicationEditStatus }>) => Promise<Readonly<{ ok: true; confirmed: PublicationEditStatus } | { ok: false; message: string }>>;

export async function updatePublicationAction(
  input: UpdatePublicationInput,
): Promise<UpdatePublicationActionResult> {
  try {
    const command = createUpdatePublicationCommand();
    const changed = await command.execute(input);
    // Confirmamos la escritura leyendo de nuevo el detalle y, para familias,
    // también su colección completa antes de informar éxito al cliente.
    if (!changed) return { ok: true, confirmed: {} };

    const changedFields = changedPublicationFields(input.current, input.draft);
    let detail: PublicationDetail | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const freshDetail = await createGetPublicationByIdQuery().execute(input.publicationId);
      detail = freshDetail;
      const confirmedSku = changedFields.sku === undefined
        ? undefined
        : await command.getSku(input.target);
      const confirmed = getConfirmedValues(freshDetail, input, confirmedSku);
      if (matchesChangedFields(confirmed, changedFields) || attempt === 2) {
        return { ok: true, confirmed };
      }
      await wait(changedFields.sku === undefined ? 40 : 220);
    }
    return { ok: true, confirmed: detail ? getConfirmedValues(detail, input) : {} };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "No se pudo actualizar la publicación." };
  }
}

export async function updatePublicationStatusAction(
  input: Readonly<{ publicationId: string; target: PublicationEditTarget; status: PublicationEditStatus }>,
): Promise<Readonly<{ ok: true; confirmed: PublicationEditStatus } | { ok: false; message: string }>> {
  try {
    await createUpdatePublicationCommand().updateStatus(input.target, input.status);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const detail = await createGetPublicationByIdQuery().execute(input.publicationId);
      const variant = input.target.type === "family"
        ? detail.variants.find((item) => item.itemId === input.target.itemId)
        : null;
      const actual = variant?.status ?? detail.status;
      if (actual === "active" || actual === "paused") {
        if (actual === input.status) {
          revalidatePath(`/publicaciones/${input.publicationId}`);
          return { ok: true, confirmed: actual };
        }
      }
      if (attempt < 2) await wait(40);
    }
    return { ok: false, message: `El backend todavía no confirmó el estado ${input.status}.` };
  } catch (error: unknown) {
    return { ok: false, message: error instanceof AppError ? error.message : "No se pudo actualizar el estado." };
  }
}

function getConfirmedValues(
  detail: PublicationDetail,
  input: UpdatePublicationInput,
  confirmedSku?: string | null,
): Readonly<{ sku?: string | null; price?: number | null; stock?: number | null }> {
  const variationId = input.target.type === "legacy" ? input.target.variationId : null;
  const variant = input.target.type === "family"
    ? detail.variants.find((item) => item.itemId === input.target.itemId)
    : variationId === null
      ? null
      : detail.variants.find((item) => item.id === String(variationId));
  return {
    sku: confirmedSku === undefined
      ? variant?.sku ?? (variant ? null : getAttributeValue(detail, "SELLER_SKU"))
      : confirmedSku,
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
