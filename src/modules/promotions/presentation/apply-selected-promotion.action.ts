"use server";

import { revalidatePath } from "next/cache";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import { publicationSourceKey } from "../domain/publication-promotion.model";
import type { PublicationPromotionResult } from "../domain/publication-promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { promotionOptionToApplyRequest } from "./promotion-apply-request.mapper";
import { mapPromotionError, promotionErrorMessage } from "./promotion-error.mapper";
import { canEditPromotionPrice, isExistingPromotion } from "./promotion-bulk-price.helpers";

export type ApplySelectedPromotionInput = Readonly<{
  itemId: string;
  option: PromotionOption;
  selectedPrice: number | null;
}>;

export type ApplySelectedPromotionResult = Readonly<{ ok: true; confirmedPrice?: number | null }> | PromotionActionFailure;

export async function applySelectedPromotion(input: ApplySelectedPromotionInput): Promise<ApplySelectedPromotionResult> {
  const existing = isExistingPromotion(input.option);
  const pricedOption = optionWithSelectedPrice(input.option, input.selectedPrice);
  if (!pricedOption) return { ok: false, message: "El precio elegido no es válido." };

  try {
    const request = promotionOptionToApplyRequest(pricedOption);
    const repository = createPromotionsRepository();
    const sourceKey = publicationSourceKey({
      itemId: input.itemId,
      familyId: null,
    });
    const result = existing ? await repository.updatePrice(sourceKey, request) : await repository.apply(sourceKey, request);
    const itemResult = result.results.find(({ itemId }) => itemId === input.itemId);
    if (!isConfirmedForItem(result, input.itemId, existing ? input.selectedPrice : null)) {
      const errorCode = itemResult?.errorCode ?? result.errorCode ?? "PROMOTION_VERIFICATION_FAILED";
      const friendlyMessage = promotionErrorMessage(errorCode);
      const providerMessage = itemResult?.providerMessage?.trim() ?? result.providerMessage?.trim();
      return {
        ok: false,
        message: providerMessage ? `${friendlyMessage} Mercado Libre: ${providerMessage}` : friendlyMessage,
        diagnosticCode: errorCode,
      };
    }
    revalidatePath("/promociones");
    revalidatePath("/publicacion-promocion");
    return { ok: true, confirmedPrice: itemResult?.confirmedPrice ?? null };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}

function isConfirmedForItem(result: PublicationPromotionResult, itemId: string, updatePrice: number | null): boolean {
  return result.success
    && result.status === "SUCCESS"
    && result.totalItems === 1
    && result.successfulItems === 1
    && result.failedItems === 0
    && result.results.some((item) => item.itemId === itemId && item.success
      && (updatePrice === null || (typeof item.confirmedPrice === "number"
        && Math.round(item.confirmedPrice * 100) === Math.round(updatePrice * 100))));
}

function optionWithSelectedPrice(option: PromotionOption, selectedPrice: number | null): PromotionOption | null {
  if (isExistingPromotion(option) && !canEditPromotionPrice(option)) return null;
  if (!canEditPromotionPrice(option)) return option;
  if (selectedPrice === null || !Number.isFinite(selectedPrice) || selectedPrice <= 0) return null;
  const min = isExistingPromotion(option) ? option.minUpdatePrice ?? null : option.minPromotionPrice;
  const max = isExistingPromotion(option) ? option.maxUpdatePrice ?? null : option.maxPromotionPrice;
  if (min !== null && selectedPrice < min) return null;
  if (max !== null && selectedPrice > max) return null;
  if (isExistingPromotion(option)) {
    const previous = option.currentEditablePrice ?? option.promotionPrice;
    if (previous === null || Math.round(previous * 100) === Math.round(selectedPrice * 100)) return null;
  }
  return { ...option, promotionPrice: selectedPrice };
}
