"use server";
import { revalidatePath } from "next/cache";
import { createPromotionsRepository } from "../promotions.composition.server";
import type { PromotionOption } from "../domain/promotions.repository";
import { promotionOptionToApplyRequest } from "./promotion-apply-request.mapper";
export async function applyPromotion(itemId: string, option: PromotionOption): Promise<{ ok: true } | { ok: false; message: string }> {
  try { await createPromotionsRepository().apply(itemId, promotionOptionToApplyRequest(option)); revalidatePath("/promociones"); return { ok: true }; } catch { return { ok: false, message: "No se pudo aplicar la promoción." }; }
}
