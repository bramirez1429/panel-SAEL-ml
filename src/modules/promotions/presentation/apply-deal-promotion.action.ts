"use server";

import { revalidatePath } from "next/cache";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import {
  publicationSourceKey,
  previewAllowsApplication,
} from "../domain/publication-promotion.model";
import type { PromotionApplyRequest } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { mapPromotionError } from "./promotion-error.mapper";

export type ApplyDealPromotionInput = Readonly<{
  itemId: string;
  promotionId: string;
  dealPrice: number;
}>;

export type ApplyDealPromotionResult =
  | Readonly<{ ok: true }>
  | PromotionActionFailure;

export async function applyDealPromotion(
  input: ApplyDealPromotionInput,
): Promise<ApplyDealPromotionResult> {
  if (!validInput(input)) {
    return { ok: false, message: "El precio elegido no es válido." };
  }

  const sourceKey = publicationSourceKey({ itemId: input.itemId, familyId: null });
  const request: PromotionApplyRequest = {
    type: "DEAL",
    promotionId: input.promotionId,
    dealPrice: input.dealPrice,
  };

  try {
    const repository = createPromotionsRepository();
    const preview = await repository.preview(sourceKey, request);
    if (!previewAllowsApplication(preview)) {
      return {
        ok: false,
        message: "La publicación ya no está disponible para aplicar esta promoción.",
      };
    }

    const result = await repository.apply(sourceKey, request);
    if (!result.success) {
      return {
        ok: false,
        message: "Mercado Libre no pudo aplicar la promoción a la publicación.",
        ...(result.errorCode ? { diagnosticCode: result.errorCode } : {}),
      };
    }

    revalidatePath("/promociones");
    return { ok: true };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}

function validInput(input: ApplyDealPromotionInput): boolean {
  return Boolean(
    input.itemId.trim() &&
    input.promotionId.trim() &&
    Number.isFinite(input.dealPrice) &&
    input.dealPrice > 0,
  );
}
