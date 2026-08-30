"use client";

import {
  applySelectedPromotion,
  type ApplySelectedPromotionInput,
  type ApplySelectedPromotionResult,
} from "./apply-selected-promotion.action";

type Execute = (input: ApplySelectedPromotionInput) => Promise<ApplySelectedPromotionResult>;
type Wait = (milliseconds: number) => Promise<void>;

const TRANSIENT_CODES = new Set([
  "PROMOTION_TIMEOUT",
  "PROMOTION_PROVIDER_UNAVAILABLE",
]);

export async function applySelectionWithRetry(
  input: ApplySelectedPromotionInput,
  execute: Execute = applySelectedPromotion,
  wait: Wait = waitMilliseconds,
): Promise<ApplySelectedPromotionResult> {
  const firstResult = await execute(input);
  if (firstResult.ok || !isTransient(firstResult.diagnosticCode)) return firstResult;
  await wait(1_000);
  return execute(input);
}

function isTransient(code: string | undefined): boolean {
  return code !== undefined && TRANSIENT_CODES.has(code);
}

function waitMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
