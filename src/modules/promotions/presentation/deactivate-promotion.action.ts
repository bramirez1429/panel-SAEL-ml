"use server";

import { revalidatePath } from "next/cache";

import type { PromotionExecutionActionResult } from "../domain/promotion-action.model";
import { createPromotionsRepository } from "../promotions.composition.server";
import { mapPromotionError } from "./promotion-error.mapper";

export async function deactivatePromotion(
  sourceKey: string,
): Promise<PromotionExecutionActionResult> {
  try {
    const result = await createPromotionsRepository().remove(sourceKey);
    revalidatePath("/promociones");
    return { ok: true, result };
  } catch (error: unknown) {
    return mapPromotionError(error);
  }
}
