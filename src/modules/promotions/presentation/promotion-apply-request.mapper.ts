import type { PromotionApplyRequest, PromotionOption } from "../domain/promotions.repository";
export function promotionOptionToApplyRequest(option: PromotionOption): PromotionApplyRequest {
  const type = option.type?.toUpperCase();
  if (type === "PRICE_DISCOUNT" && option.promotionPrice != null && option.startDate && option.finishDate) return { type, dealPrice: option.promotionPrice, startDate: option.startDate, finishDate: option.finishDate };
  if ((type === "DEAL" || type === "SELLER_CAMPAIGN") && option.id && option.promotionPrice != null) return { type, promotionId: option.id, dealPrice: option.promotionPrice };
  if (type === "SMART" && option.id && option.offerId) return { type, promotionId: option.id, offerId: option.offerId };
  throw new Error("La promoción no tiene los datos requeridos.");
}
