"use server";

import { revalidatePath } from "next/cache";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import { publicationSourceKey } from "../domain/publication-promotion.model";
import type { PublicationPromotionResult } from "../domain/publication-promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { promotionOptionToApplyRequest } from "./promotion-apply-request.mapper";
import { mapPromotionError, promotionErrorMessage } from "./promotion-error.mapper";
import { canEditPromotionPrice } from "./promotion-bulk-price.helpers";

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
    const sourceKey = publicationSourceKey({
      itemId: input.itemId,
      familyId: null,
    });
    const result = await repository.apply(sourceKey, request);
    const itemResult = result.results.find(({ itemId }) => itemId === input.itemId);
    if (!isConfirmedForItem(result, input.itemId)) {
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
    return { ok: true };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}

function isConfirmedForItem(result: PublicationPromotionResult, itemId: string): boolean {
  return result.success
    && result.status === "SUCCESS"
    && result.totalItems === 1
    && result.successfulItems === 1
    && result.failedItems === 0
    && result.results.some((item) => item.itemId === itemId && item.success);
}

function optionWithSelectedPrice(option: PromotionOption, selectedPrice: number | null): PromotionOption | null {
  if (!canEditPromotionPrice(option)) return option;
  if (selectedPrice === null || !Number.isFinite(selectedPrice) || selectedPrice <= 0) return null;
  if (option.minPromotionPrice !== null && selectedPrice < option.minPromotionPrice) return null;
  if (option.maxPromotionPrice !== null && selectedPrice > option.maxPromotionPrice) return null;
  return { ...option, promotionPrice: selectedPrice };
}
