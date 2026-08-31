"use server";

import { revalidatePath } from "next/cache";

import type { PromotionExecutionActionResult } from "../domain/promotion-action.model";
import {
  publicationSourceKey,
  type PublicationPromotionResult,
} from "../domain/publication-promotion.model";
import { promotionOptionToRemovalSelection } from "../domain/promotion-removal.mapper";
import type { PromotionOption } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { mapPromotionError, promotionErrorMessage } from "./promotion-error.mapper";

export type DeactivateSelectedPromotionInput = Readonly<{
  itemId: string;
  option: PromotionOption;
}>;

export async function deactivateSelectedPromotion(
  input: DeactivateSelectedPromotionInput,
): Promise<PromotionExecutionActionResult> {
  const itemId = input.itemId.trim().toUpperCase();
  const selection = promotionOptionToRemovalSelection(input.option);
  const removableStatus = input.option.status === "started" || input.option.status === "pending";
  if (!/^MLA\d+$/.test(itemId) || !selection || !input.option.canRemove || !removableStatus) {
    return { ok: false, message: "No se pudo identificar la promoción a quitar." };
  }

  try {
    const sourceKey = publicationSourceKey({ itemId, familyId: null });
    const result = await createPromotionsRepository().removeSelected(sourceKey, selection);
    if (!result.success) return removalFailure(result);

    revalidatePath("/promociones");
    return { ok: true, result };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}

function removalFailure(result: PublicationPromotionResult): PromotionExecutionActionResult {
  const failedItem = result.results.find((item) => !item.success);
  const errorCode = result.errorCode ?? failedItem?.errorCode ?? "PROMOTION_REMOVAL_FAILED";
  const providerMessage = (result.providerMessage ?? failedItem?.providerMessage)?.trim();
  const friendlyMessage = promotionErrorMessage(errorCode);
  return {
    ok: false,
    message: providerMessage
      ? `${friendlyMessage} Mercado Libre: ${providerMessage}`
      : friendlyMessage,
    ...(errorCode ? { diagnosticCode: errorCode } : {}),
  };
}
