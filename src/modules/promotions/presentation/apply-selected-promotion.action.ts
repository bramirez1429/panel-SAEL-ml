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
  const existingPromotion = isExistingPromotion(input.option);
  const pricedOption = optionWithSelectedPrice(input.option, input.selectedPrice);
  if (!pricedOption) return { ok: false, message: "El precio elegido no es válido." };

  try {
    const request = promotionOptionToApplyRequest(pricedOption);
    const repository = createPromotionsRepository();
    const sourceKey = publicationSourceKey({
      itemId: input.itemId,
      familyId: null,
    });
    const result = existingPromotion
      ? await repository.updatePrice(sourceKey, request)
      : await repository.apply(sourceKey, request);
    const itemResult = result.results.find(({ itemId }) => itemId === input.itemId);
    if (!isConfirmedForItem(result, input.itemId, input.selectedPrice)) {
      const errorCode = itemResult?.errorCode
        ?? result.errorCode
        ?? verificationErrorCode(input.selectedPrice, itemResult?.confirmedPrice);
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

function isConfirmedForItem(result: PublicationPromotionResult, itemId: string, selectedPrice: number | null): boolean {
  const item = result.results.find(({ itemId: resultItemId }) => resultItemId === itemId);
  return result.success
    && result.status === "SUCCESS"
    && result.totalItems === 1
    && result.successfulItems === 1
    && result.failedItems === 0
    && item?.success === true
    && (selectedPrice === null || (typeof item.confirmedPrice === "number" && Math.round(item.confirmedPrice * 100) === Math.round(selectedPrice * 100)));
}

function verificationErrorCode(selectedPrice: number | null, confirmedPrice: number | null | undefined): string {
  if (selectedPrice !== null && confirmedPrice === undefined) return "PROMOTION_VERIFICATION_PENDING";
  return "PROMOTION_PRICE_NOT_CONFIRMED";
}

function optionWithSelectedPrice(option: PromotionOption, selectedPrice: number | null): PromotionOption | null {
  if (isExistingPromotion(option) && (!canEditPromotionPrice(option) || (selectedPrice !== null && Math.round(selectedPrice * 100) === Math.round((option.currentEditablePrice ?? option.promotionPrice ?? 0) * 100)))) return null;
  if (!canEditPromotionPrice(option)) return option;
  if (selectedPrice === null || !Number.isFinite(selectedPrice) || selectedPrice <= 0) return null;
  const minimum = isExistingPromotion(option) ? option.minUpdatePrice ?? null : option.minPromotionPrice;
  const maximum = isExistingPromotion(option) ? option.maxUpdatePrice ?? null : option.maxPromotionPrice;
  if (minimum !== null && selectedPrice < minimum) return null;
  if (maximum !== null && selectedPrice > maximum) return null;
  return { ...option, promotionPrice: selectedPrice };
}
