"use server";

import type { PromotionPreviewActionResult } from "../domain/promotion-action.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { createPromotionsRepository } from "../promotions.composition.server";
import { mapPromotionError } from "./promotion-error.mapper";
import { promotionOptionToApplyRequest } from "./promotion-apply-request.mapper";

export async function getPromotionPreview(
  sourceKey: string,
  option: PromotionOption,
): Promise<PromotionPreviewActionResult> {
  try {
    const preview = await createPromotionsRepository().preview(
      sourceKey,
      promotionOptionToApplyRequest(option),
    );
    return { ok: true, preview };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}
