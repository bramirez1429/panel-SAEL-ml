"use client";

import {
  applySelectedPromotion,
  type ApplySelectedPromotionInput,
  type ApplySelectedPromotionResult,
} from "./apply-selected-promotion.action";

type Execute = (input: ApplySelectedPromotionInput) => Promise<ApplySelectedPromotionResult>;

export async function applySelectionWithRetry(
  input: ApplySelectedPromotionInput,
  execute: Execute = applySelectedPromotion,
): Promise<ApplySelectedPromotionResult> {
  return execute(input);
}
