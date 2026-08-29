"use server";

import { revalidatePath } from "next/cache";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import { previewAllowsApplication, publicationSourceKey } from "../domain/publication-promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { promotionOptionToApplyRequest } from "./promotion-apply-request.mapper";
import { mapPromotionError, promotionErrorMessage } from "./promotion-error.mapper";

export type ApplySelectedPromotionInput = Readonly<{
  itemId: string;
  option: PromotionOption;
  selectedPrice: number | null;
}>;

export type ApplySelectedPromotionResult = Readonly<{ ok: true }> | PromotionActionFailure;

export async function applySelectedPromotion(input: ApplySelectedPromotionInput): Promise<ApplySelectedPromotionResult> {
  const pricedOption = optionWithSelectedPrice(input.option, input.selectedPrice);
  if (!pricedOption) return { ok: false, message: "El precio elegido no es válido." };

  try {
    const request = promotionOptionToApplyRequest(pricedOption);
    const repository = createPromotionsRepository();
    const sourceKey = publicationSourceKey({ itemId: input.itemId, familyId: null });
    const preview = await repository.preview(sourceKey, request);
    if (!previewAllowsApplication(preview)) {
      return { ok: false, message: "La publicación ya no está disponible para aplicar esta promoción." };
    }
    const result = await repository.apply(sourceKey, request);
    if (!result.success) {
      return {
        ok: false,
        message: promotionErrorMessage(result.errorCode ?? "PROMOTION_APPLICATION_FAILED"),
        ...(result.errorCode ? { diagnosticCode: result.errorCode } : {}),
      };
    }
    revalidatePath("/promociones");
    return { ok: true };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}

function optionWithSelectedPrice(option: PromotionOption, selectedPrice: number | null): PromotionOption | null {
  if (option.requiresPriceSelection !== true) return option;
  if (selectedPrice === null || !Number.isFinite(selectedPrice) || selectedPrice <= 0) return null;
  if (option.minPromotionPrice !== null && selectedPrice < option.minPromotionPrice) return null;
  if (option.maxPromotionPrice !== null && selectedPrice > option.maxPromotionPrice) return null;
  return { ...option, promotionPrice: selectedPrice };
}
